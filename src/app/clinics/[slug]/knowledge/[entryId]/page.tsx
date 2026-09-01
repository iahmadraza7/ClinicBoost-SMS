import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/app/dashboard-header";
import { formatSydneyDateTime } from "@/lib/time";
import { requireOperator } from "@/server/auth";
import { ANSWER_MODE_CHOICES, ENTRY_KIND_CHOICES } from "@/server/kb/fields";
import * as repo from "@/server/repo";

import { ClinicSectionNav } from "../../../clinic-section-nav";
import { ArchiveKbControls, ReviewControls } from "../kb-controls";
import { KbForm } from "../kb-form";

export const dynamic = "force-dynamic";

export default async function KbEntryPage({
  params,
}: {
  params: Promise<{ slug: string; entryId: string }>;
}) {
  const operator = await requireOperator();
  const { slug, entryId } = await params;
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) notFound();

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) notFound();

  const archivedClinic = Boolean(clinic.archivedAt);
  const archivedEntry = entry.status === "archived";
  const readOnly = archivedClinic || archivedEntry;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <DashboardHeader email={operator.email} current="clinics">
        <p className="mt-3 text-sm">
          <Link href="/clinics" className="text-neutral-600 hover:text-neutral-900">
            Clinics
          </Link>
          <span className="text-neutral-400"> / </span>
          <Link
            href={`/clinics/${clinic.slug}/knowledge`}
            className="text-neutral-600 hover:text-neutral-900"
          >
            {clinic.slug}
          </Link>
          <span className="text-neutral-400"> / </span>
          <span className="font-mono text-neutral-900">{entry.entryKey}</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">{entry.title}</h1>
        {entry.status === "pending_review" && (
          <p className="mt-2 text-sm font-medium text-amber-700">
            Waiting for review. The model cannot use this entry yet.
          </p>
        )}
        {entry.status === "active" && entry.reviewedBy && (
          <p className="mt-2 text-sm text-neutral-600">
            {`Reviewed by ${entry.reviewedBy}${
              entry.reviewedAt
                ? ` on ${formatSydneyDateTime(entry.reviewedAt)}`
                : ""
            }. Saving again sends it back to review.`}
          </p>
        )}
        {archivedEntry && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Archived. The model ignores this entry. Restore it to edit or
            review.
          </p>
        )}
      </DashboardHeader>

      <ClinicSectionNav slug={clinic.slug} current="knowledge" />

      {!readOnly && entry.status === "pending_review" && (
        <div className="mb-8">
          <ReviewControls slug={clinic.slug} entryId={entry.id} />
        </div>
      )}

      {readOnly ? (
        <div className="space-y-4 text-sm text-neutral-700">
          <p>
            <span className="font-medium text-neutral-900">Category. </span>
            {entry.category}
          </p>
          <p>
            <span className="font-medium text-neutral-900">What it is. </span>
            {ENTRY_KIND_CHOICES.find((c) => c.value === entry.entryKind)
              ?.title ?? entry.entryKind}
          </p>
          <p>
            <span className="font-medium text-neutral-900">How it is used. </span>
            {ANSWER_MODE_CHOICES.find((c) => c.value === entry.answerMode)
              ?.title ?? entry.answerMode}
          </p>
          <p className="whitespace-pre-wrap">{entry.body}</p>
          {archivedEntry && !archivedClinic && (
            <div className="border-t border-neutral-200 pt-6">
              <ArchiveKbControls
                slug={clinic.slug}
                entryId={entry.id}
                archived
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <KbForm
            mode="edit"
            slug={clinic.slug}
            clinicSlug={clinic.slug}
            entry={{
              id: entry.id,
              entryKey: entry.entryKey,
              category: entry.category,
              title: entry.title,
              body: entry.body,
              answerMode: entry.answerMode,
              entryKind: entry.entryKind,
              blockDeflect: entry.blockDeflect,
              triggerTerms: entry.triggerTerms,
              status: entry.status,
            }}
          />
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <h2 className="text-sm font-medium text-neutral-900">Archive</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Stops the model using this entry. The row stays in the table.
            </p>
            <div className="mt-3">
              <ArchiveKbControls
                slug={clinic.slug}
                entryId={entry.id}
                archived={false}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
