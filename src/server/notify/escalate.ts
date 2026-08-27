import { env } from "../env";
import * as repo from "../repo";
import { queueOutboundReply, startSending } from "../sms/dispatch";
import { decideEscalation } from "./decide";
import { queueNotice, renderQueueSms } from "./notice";
import { getOrCreateOperatorThread } from "./thread";

/**
 * SMS-escalates one pending draft that has sat past the clinic's unattended
 * window. The text goes through the same persist-then-enqueue path as a
 * customer reply, so it is metered on usage_counters. The destination is the
 * operator mobile, on a sentinel thread that the AI never reads.
 */
export async function escalateUnattendedDraft(
  clinicId: string,
  draftId: string,
): Promise<void> {
  const draft = await repo.drafts.getDraft(clinicId, draftId);
  if (!draft || draft.state !== "pending") return;
  if (draft.escalatedAt) return;

  const clinic = await repo.clinics.getClinic(clinicId);
  if (!clinic) {
    console.error(`unattended: clinic ${clinicId} missing for draft ${draftId}`);
    return;
  }

  const decision = decideEscalation({
    globalKillSwitch: env.GLOBAL_KILL_SWITCH,
    notifySms: clinic.notifySms,
    operatorMobile: env.OPERATOR_NOTIFY_MOBILE,
  });

  if (decision === "defer") return;

  if (decision === "claim_without_sending") {
    const claimed = await repo.drafts.claimEscalated(clinicId, draftId);
    if (claimed) {
      await repo.audit.recordAudit(clinicId, {
        actor: "worker",
        action: "notify.sms_skipped",
        entityType: "draft",
        entityId: draftId,
        after: {
          reason: clinic.notifySms ? "no_operator_mobile" : "notify_sms_off",
        },
      });
    }
    return;
  }

  const notice = queueNotice({ name: clinic.name }, env.APP_URL);
  const body = renderQueueSms(notice);

  const messageId = await repo.withTransaction(async (tx) => {
    const claimed = await repo.drafts.claimEscalated(clinicId, draftId, tx);
    if (!claimed) return null;

    const conversation = await getOrCreateOperatorThread(clinicId, tx);
    const message = await queueOutboundReply(
      clinicId,
      { conversationId: conversation.id, body },
      tx,
    );

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: "worker",
        action: "notify.sms_enqueued",
        entityType: "draft",
        entityId: draftId,
        after: { outbound_message_id: message.id },
      },
      tx,
    );

    return message.id;
  });

  if (messageId) {
    await startSending(clinicId, messageId, "worker", "operator_alert");
  }
}
