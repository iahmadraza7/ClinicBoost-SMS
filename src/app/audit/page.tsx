import { formatSydneyDateTime } from "@/lib/time";
import { requireOperator } from "@/server/auth";
import { AUDIT_ACTIONS, auditDetail } from "@/server/audit/actions";
import * as repo from "@/server/repo";

import { DashboardHeader } from "../dashboard-header";
import { RevertButton } from "./revert-button";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string; action?: string }>;
}) {
  const operator = await requireOperator();
  const { clinic: clinicSlug, action: actionRaw } = await searchParams;
  const action = AUDIT_ACTIONS.includes(
    actionRaw as (typeof AUDIT_ACTIONS)[number],
  )
    ? actionRaw
    : undefined;

  const clinics = await repo.clinics.listAllClinics();
  const selected = clinicSlug
    ? clinics.filter((c) => c.slug === clinicSlug)
    : clinics;

  const perClinic = await Promise.all(
    selected.map(async (clinic) => {
      const rows = await repo.audit.listAudit(clinic.id, {
        limit: clinicSlug ? 200 : 50,
        action,
      });
      return rows.map((row) => ({
        id: row.id,
        clinicId: clinic.id,
        clinicName: clinic.name,
        actor: row.actor,
        action: row.action,
        detail: auditDetail(row.action, row.after),
        at: formatSydneyDateTime(row.createdAt),
        createdAt: row.createdAt.toISOString(),
        revertible:
          row.action === "draft.dismissed" || row.action === "draft.redrafted",
      }));
    }),
  );

  const rows = perClinic
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <DashboardHeader email={operator.email} current="audit">
        <h1 className="mt-3 text-xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Every approve, edit, dismiss, redraft, send and knowledge base
          change. Dismiss and redraft can be reverted. Newest first.
        </p>
      </DashboardHeader>

      <form action="/audit" className="mb-4 flex flex-wrap gap-3" method="get">
        <label className="text-sm">
          <span className="sr-only">Clinic</span>
          <select
            name="clinic"
            defaultValue={clinicSlug ?? ""}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.slug}>
                {clinic.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">Action</span>
          <select
            name="action"
            defaultValue={action ?? ""}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          Nothing matches.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-300 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-300 bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Clinic</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Detail</th>
                <th className="px-4 py-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-neutral-700">
                    {row.at}
                  </td>
                  <td className="px-4 py-2 text-neutral-900">{row.clinicName}</td>
                  <td className="px-4 py-2 text-neutral-700">{row.actor}</td>
                  <td className="px-4 py-2 font-mono text-xs text-neutral-800">
                    {row.action}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{row.detail}</td>
                  <td className="px-4 py-2">
                    {row.revertible && (
                      <RevertButton clinicId={row.clinicId} auditId={row.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
