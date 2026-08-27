import { formatPeriodMonth } from "@/lib/time";
import { requireOperator } from "@/server/auth";
import { gatherHealth } from "@/server/health";
import type { HealthCheck } from "@/server/health/status";
import * as repo from "@/server/repo";
import { currentPeriodMonth } from "@/server/repo/usage";

import { DashboardHeader } from "./dashboard-header";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const operator = await requireOperator();
  const period = currentPeriodMonth();
  const [health, clinics] = await Promise.all([
    gatherHealth(),
    repo.clinics.listClinics(),
  ]);

  const usage = await Promise.all(
    clinics.map(async (clinic) => {
      const row = await repo.usage.getUsage(clinic.id, period);
      return {
        slug: clinic.slug,
        name: clinic.name,
        segmentsIn: row?.segmentsIn ?? 0,
        segmentsOut: row?.segmentsOut ?? 0,
        aiCalls: row?.aiCalls ?? 0,
      };
    }),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <DashboardHeader email={operator.email} current="home">
        <h1 className="mt-3 text-xl font-semibold">ClinicBoost SMS</h1>
        <p className="mt-1 text-sm text-neutral-600">
          If something has stopped, start here. A dead credential is more
          likely than a code bug.
        </p>
      </DashboardHeader>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <h2 className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900">
          Health
        </h2>
        <ul className="divide-y divide-neutral-100">
          {health.map((check) => (
            <HealthRow key={check.id} check={check} />
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-neutral-900">
          Usage this month
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {formatPeriodMonth(period)}, Sydney. Segments are what Mobile Message
          bills. AI calls are Claude drafts.
        </p>
        <UsageTable rows={usage} />
      </section>
    </main>
  );
}

function HealthRow({ check }: { check: HealthCheck }) {
  const mark =
    check.tone === "ok"
      ? "bg-green-600"
      : check.tone === "amber"
        ? "bg-amber-500"
        : "bg-red-600";
  const text =
    check.tone === "ok"
      ? "text-neutral-800"
      : check.tone === "amber"
        ? "text-amber-800"
        : "text-red-700";

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${mark}`}
        aria-hidden
      />
      <div>
        <p className="text-sm font-medium text-neutral-900">{check.label}</p>
        <p className={`mt-0.5 text-sm ${text}`}>{check.detail}</p>
      </div>
    </li>
  );
}

function UsageTable({
  rows,
}: {
  rows: {
    slug: string;
    name: string;
    segmentsIn: number;
    segmentsOut: number;
    aiCalls: number;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-600">
        No live clinics.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 text-xs text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Clinic</th>
            <th className="px-4 py-2 font-medium">Segments in</th>
            <th className="px-4 py-2 font-medium">Segments out</th>
            <th className="px-4 py-2 font-medium">AI calls</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.slug}>
              <td className="px-4 py-2 text-neutral-900">{row.name}</td>
              <td className="px-4 py-2 tabular-nums text-neutral-700">
                {row.segmentsIn}
              </td>
              <td className="px-4 py-2 tabular-nums text-neutral-700">
                {row.segmentsOut}
              </td>
              <td className="px-4 py-2 tabular-nums text-neutral-700">
                {row.aiCalls}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
