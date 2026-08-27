"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOperator } from "@/server/auth";
import {
  clinicAuditShape,
  clinicFieldsFromForm,
  clinicSlugSchema,
} from "@/server/clinics/fields";
import { S4_BASELINE_TERMS } from "@/server/compliance/s4-baseline";
import * as repo from "@/server/repo";

export type ClinicActionState =
  | { error: string }
  | { saved: true }
  | null;

function revalidateClinic(slug: string) {
  revalidatePath("/clinics");
  revalidatePath(`/clinics/${slug}`);
  revalidatePath("/queue");
}

export async function createClinic(
  _prev: ClinicActionState,
  form: FormData,
): Promise<ClinicActionState> {
  const operator = await requireOperator();

  const slugParsed = clinicSlugSchema.safeParse(form.get("slug"));
  if (!slugParsed.success) {
    return { error: slugParsed.error.issues[0]?.message ?? "Invalid slug" };
  }
  const slug = slugParsed.data;

  const parsed = clinicFieldsFromForm(form);
  if (!parsed.fields) return { error: parsed.error ?? "Invalid clinic" };

  const existing = await repo.clinics.getClinicBySlug(slug);
  if (existing) {
    return { error: `A clinic with slug "${slug}" already exists` };
  }

  const fields = parsed.fields;

  await repo.withTransaction(async (tx) => {
    const clinic = await repo.clinics.createClinic(
      { slug, ...fields },
      tx,
    );

    await repo.blockedTerms.addBlockedTerms(clinic.id, S4_BASELINE_TERMS, tx);

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "clinic.created",
        entityType: "clinic",
        entityId: clinic.id,
        after: clinicAuditShape(clinic),
      },
      tx,
    );
  });

  revalidateClinic(slug);
  redirect(`/clinics/${slug}`);
}

export async function updateClinic(
  slug: string,
  _prev: ClinicActionState,
  form: FormData,
): Promise<ClinicActionState> {
  const operator = await requireOperator();

  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before editing it" };
  }

  const parsed = clinicFieldsFromForm(form);
  if (!parsed.fields) return { error: parsed.error ?? "Invalid clinic" };

  const fields = parsed.fields;
  const before = clinicAuditShape(clinic);

  const afterRow = await repo.withTransaction(async (tx) => {
    const updated = await repo.clinics.updateClinic(
      clinic.id,
      fields,
      tx,
    );
    if (!updated) return null;

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "clinic.updated",
        entityType: "clinic",
        entityId: clinic.id,
        before,
        after: clinicAuditShape(updated),
      },
      tx,
    );

    return updated;
  });

  if (!afterRow) return { error: "Clinic was not saved" };

  revalidateClinic(slug);
  return { saved: true as const };
}

export async function archiveClinic(slug: string): Promise<ClinicActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) return { error: "Already archived" };

  const before = clinicAuditShape(clinic);
  await repo.withTransaction(async (tx) => {
    const after = await repo.clinics.setArchived(clinic.id, true, tx);
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "clinic.archived",
        entityType: "clinic",
        entityId: clinic.id,
        before,
        after: clinicAuditShape(after),
      },
      tx,
    );
  });

  revalidateClinic(slug);
  return { saved: true as const };
}

export async function restoreClinic(slug: string): Promise<ClinicActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (!clinic.archivedAt) return { error: "This clinic is already live" };

  const before = clinicAuditShape(clinic);
  await repo.withTransaction(async (tx) => {
    const after = await repo.clinics.setArchived(clinic.id, false, tx);
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "clinic.restored",
        entityType: "clinic",
        entityId: clinic.id,
        before,
        after: clinicAuditShape(after),
      },
      tx,
    );
  });

  revalidateClinic(slug);
  return { saved: true as const };
}
