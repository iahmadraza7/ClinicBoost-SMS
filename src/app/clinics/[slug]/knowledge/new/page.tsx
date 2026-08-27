import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardHeader } from "@/app/dashboard-header";
import { requireOperator } from "@/server/auth";
import * as repo from "@/server/repo";

import { ClinicSectionNav } from "../../../clinic-section-nav";
import { KbForm } from "../kb-form";

export const dynamic = "force-dynamic";

export default async function NewKbEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const operator = await requireOperator();
  const { slug } = await params;
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) notFound();

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
          <span className="text-neutral-900">new</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">Add a knowledge base entry</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Saving puts it in review. The model cannot use it until you review it,
          in case something wrong would poison the knowledge base.
        </p>
      </DashboardHeader>

      <ClinicSectionNav slug={clinic.slug} current="knowledge" />

      {clinic.archivedAt ? (
        <p className="text-sm text-neutral-600">
          Restore this clinic before adding entries.
        </p>
      ) : (
        <KbForm mode="create" slug={clinic.slug} clinicSlug={clinic.slug} />
      )}
    </main>
  );
}
