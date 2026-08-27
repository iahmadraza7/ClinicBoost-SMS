import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/app/dashboard-header";
import { requireOperator } from "@/server/auth";
import {
  ANSWER_MODE_CHOICES,
  DO_NOT_ANSWER_GAP,
  KB_CATEGORIES,
  KB_CATEGORY_ORDER,
  hasDoNotAnswerCoverage,
} from "@/server/kb/fields";
import type { AnswerMode, KbCategory, KbEntry } from "@/server/db/schema";
import * as repo from "@/server/repo";

import { ClinicSectionNav } from "../../clinic-section-nav";
import { CsvUpload } from "./csv-upload";

export const dynamic = "force-dynamic";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const operator = await requireOperator();
  const { slug } = await params;
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) notFound();

  const entries = await repo.kb.listKbEntries(clinic.id);
  const pending = entries.filter((e) => e.status === "pending_review");
  const active = entries.filter((e) => e.status === "active");
  const archived = entries.filter((e) => e.status === "archived");
  const showGap = !hasDoNotAnswerCoverage(entries);

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
          <span className="text-neutral-900">knowledge</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">{clinic.name}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {entries.length === 0
            ? "No knowledge base entries yet."
            : `${active.length} active, ${pending.length} waiting for review.`}
        </p>
      </DashboardHeader>

      <ClinicSectionNav slug={clinic.slug} current="knowledge" />

      {showGap && (
        <p className="mb-6 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {DO_NOT_ANSWER_GAP}
        </p>
      )}

      {clinic.archivedAt ? (
        <p className="mb-6 text-sm text-neutral-600">
          This clinic is archived. Restore it before adding or reviewing
          entries.
        </p>
      ) : (
        <>
          <CsvUpload slug={clinic.slug} />
          <div className="mb-6 flex justify-end">
            <Link
              href={`/clinics/${clinic.slug}/knowledge/new`}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
            >
              Add entry
            </Link>
          </div>
        </>
      )}

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-medium text-amber-900">
            Waiting for review
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Not usable by the model until you open the entry and review it.
          </p>
          <div className="mt-3">
            <EntryList slug={clinic.slug} entries={pending} />
          </div>
        </section>
      )}

      {KB_CATEGORY_ORDER.map((category) => {
        const group = active.filter((e) => e.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} className="mb-8">
            <h2 className="text-sm font-medium text-neutral-700">
              {categoryLabel(category)}
            </h2>
            <div className="mt-3">
              <EntryList slug={clinic.slug} entries={group} />
            </div>
          </section>
        );
      })}

      {active.length === 0 && pending.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-600">
          None yet.
          {!clinic.archivedAt && (
            <>
              {" "}
              <Link
                href={`/clinics/${clinic.slug}/knowledge/new`}
                className="underline"
              >
                Add an entry
              </Link>
              .
            </>
          )}
        </p>
      )}

      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-neutral-700">Archived</h2>
          <p className="mt-1 text-sm text-neutral-600">
            The model ignores these. Nothing is deleted.
          </p>
          <div className="mt-3">
            <EntryList slug={clinic.slug} entries={archived} />
          </div>
        </section>
      )}
    </main>
  );
}

function EntryList({ slug, entries }: { slug: string; entries: KbEntry[] }) {
  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {entries.map((entry) => {
        const mode = ANSWER_MODE_CHOICES.find((c) => c.value === entry.answerMode);
        return (
          <li key={entry.id}>
            <Link
              href={`/clinics/${slug}/knowledge/${entry.id}`}
              className="flex flex-col gap-1 px-4 py-3 hover:bg-neutral-50 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {entry.title}
                </p>
                <p className="mt-0.5 font-mono text-xs text-neutral-500">
                  {entry.entryKey}
                </p>
              </div>
              <p className="text-sm text-neutral-600 sm:text-right">
                {modeTitle(entry.answerMode, mode?.title)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function categoryLabel(category: KbCategory): string {
  return KB_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

function modeTitle(mode: AnswerMode, title: string | undefined): string {
  return title ?? mode;
}
