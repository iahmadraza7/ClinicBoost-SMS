"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOperator } from "@/server/auth";
import {
  createKbFieldsFromForm,
  kbAuditShape,
  kbBlockedTermError,
  kbFieldsFromForm,
  kbTextForBlockedCheck,
  operatorSaveMeta,
  reviewMeta,
} from "@/server/kb/fields";
import {
  parseBookingCsv,
  planBookingCsv,
  planCounts,
  priceCentsFromDisplay,
  type BookingCsvPlan,
} from "@/server/kb/csv";
import * as repo from "@/server/repo";

export type KbActionState =
  | { error: string }
  | { saved: true }
  | null;

function revalidateKb(slug: string, entryId?: string) {
  revalidatePath(`/clinics/${slug}`);
  revalidatePath(`/clinics/${slug}/knowledge`);
  revalidatePath(`/clinics/${slug}/knowledge/pending-edits`);
  if (entryId) revalidatePath(`/clinics/${slug}/knowledge/${entryId}`);
}

async function blockedTermErrorForClinic(
  clinicId: string,
  fields: { title: string; body: string; blockDeflect: string | null },
): Promise<string | null> {
  const terms = await repo.blockedTerms.listBlockedTerms(clinicId);
  return kbBlockedTermError(kbTextForBlockedCheck(fields), terms);
}

export async function createKbEntry(
  slug: string,
  _prev: KbActionState,
  form: FormData,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before editing its knowledge base" };
  }

  const parsed = createKbFieldsFromForm(form);
  if (!parsed.fields) return { error: parsed.error ?? "Invalid entry" };
  const fields = parsed.fields;

  const termError = await blockedTermErrorForClinic(clinic.id, fields);
  if (termError) return { error: termError };

  const existing = await repo.kb.getKbEntryByKey(clinic.id, fields.entryKey);
  if (existing) {
    return {
      error: `An entry with key "${fields.entryKey}" already exists for this clinic`,
    };
  }

  const created = await repo.withTransaction(async (tx) => {
    const row = await repo.kb.createKbEntry(
      clinic.id,
      {
        entryKey: fields.entryKey,
        category: fields.category,
        title: fields.title,
        body: fields.body,
        answerMode: fields.answerMode,
        blockDeflect: fields.blockDeflect,
        triggerTerms: fields.triggerTerms,
        createdBy: operator.email,
        ...operatorSaveMeta(),
      },
      tx,
    );

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.created",
        entityType: "kb_entry",
        entityId: row.id,
        after: kbAuditShape(row),
      },
      tx,
    );

    return row;
  });

  revalidateKb(slug, created.id);
  redirect(`/clinics/${slug}/knowledge/${created.id}`);
}

export async function updateKbEntry(
  slug: string,
  entryId: string,
  _prev: KbActionState,
  form: FormData,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before editing its knowledge base" };
  }

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) return { error: "Entry not found" };
  if (entry.status === "archived") {
    return { error: "Restore this entry before editing it" };
  }

  const parsed = kbFieldsFromForm(form);
  if (!parsed.fields) return { error: parsed.error ?? "Invalid entry" };
  const fields = parsed.fields;

  const termError = await blockedTermErrorForClinic(clinic.id, fields);
  if (termError) return { error: termError };

  const before = kbAuditShape(entry);

  const updated = await repo.withTransaction(async (tx) => {
    const row = await repo.kb.updateKbEntry(
      clinic.id,
      entryId,
      {
        category: fields.category,
        title: fields.title,
        body: fields.body,
        answerMode: fields.answerMode,
        blockDeflect: fields.blockDeflect,
        triggerTerms: fields.triggerTerms,
        ...operatorSaveMeta(),
      },
      tx,
    );
    if (!row) return null;

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.updated",
        entityType: "kb_entry",
        entityId: row.id,
        before,
        after: kbAuditShape(row),
      },
      tx,
    );

    return row;
  });

  if (!updated) return { error: "Entry was not saved" };

  revalidateKb(slug, entryId);
  return { saved: true as const };
}

export async function reviewKbEntry(
  slug: string,
  entryId: string,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before reviewing its knowledge base" };
  }

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) return { error: "Entry not found" };
  if (entry.status !== "pending_review") {
    return { error: "Only entries waiting for review can be reviewed" };
  }

  const termError = await blockedTermErrorForClinic(clinic.id, entry);
  if (termError) return { error: termError };

  const before = kbAuditShape(entry);
  const meta = reviewMeta(operator.email);

  await repo.withTransaction(async (tx) => {
    const after = await repo.kb.updateKbEntry(clinic.id, entryId, meta, tx);
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.reviewed",
        entityType: "kb_entry",
        entityId: after.id,
        before,
        after: kbAuditShape(after),
      },
      tx,
    );
  });

  revalidateKb(slug, entryId);
  return { saved: true as const };
}

export async function archiveKbEntry(
  slug: string,
  entryId: string,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic first" };
  }

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) return { error: "Entry not found" };
  if (entry.status === "archived") return { error: "Already archived" };

  const before = kbAuditShape(entry);

  await repo.withTransaction(async (tx) => {
    const after = await repo.kb.updateKbEntry(
      clinic.id,
      entryId,
      { status: "archived" },
      tx,
    );
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.archived",
        entityType: "kb_entry",
        entityId: after.id,
        before,
        after: kbAuditShape(after),
      },
      tx,
    );
  });

  revalidateKb(slug, entryId);
  return { saved: true as const };
}

export async function restoreKbEntry(
  slug: string,
  entryId: string,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic first" };
  }

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) return { error: "Entry not found" };
  if (entry.status !== "archived") {
    return { error: "This entry is not archived" };
  }

  const before = kbAuditShape(entry);
  const meta = operatorSaveMeta();

  await repo.withTransaction(async (tx) => {
    const after = await repo.kb.updateKbEntry(clinic.id, entryId, meta, tx);
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.restored",
        entityType: "kb_entry",
        entityId: after.id,
        before,
        after: kbAuditShape(after),
      },
      tx,
    );
  });

  revalidateKb(slug, entryId);
  return { saved: true as const };
}

export type CsvPreviewState =
  | { error: string }
  | {
      csvText: string;
      created: BookingCsvPlan["created"];
      updated: BookingCsvPlan["updated"];
      skipped: BookingCsvPlan["skipped"];
    }
  | null;

const MAX_CSV_BYTES = 200_000;

async function loadBookingPlan(
  clinic: { id: string; slug: string },
  csvText: string,
): Promise<{ error: string } | { csvText: string; plan: BookingCsvPlan }> {
  const parsed = parseBookingCsv(csvText);
  if ("error" in parsed) return { error: parsed.error };

  const terms = await repo.blockedTerms.listBlockedTerms(clinic.id);
  for (const row of parsed.rows) {
    const termError = kbBlockedTermError(
      kbTextForBlockedCheck({
        title: row.name,
        body: `${row.bookingUrl}\n${row.priceDisplay}`,
        blockDeflect: null,
      }),
      terms,
    );
    if (termError) {
      return { error: `Line ${row.line}: ${termError}` };
    }
  }

  const [offers, entries] = await Promise.all([
    repo.offers.listOffers(clinic.id),
    repo.kb.listKbEntries(clinic.id),
  ]);

  const plan = planBookingCsv(clinic.slug, parsed.rows, offers, entries);
  if ("error" in plan) return { error: plan.error };
  return { csvText, plan };
}

export async function previewBookingCsv(
  slug: string,
  _prev: CsvPreviewState,
  form: FormData,
): Promise<CsvPreviewState> {
  await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before importing" };
  }

  const file = form.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first" };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { error: "That file is too large. Keep it under 200 KB." };
  }

  const csvText = await file.text();
  const loaded = await loadBookingPlan(clinic, csvText);
  if ("error" in loaded) return { error: loaded.error };

  return {
    csvText: loaded.csvText,
    created: loaded.plan.created,
    updated: loaded.plan.updated,
    skipped: loaded.plan.skipped,
  };
}

export async function confirmBookingCsv(
  slug: string,
  _prev: KbActionState,
  form: FormData,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before importing" };
  }

  const csvText = String(form.get("csvText") ?? "");
  if (!csvText.trim()) {
    return { error: "Preview the CSV before importing" };
  }

  const loaded = await loadBookingPlan(clinic, csvText);
  if ("error" in loaded) return { error: loaded.error };

  const counts = planCounts(loaded.plan);
  if (counts.created + counts.updated === 0) {
    return { error: "Nothing to import. Every row already matches." };
  }

  const save = operatorSaveMeta();

  await repo.withTransaction(async (tx) => {
    for (const row of [...loaded.plan.created, ...loaded.plan.updated]) {
      const priceCents = priceCentsFromDisplay(row.priceDisplay);
      let offerId = row.offerId;

      if (offerId) {
        await repo.offers.updateOffer(
          clinic.id,
          offerId,
          {
            name: row.name,
            bookingUrl: row.bookingUrl,
            priceDisplay: row.priceDisplay,
            priceCents,
          },
          tx,
        );
      } else {
        const offer = await repo.offers.createOffer(
          clinic.id,
          {
            name: row.name,
            bookingUrl: row.bookingUrl,
            priceDisplay: row.priceDisplay,
            priceCents,
            rrpDisplay: null,
            notes: "",
            active: true,
          },
          tx,
        );
        offerId = offer.id;
      }

      const entryValues = {
        category: "booking" as const,
        offerId,
        title: `${row.name} booking link`,
        body: row.bookingUrl,
        answerMode: "answerable" as const,
        ...save,
      };

      if (row.entryId) {
        await repo.kb.updateKbEntry(clinic.id, row.entryId, entryValues, tx);
      } else {
        await repo.kb.createKbEntry(
          clinic.id,
          {
            entryKey: row.entryKey,
            createdBy: operator.email,
            ...entryValues,
          },
          tx,
        );
      }
    }

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.csv_imported",
        entityType: "clinic",
        entityId: clinic.id,
        after: counts,
      },
      tx,
    );
  });

  revalidateKb(slug);
  redirect(`/clinics/${slug}/knowledge`);
}

export async function updateKbEntryBody(
  slug: string,
  entryId: string,
  body: string,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before editing its knowledge base" };
  }

  const trimmed = body.trim();
  if (!trimmed) return { error: "Body is required" };
  if (trimmed.length > 4000) return { error: "Body is at most 4000 characters" };

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) return { error: "Entry not found" };
  if (entry.status === "archived") {
    return { error: "Restore this entry before editing it" };
  }

  const termError = await blockedTermErrorForClinic(clinic.id, {
    title: entry.title,
    body: trimmed,
    blockDeflect: entry.blockDeflect,
  });
  if (termError) return { error: termError };

  const before = kbAuditShape(entry);

  await repo.withTransaction(async (tx) => {
    const row = await repo.kb.updateKbEntry(
      clinic.id,
      entryId,
      { body: trimmed, ...operatorSaveMeta() },
      tx,
    );
    if (!row) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.updated",
        entityType: "kb_entry",
        entityId: row.id,
        before,
        after: kbAuditShape(row),
      },
      tx,
    );
  });

  revalidateKb(slug, entryId);
  return { saved: true as const };
}

export async function discardPendingEdit(
  slug: string,
  entryId: string,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };

  const entry = await repo.kb.getKbEntry(clinic.id, entryId);
  if (!entry) return { error: "Entry not found" };
  if (entry.status !== "pending_review" || !entry.sourceDraftId) {
    return { error: "Only pending operator-edit suggestions can be discarded" };
  }

  const before = kbAuditShape(entry);
  await repo.withTransaction(async (tx) => {
    const after = await repo.kb.updateKbEntry(
      clinic.id,
      entryId,
      { status: "archived" },
      tx,
    );
    if (!after) return;
    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.discarded",
        entityType: "kb_entry",
        entityId: after.id,
        before,
        after: kbAuditShape(after),
      },
      tx,
    );
  });

  revalidateKb(slug, entryId);
  return { saved: true as const };
}

export async function exportKnowledge(
  slug: string,
  format: "csv" | "json",
): Promise<{ filename: string; text: string } | { error: string }> {
  await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };

  const entries = await repo.kb.listKbEntries(clinic.id);
  const { exportKbCsv, exportKbJson } = await import("@/server/kb/transfer");
  if (format === "json") {
    return {
      filename: `${clinic.slug}-knowledge.json`,
      text: exportKbJson(entries),
    };
  }
  return {
    filename: `${clinic.slug}-knowledge.csv`,
    text: exportKbCsv(entries),
  };
}

export type KbImportPreviewState =
  | { error: string }
  | {
      payload: string;
      kind: "csv" | "json";
      created: { entry_key: string; title: string }[];
      updated: { entry_key: string; title: string }[];
      skipped: { entry_key: string; title: string; reason: string }[];
    }
  | null;

const MAX_KB_BYTES = 400_000;

async function loadKbPlan(
  clinic: { id: string },
  text: string,
  kind: "csv" | "json",
): Promise<
  | { error: string }
  | {
      plan: import("@/server/kb/transfer").KbImportPlan;
      payload: string;
      kind: "csv" | "json";
    }
> {
  const { parseKbCsv, parseKbJson, planKbImport } = await import(
    "@/server/kb/transfer"
  );
  const parsed = kind === "json" ? parseKbJson(text) : parseKbCsv(text);
  if ("error" in parsed) return { error: parsed.error };

  const draftIds = [
    ...new Set(
      parsed.rows
        .map((row) => row.source_draft_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [entries, offers, terms, linkedDrafts] = await Promise.all([
    repo.kb.listKbEntries(clinic.id),
    repo.offers.listOffers(clinic.id),
    repo.blockedTerms.listBlockedTerms(clinic.id),
    repo.drafts.getDraftsByIds(clinic.id, draftIds),
  ]);

  return {
    plan: planKbImport(
      parsed.rows,
      entries,
      new Set(offers.map((o) => o.id)),
      terms,
      new Set(linkedDrafts.map((d) => d.id)),
    ),
    payload: text,
    kind,
  };
}

export async function previewKbImport(
  slug: string,
  _prev: KbImportPreviewState,
  form: FormData,
): Promise<KbImportPreviewState> {
  await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before importing" };
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV or JSON file first" };
  }
  if (file.size > MAX_KB_BYTES) {
    return { error: "That file is too large. Keep it under 400 KB." };
  }

  const name = file.name.toLowerCase();
  const kind = name.endsWith(".json") ? "json" : "csv";
  const text = await file.text();
  const loaded = await loadKbPlan(clinic, text, kind);
  if ("error" in loaded) return { error: loaded.error };

  return {
    payload: loaded.payload,
    kind: loaded.kind,
    created: loaded.plan.created.map((r) => ({
      entry_key: r.entry_key,
      title: r.title,
    })),
    updated: loaded.plan.updated.map((r) => ({
      entry_key: r.entry_key,
      title: r.title,
    })),
    skipped: loaded.plan.skipped.map((r) => ({
      entry_key: r.entry_key,
      title: r.title,
      reason: r.reason ?? "skipped",
    })),
  };
}

export async function confirmKbImport(
  slug: string,
  _prev: KbActionState,
  form: FormData,
): Promise<KbActionState> {
  const operator = await requireOperator();
  const clinic = await repo.clinics.getClinicBySlug(slug);
  if (!clinic) return { error: "Clinic not found" };
  if (clinic.archivedAt) {
    return { error: "Restore this clinic before importing" };
  }

  const payload = String(form.get("payload") ?? "");
  const kind = form.get("kind") === "json" ? "json" : "csv";
  if (!payload.trim()) return { error: "Preview the file before importing" };

  const loaded = await loadKbPlan(clinic, payload, kind);
  if ("error" in loaded) return { error: loaded.error };

  const { created, updated, skipped } = loaded.plan;
  if (created.length + updated.length === 0) {
    return { error: "Nothing to import. Every row was skipped." };
  }

  await repo.withTransaction(async (tx) => {
    for (const row of created) {
      await repo.kb.createKbEntry(
        clinic.id,
        {
          entryKey: row.entry_key,
          category: row.category,
          title: row.title,
          body: row.body,
          status: row.status,
          answerMode: row.answer_mode,
          blockDeflect: row.block_deflect,
          triggerTerms: row.trigger_terms,
          source: row.source,
          offerId: row.offer_id,
          sourceDraftId: row.source_draft_id,
          createdBy: operator.email,
        },
        tx,
      );
    }

    for (const row of updated) {
      if (!row.entryId) continue;
      await repo.kb.updateKbEntry(
        clinic.id,
        row.entryId,
        {
          category: row.category,
          title: row.title,
          body: row.body,
          status: row.status,
          answerMode: row.answer_mode,
          blockDeflect: row.block_deflect,
          triggerTerms: row.trigger_terms,
          source: row.source,
          offerId: row.offer_id,
          sourceDraftId: row.source_draft_id,
        },
        tx,
      );
    }

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: operator.email,
        action: "kb.imported",
        entityType: "clinic",
        entityId: clinic.id,
        after: {
          created: created.length,
          updated: updated.length,
          skipped: skipped.length,
        },
      },
      tx,
    );
  });

  revalidateKb(slug);
  redirect(`/clinics/${slug}/knowledge`);
}
