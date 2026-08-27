import Link from "next/link";

import { DashboardHeader } from "@/app/dashboard-header";
import { requireOperator } from "@/server/auth";

import { ClinicForm } from "../clinic-form";

export const dynamic = "force-dynamic";

export default async function NewClinicPage() {
  const operator = await requireOperator();

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <DashboardHeader email={operator.email} current="clinics">
        <p className="mt-3 text-sm">
          <Link href="/clinics" className="text-neutral-600 hover:text-neutral-900">
            Clinics
          </Link>
          <span className="text-neutral-400"> / </span>
          <span className="text-neutral-900">New</span>
        </p>
        <h1 className="mt-2 text-xl font-semibold">Add a clinic</h1>
        <p className="mt-1 text-sm text-neutral-600">
          The Schedule 4 blocked terms baseline is copied in on create. Knowledge
          base entries and booking URLs are a later step.
        </p>
      </DashboardHeader>

      <ClinicForm mode="create" />
    </main>
  );
}
