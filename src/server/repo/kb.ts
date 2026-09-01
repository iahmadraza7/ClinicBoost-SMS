import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";

import {
  kbEntries,
  type AnswerMode,
  type KbEntry,
  type NewKbEntry,
} from "../db/schema";
import { exec, type Executor } from "./executor";

/**
 * The whole knowledge base for a clinic is roughly 2,000 tokens, so it is read
 * whole rather than retrieved. No chunking, no embeddings.
 */
export async function listKbEntries(
  clinicId: string,
  opts: { activeOnly?: boolean } = {},
  tx?: Executor,
): Promise<KbEntry[]> {
  const where = opts.activeOnly
    ? and(eq(kbEntries.clinicId, clinicId), eq(kbEntries.status, "active"))
    : eq(kbEntries.clinicId, clinicId);

  return exec(tx)
    .select()
    .from(kbEntries)
    .where(where)
    .orderBy(asc(kbEntries.category), asc(kbEntries.entryKey));
}

export async function getKbEntry(
  clinicId: string,
  entryId: string,
  tx?: Executor,
): Promise<KbEntry | null> {
  const [row] = await exec(tx)
    .select()
    .from(kbEntries)
    .where(and(eq(kbEntries.clinicId, clinicId), eq(kbEntries.id, entryId)))
    .limit(1);
  return row ?? null;
}

export async function getKbEntryByKey(
  clinicId: string,
  entryKey: string,
  tx?: Executor,
): Promise<KbEntry | null> {
  const [row] = await exec(tx)
    .select()
    .from(kbEntries)
    .where(
      and(eq(kbEntries.clinicId, clinicId), eq(kbEntries.entryKey, entryKey)),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Used by the validator to resolve every claims[].source_id in one round trip.
 * A key belonging to another clinic simply will not come back, which is what
 * makes SOURCE_UNKNOWN fire.
 */
export async function getKbEntriesByKeys(
  clinicId: string,
  entryKeys: string[],
  tx?: Executor,
): Promise<KbEntry[]> {
  if (entryKeys.length === 0) return [];
  return exec(tx)
    .select()
    .from(kbEntries)
    .where(
      and(
        eq(kbEntries.clinicId, clinicId),
        inArray(kbEntries.entryKey, entryKeys),
      ),
    );
}

export async function listKbEntriesByAnswerMode(
  clinicId: string,
  answerMode: AnswerMode,
  tx?: Executor,
): Promise<KbEntry[]> {
  return exec(tx)
    .select()
    .from(kbEntries)
    .where(
      and(
        eq(kbEntries.clinicId, clinicId),
        eq(kbEntries.answerMode, answerMode),
      ),
    )
    .orderBy(asc(kbEntries.entryKey));
}

export async function createKbEntry(
  clinicId: string,
  values: Omit<NewKbEntry, "clinicId">,
  tx?: Executor,
): Promise<KbEntry> {
  const [row] = await exec(tx)
    .insert(kbEntries)
    .values({ ...values, clinicId })
    .returning();
  return row;
}

/** Import and re-import are the same operation, keyed on (clinic_id, entry_key). */
export async function upsertKbEntry(
  clinicId: string,
  values: Omit<NewKbEntry, "clinicId">,
  tx?: Executor,
): Promise<KbEntry> {
  const [row] = await exec(tx)
    .insert(kbEntries)
    .values({ ...values, clinicId })
    .onConflictDoUpdate({
      target: [kbEntries.clinicId, kbEntries.entryKey],
      set: {
        category: values.category,
        offerId: values.offerId ?? null,
        title: values.title,
        body: values.body,
        status: values.status,
        answerMode: values.answerMode,
        entryKind: values.entryKind ?? "fact",
        blockDeflect: values.blockDeflect ?? null,
        triggerTerms: values.triggerTerms ?? [],
        source: values.source,
        sourceDraftId: values.sourceDraftId ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function updateKbEntry(
  clinicId: string,
  entryId: string,
  values: Partial<Omit<NewKbEntry, "id" | "clinicId">>,
  tx?: Executor,
): Promise<KbEntry | null> {
  const [row] = await exec(tx)
    .update(kbEntries)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(kbEntries.clinicId, clinicId), eq(kbEntries.id, entryId)))
    .returning();
  return row ?? null;
}

export async function getKbEntryBySourceDraft(
  clinicId: string,
  sourceDraftId: string,
  tx?: Executor,
): Promise<KbEntry | null> {
  const [row] = await exec(tx)
    .select()
    .from(kbEntries)
    .where(
      and(
        eq(kbEntries.clinicId, clinicId),
        eq(kbEntries.sourceDraftId, sourceDraftId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Queue-edit suggestions waiting for review. Not the live knowledge base. */
export async function listPendingEditSuggestions(
  clinicId: string,
  tx?: Executor,
): Promise<KbEntry[]> {
  return exec(tx)
    .select()
    .from(kbEntries)
    .where(
      and(
        eq(kbEntries.clinicId, clinicId),
        eq(kbEntries.status, "pending_review"),
        isNotNull(kbEntries.sourceDraftId),
      ),
    )
    .orderBy(asc(kbEntries.createdAt));
}
