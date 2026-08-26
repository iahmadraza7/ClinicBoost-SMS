import { and, asc, eq } from "drizzle-orm";

import { blockedTerms, type BlockedTerm } from "../db/schema";
import { exec, type Executor } from "./executor";

/**
 * Schedule 4 medicines cannot be named in advertising to the public. The list
 * is per clinic because there is no cross-clinic read anywhere in the product;
 * the shared baseline is seeded into each clinic on creation.
 */
export async function listBlockedTerms(
  clinicId: string,
  tx?: Executor,
): Promise<BlockedTerm[]> {
  return exec(tx)
    .select()
    .from(blockedTerms)
    .where(eq(blockedTerms.clinicId, clinicId))
    .orderBy(asc(blockedTerms.term));
}

export async function addBlockedTerms(
  clinicId: string,
  terms: { term: string; reason: string }[],
  tx?: Executor,
): Promise<void> {
  if (terms.length === 0) return;
  await exec(tx)
    .insert(blockedTerms)
    .values(terms.map((t) => ({ ...t, clinicId })))
    .onConflictDoNothing();
}

export async function removeBlockedTerm(
  clinicId: string,
  termId: string,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .delete(blockedTerms)
    .where(
      and(eq(blockedTerms.clinicId, clinicId), eq(blockedTerms.id, termId)),
    );
}
