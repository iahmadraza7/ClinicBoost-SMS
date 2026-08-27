import { enqueueNotifyEmail } from "../../server/queue/boss";
import { escalateUnattendedDraft } from "../../server/notify/escalate";
import * as repo from "../../server/repo";

/**
 * One pass across every clinic. Emails that never left after the draft was
 * committed get another enqueue (singleton-keyed by draft id). SMS alerts fire
 * only for pending drafts older than that clinic's unattended window.
 */
export async function handleUnattendedSweep(): Promise<void> {
  const clinics = await repo.clinics.listClinics();
  const now = Date.now();

  for (const clinic of clinics) {
    const unnotified = await repo.drafts.listUnnotifiedPending(clinic.id);
    for (const draft of unnotified) {
      try {
        await enqueueNotifyEmail({ clinicId: clinic.id, draftId: draft.id });
      } catch (error) {
        console.error(
          `unattended-sweep: could not enqueue notify-email for ${draft.id}:`,
          error,
        );
      }
    }

    const cutoff = new Date(now - clinic.unattendedMinutes * 60 * 1000);
    const waiting = await repo.drafts.listUnattendedPending(clinic.id, cutoff);
    for (const draft of waiting) {
      try {
        await escalateUnattendedDraft(clinic.id, draft.id);
      } catch (error) {
        console.error(
          `unattended-sweep: escalate failed for ${draft.id}:`,
          error,
        );
      }
    }
  }
}
