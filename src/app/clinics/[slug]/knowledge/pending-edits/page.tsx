import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/app/dashboard-header";
import { requireOperator } from "@/server/auth";
import * as repo from "@/server/repo";

import { ClinicSectionNav } from "../../../clinic-section-nav";
import { PendingEditControls } from "./pending-controls";

export const dynamic = "force-dynamic";

export default async function PendingEditsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const operator = await requireOperator();
  const { slug } = await params;
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) notFound();

  const suggestions = await repo.kb.listPendingEditSuggestions(clinic.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <DashboardHeader email={operator.email} current="clinics">
        <p className="mt-3 text-sm">
          <Link href="/clinics" className="text-neutral-600 hover:text-neutral-900">
            Clinics
          </Link>
          <span className="text-neutral-400"> / </span>
          <Link
            href={`/clinics/${clinic.slug}`}
            className="text-neutral-600 hover:text-neutral-900"
          >
            {clinic.slug}
          </Link>
          <span className="text-neutral-400"> / </span>
          <span className="text-neutral-900">pending edits</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">Pending edits</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Suggestions from queue edits. Nothing enters the live knowledge base
          until you approve it here.
        </p>
      </DashboardHeader>

      <ClinicSectionNav slug={clinic.slug} current="pending-edits" />

      {suggestions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          No operator-edit suggestions waiting.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-300 bg-white">
          {suggestions.map((entry) => (
            <li key={entry.id} className="px-4 py-4">
              <p className="text-sm font-medium text-neutral-900">{entry.title}</p>
              <p className="mt-0.5 font-mono text-xs text-neutral-500">
                {entry.entryKey}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-800">
                {entry.body}
              </p>
              <div className="mt-3">
                <PendingEditControls
                  slug={clinic.slug}
                  entryId={entry.id}
                  archivedClinic={Boolean(clinic.archivedAt)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
