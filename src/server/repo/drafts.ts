import { and, desc, eq, sql } from "drizzle-orm";

import {
  contacts,
  conversations,
  drafts,
  messages,
  type Claim,
  type Draft,
  type DraftState,
  type ValidationResult,
} from "../db/schema";
import { exec, type Executor } from "./executor";

export async function createDraft(
  clinicId: string,
  values: {
    conversationId: string;
    inboundMessageId: string;
    draftBody: string;
    claims?: Claim[];
    matchedOfferId?: string | null;
    selfConfidence?: number;
    validationResult?: ValidationResult | null;
    state?: DraftState;
  },
  tx?: Executor,
): Promise<Draft> {
  const [row] = await exec(tx)
    .insert(drafts)
    .values({ ...values, clinicId })
    .returning();
  return row;
}

export async function getDraft(
  clinicId: string,
  draftId: string,
  tx?: Executor,
): Promise<Draft | null> {
  const [row] = await exec(tx)
    .select()
    .from(drafts)
    .where(and(eq(drafts.clinicId, clinicId), eq(drafts.id, draftId)))
    .limit(1);
  return row ?? null;
}

/**
 * pg-boss retries after a worker crash, so the job checks here before writing.
 * One inbound message gets one draft.
 */
export async function getDraftByInboundMessage(
  clinicId: string,
  inboundMessageId: string,
  tx?: Executor,
): Promise<Draft | null> {
  const [row] = await exec(tx)
    .select()
    .from(drafts)
    .where(
      and(
        eq(drafts.clinicId, clinicId),
        eq(drafts.inboundMessageId, inboundMessageId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** The approval queue for one clinic. Newest first. */
export async function listDraftsByState(
  clinicId: string,
  state: DraftState,
  limit = 100,
  tx?: Executor,
): Promise<Draft[]> {
  return exec(tx)
    .select()
    .from(drafts)
    .where(and(eq(drafts.clinicId, clinicId), eq(drafts.state, state)))
    .orderBy(desc(drafts.createdAt))
    .limit(limit);
}

export type QueueItem = {
  draftId: string;
  clinicId: string;
  conversationId: string;
  draftBody: string;
  validationResult: ValidationResult | null;
  selfConfidence: number;
  createdAt: Date;
  question: string;
  contactName: string | null;
  contactMobile: string;
};

/**
 * One clinic's pending queue with the context the operator needs to decide:
 * what was asked, who asked it, what the draft says. Every join is pinned to
 * the same clinic_id.
 */
export async function listQueue(
  clinicId: string,
  limit = 100,
  tx?: Executor,
): Promise<QueueItem[]> {
  return exec(tx)
    .select({
      draftId: drafts.id,
      clinicId: drafts.clinicId,
      conversationId: drafts.conversationId,
      draftBody: drafts.draftBody,
      validationResult: drafts.validationResult,
      selfConfidence: drafts.selfConfidence,
      createdAt: drafts.createdAt,
      question: messages.body,
      contactName: contacts.name,
      contactMobile: contacts.mobile,
    })
    .from(drafts)
    .innerJoin(
      messages,
      and(
        eq(messages.id, drafts.inboundMessageId),
        eq(messages.clinicId, clinicId),
      ),
    )
    .innerJoin(
      conversations,
      and(
        eq(conversations.id, drafts.conversationId),
        eq(conversations.clinicId, clinicId),
      ),
    )
    .innerJoin(
      contacts,
      and(
        eq(contacts.id, conversations.contactId),
        eq(contacts.clinicId, clinicId),
      ),
    )
    .where(and(eq(drafts.clinicId, clinicId), eq(drafts.state, "pending")))
    .orderBy(desc(drafts.createdAt))
    .limit(limit);
}

export async function countDraftsByState(
  clinicId: string,
  state: DraftState,
  tx?: Executor,
): Promise<number> {
  const [row] = await exec(tx)
    .select({ count: sql<number>`count(*)::int` })
    .from(drafts)
    .where(and(eq(drafts.clinicId, clinicId), eq(drafts.state, state)));
  return row?.count ?? 0;
}

/**
 * Records the operator's decision. The audit entry is written by the caller in
 * the same transaction so a decision can never be applied unlogged.
 */
export async function decideDraft(
  clinicId: string,
  draftId: string,
  values: {
    state: Extract<DraftState, "approved" | "edited" | "rejected">;
    editedBody?: string | null;
    decidedBy: string;
  },
  tx?: Executor,
): Promise<Draft | null> {
  const [row] = await exec(tx)
    .update(drafts)
    .set({
      state: values.state,
      editedBody: values.editedBody ?? null,
      decidedBy: values.decidedBy,
      decidedAt: new Date(),
    })
    .where(
      and(
        eq(drafts.clinicId, clinicId),
        eq(drafts.id, draftId),
        eq(drafts.state, "pending"),
      ),
    )
    .returning();
  return row ?? null;
}

export async function markNotified(
  clinicId: string,
  draftId: string,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(drafts)
    .set({ notifiedAt: new Date() })
    .where(and(eq(drafts.clinicId, clinicId), eq(drafts.id, draftId)));
}

export async function markEscalated(
  clinicId: string,
  draftId: string,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(drafts)
    .set({ escalatedAt: new Date() })
    .where(and(eq(drafts.clinicId, clinicId), eq(drafts.id, draftId)));
}
