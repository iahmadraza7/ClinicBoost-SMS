import { formatSydneyDateTime, formatSydneyTime } from "@/lib/time";
import * as repo from "@/server/repo";
import { env } from "@/server/env";
import { QueueList, type QueueRow } from "./queue-list";

export const dynamic = "force-dynamic";

/**
 * There is no cross-clinic query. The dashboard asks each clinic for its own
 * pending queue and merges the results here, newest first.
 */
async function loadQueue(): Promise<QueueRow[]> {
  const clinics = await repo.clinics.listClinics();

  const perClinic = await Promise.all(
    clinics.map(async (clinic) => {
      const items = await repo.drafts.listQueue(clinic.id);
      return items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        receivedTime: formatSydneyTime(item.createdAt),
        receivedDateTime: formatSydneyDateTime(item.createdAt),
        clinicName: clinic.name,
        clinicSlug: clinic.slug,
        closeType: clinic.closeType,
        killSwitch: clinic.killSwitch,
      }));
    }),
  );

  return perClinic
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default async function QueuePage() {
  const rows = await loadQueue();

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">Approval queue</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {rows.length === 0
              ? "Nothing waiting."
              : `${rows.length} waiting, newest first.`}
          </p>
        </div>
        <p className="text-xs text-neutral-500">
          Approving records the decision. Sending is not wired up yet.
        </p>
      </header>

      <QueueList rows={rows} maxSegments={env.MAX_SEGMENTS_PER_DRAFT} />
    </main>
  );
}
