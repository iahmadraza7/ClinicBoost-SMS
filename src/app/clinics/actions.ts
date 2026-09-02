"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOperator } from "@/server/auth";
import {
  clinicAuditShape,
  clinicFieldsFromForm,
  clinicSlugSchema,
  createClinicSchema,
  liveVoiceFromPending,
  parseVoice,
  pendingVoiceAfterSave,
  voiceBlockedTermError,
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

  const createParsed = createClinicSchema.safeParse({
    slug,
    ...parsed.fields,
  });
  if (!createParsed.success) {
    return {
      error: createParsed.error.issues[0]?.message ?? "Invalid clinic",
    };
  }

  const { slug: clinicSlug, ...clinicFields } = createParsed.data;

  const existing = await repo.clinics.getClinicBySlug(clinicSlug);
  if (existing) {
    return { error: `A clinic with slug "${clinicSlug}" already exists` };
  }

  const voiceParsed = parseVoice(String(form.get("voice") ?? ""));
  if ("error" in voiceParsed) return { error: voiceParsed.error };
  const submittedVoice = voiceParsed.voice;
  if (submittedVoice) {
    const termError = voiceBlockedTermError(submittedVoice, S4_BASELINE_TERMS);
    if (termError) return { error: termError };
  }

  await repo.withTransaction(async (tx) => {
    const clinic = await repo.clinics.createClinic(
      {
        slug: clinicSlug,
        ...clinicFields,
        voicePending: pendingVoiceAfterSave(submittedVoice, null),
      },
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

  const voiceParsed = parseVoice(String(form.get("voice") ?? ""));
  if ("error" in voiceParsed) return { error: voiceParsed.error };
  const submittedVoice = voiceParsed.voice;
  if (submittedVoice) {
    const terms = await repo.blockedTerms.listBlockedTerms(clinic.id);
    const termError = voiceBlockedTermError(submittedVoice, terms);
    if (termError) return { error: termError };
  }

  const voicePending = pendingVoiceAfterSave(submittedVoice, clinic.voice);
  const before = clinicAuditShape(clinic);

  const afterRow = await repo.withTransaction(async (tx) => {
    const updated = await repo.clinics.updateClinic(
      clinic.id,
      { ...fields, voicePending },
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

export async function reviewVoice(slug: string): Promise<ClinicActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before reviewing its voice" };
  }
  if (clinic.voicePending === null) {
    return { error: "Nothing is waiting for review" };
  }

  const nextVoice = liveVoiceFromPending(clinic.voicePending);
  if (nextVoice) {
    const terms = await repo.blockedTerms.listBlockedTerms(clinic.id);
    const termError = voiceBlockedTermError(nextVoice, terms);
    if (termError) return { error: termError };
  }

  const before = clinicAuditShape(clinic);
  const reviewedAt = new Date();

  await repo.withTransaction(async (tx) => {
    const after = await repo.clinics.updateClinic(
      clinic.id,
      {
        voice: nextVoice,
        voicePending: null,
        voiceReviewedBy: operator.email,
        voiceReviewedAt: reviewedAt,
      },
      tx,
    );
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "clinic.voice_reviewed",
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
