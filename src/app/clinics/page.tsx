import Link from "next/link";

import { DashboardHeader } from "@/app/dashboard-header";
import { requireOperator } from "@/server/auth";
import { CLOSE_TYPE_CHOICES } from "@/server/clinics/fields";
import * as repo from "@/server/repo";

import { SmsStatus } from "./sms-status";

export const dynamic = "force-dynamic";

export default async function ClinicsPage() {
  const operator = await requireOperator();
  const clinics = await repo.clinics.listAllClinics();
  const live = clinics.filter((c) => !c.archivedAt);
  const archived = clinics.filter((c) => c.archivedAt);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <DashboardHeader email={operator.email} current="clinics">
        <h1 className="mt-3 text-xl font-semibold">Clinics</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {live.length === 1
            ? "1 live clinic."
            : `${live.length} live clinics.`}
          {archived.length > 0
            ? ` ${archived.length} archived.`
            : ""}
        </p>
      </DashboardHeader>

      <div className="mb-4 flex justify-end">
        <Link
          href="/clinics/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
        >
          Add clinic
        </Link>
      </div>

      <ClinicTable clinics={live} />

      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-neutral-700">Archived</h2>
          <p className="mt-1 text-sm text-neutral-600">
            The widget and the queue ignore these. Nothing is deleted.
          </p>
          <div className="mt-3">
            <ClinicTable clinics={archived} archived />
          </div>
        </section>
      )}
    </main>
  );
}

function ClinicTable({
  clinics,
  archived = false,
}: {
  clinics: Awaited<ReturnType<typeof repo.clinics.listAllClinics>>;
  archived?: boolean;
}) {
  if (clinics.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-600">
        None yet.{" "}
        <Link href="/clinics/new" className="underline">
          Add a clinic
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-300 bg-white">
      {clinics.map((clinic) => {
        const close = clinic.closeType
          ? CLOSE_TYPE_CHOICES.find((c) => c.value === clinic.closeType)
          : null;
        return (
          <li key={clinic.id}>
            <Link
              href={`/clinics/${clinic.slug}`}
              className="flex flex-col gap-1 px-4 py-3 hover:bg-neutral-50 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {clinic.name}
                  {clinic.killSwitch && !archived && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-normal text-red-700">
                      kill switch on
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-neutral-600">
                  {clinic.location}
                </p>
              </div>
              <div className="sm:text-right">
                <SmsStatus smsNumber={clinic.smsNumber} size="xs" />
                <p className="mt-1 text-sm text-neutral-600">
                  {close?.title ?? (clinic.closeType ? clinic.closeType : "Close type not set")}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
