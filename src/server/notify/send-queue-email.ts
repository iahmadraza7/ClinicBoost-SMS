import { env } from "../env";
import * as repo from "../repo";
import { decideQueueEmail } from "./decide";
import { EmailError, getEmailAdapter } from "./email";
import { buildQueueEmail, queueNotice } from "./notice";

/**
 * Sends the queue-landing email for one pending draft, then stamps
 * notified_at. The payload is built from the clinic name and APP_URL only.
 */
export async function sendQueueNoticeEmail(
  clinicId: string,
  draftId: string,
): Promise<void> {
  const draft = await repo.drafts.getDraft(clinicId, draftId);
  if (!draft || draft.state !== "pending") return;
  if (draft.notifiedAt) return;

  const clinic = await repo.clinics.getClinic(clinicId);
  if (!clinic) {
    console.error(`notify-email: clinic ${clinicId} missing for draft ${draftId}`);
    return;
  }

  const decision = decideQueueEmail({
    notifyEmail: clinic.notifyEmail,
    operatorEmail: env.OPERATOR_NOTIFY_EMAIL,
  });

  if (decision === "claim_without_sending") {
    const claimed = await repo.drafts.claimNotified(clinicId, draftId);
    if (claimed) {
      await repo.audit.recordAudit(clinicId, {
        actor: "worker",
        action: "notify.email_skipped",
        entityType: "draft",
        entityId: draftId,
        after: {
          reason: clinic.notifyEmail ? "no_operator_email" : "notify_email_off",
        },
      });
    }
    return;
  }

  const operatorEmail = env.OPERATOR_NOTIFY_EMAIL;
  if (!operatorEmail) return;

  const notice = queueNotice({ name: clinic.name }, env.APP_URL);
  const email = buildQueueEmail({
    notice,
    from: env.RESEND_FROM,
    to: operatorEmail,
    idempotencyKey: `queue-notice/${draftId}`,
  });

  const adapter = getEmailAdapter();

  try {
    const receipt = await adapter.send(email);
    const claimed = await repo.drafts.claimNotified(clinicId, draftId);
    if (!claimed) return;

    await repo.audit.recordAudit(clinicId, {
      actor: "worker",
      action: "notify.emailed",
      entityType: "draft",
      entityId: draftId,
      after: { provider: adapter.name, provider_message_id: receipt.id },
    });
  } catch (error) {
    if (error instanceof EmailError && !error.retryable) {
      const claimed = await repo.drafts.claimNotified(clinicId, draftId);
      if (claimed) {
        await repo.audit.recordAudit(clinicId, {
          actor: "worker",
          action: "notify.email_failed",
          entityType: "draft",
          entityId: draftId,
          after: { provider: adapter.name, error: error.message },
        });
      }
      return;
    }
    throw error;
  }
}
