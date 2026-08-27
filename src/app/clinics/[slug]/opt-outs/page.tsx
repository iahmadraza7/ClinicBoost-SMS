import { formatAuMobile } from "@/lib/mobile";
import { formatSydneyDateTime } from "@/lib/time";
import { requireOperator } from "@/server/auth";
import * as repo from "@/server/repo";
import { notFound } from "next/navigation";
import Link from "next/link";

import { DashboardHeader } from "@/app/dashboard-header";
import { ClinicSectionNav } from "../../clinic-section-nav";

export const dynamic = "force-dynamic";

function describeVia(via: string | null): string {
  if (via === "sms_inbound") return "They texted STOP";
  if (via === "provider") return "The SMS provider refused the send";
  return "Recorded, source not stored";
}

function viaFromAfter(after: unknown): string | null {
  if (!after || typeof after !== "object") return null;
  const via = (after as { via?: unknown }).via;
  return typeof via === "string" ? via : null;
}

export default async function OptOutsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const operator = await requireOperator();
  const { slug } = await params;
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) notFound();

  const [contacts, audits] = await Promise.all([
    repo.contacts.listOptedOut(clinic.id),
    repo.audit.listAudit(clinic.id, { action: "contact.opted_out", limit: 500 }),
  ]);

  const viaByContact = new Map<string, string>();
  for (const row of audits) {
    if (viaByContact.has(row.entityId)) continue;
    const via = viaFromAfter(row.after);
    if (via) viaByContact.set(row.entityId, via);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <DashboardHeader email={operator.email} current="clinics">
        <p className="mt-3 text-sm">
          <Link href="/clinics" className="text-neutral-600 hover:text-neutral-900">
            Clinics
          </Link>
          <span className="text-neutral-400"> / </span>
          <span className="text-neutral-900">{clinic.slug}</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">{clinic.name}</h1>
      </DashboardHeader>

      <ClinicSectionNav slug={clinic.slug} current="opt-outs" />

      <p className="text-sm text-neutral-600">
        Opt-out is per contact per clinic. A STOP for this clinic does not
        opt them out of the others.
      </p>

      {contacts.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          Nobody has opted out.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {contacts.map((contact) => (
            <li key={contact.id} className="px-4 py-3">
              <p className="text-sm font-medium text-neutral-900">
                {formatAuMobile(contact.mobile)}
                {contact.name ? (
                  <span className="ml-2 font-normal text-neutral-600">
                    {contact.name}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                {contact.optedOutAt
                  ? formatSydneyDateTime(contact.optedOutAt)
                  : "Date not stored"}
                {" · "}
                {describeVia(viaByContact.get(contact.id) ?? null)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
