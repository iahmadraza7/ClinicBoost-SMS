import type { NotifyEmailJob } from "../../server/queue/boss";
import * as repo from "../../server/repo";
import { sendQueueNoticeEmail } from "../../server/notify/send-queue-email";

export async function handleNotifyEmail(job: NotifyEmailJob): Promise<void> {
  await sendQueueNoticeEmail(job.clinicId, job.draftId);
}

/**
 * Draft stays pending. notified_at is stamped so the sweep does not retry a
 * send that Resend (or the key) will refuse forever.
 */
export async function handleNotifyEmailFailed(
  job: NotifyEmailJob,
): Promise<void> {
  const { clinicId, draftId } = job;
  const claimed = await repo.drafts.claimNotified(clinicId, draftId);
  if (!claimed) return;

  await repo.audit.recordAudit(clinicId, {
    actor: "worker",
    action: "notify.email_gave_up",
    entityType: "draft",
    entityId: draftId,
    after: { detail: "the email provider could not be reached after every retry" },
  });

  console.error(
    `notify-email: gave up for draft ${draftId} at clinic ${clinicId}`,
  );
}
