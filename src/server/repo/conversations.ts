import { and, eq } from "drizzle-orm";

import {
  conversations,
  type Conversation,
  type SourceType,
} from "../db/schema";
import { exec, type Executor } from "./executor";

/**
 * Identity is (clinic_id, mobile_number) via the contact. A thread is never
 * restarted, so this returns the existing conversation whatever opened it.
 * source_type records how the thread began, which is the hook the Phase 2
 * missed-call feature slots into.
 */
export async function getOrCreateConversation(
  clinicId: string,
  contactId: string,
  sourceType: SourceType,
  tx?: Executor,
): Promise<Conversation> {
  const [row] = await exec(tx)
    .insert(conversations)
    .values({ clinicId, contactId, sourceType })
    .onConflictDoNothing({
      target: [conversations.clinicId, conversations.contactId],
    })
    .returning();

  if (row) return row;

  const [existing] = await exec(tx)
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.clinicId, clinicId),
        eq(conversations.contactId, contactId),
      ),
    )
    .limit(1);
  return existing;
}

export async function getConversation(
  clinicId: string,
  conversationId: string,
  tx?: Executor,
): Promise<Conversation | null> {
  const [row] = await exec(tx)
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.clinicId, clinicId),
        eq(conversations.id, conversationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function touchConversation(
  clinicId: string,
  conversationId: string,
  at: Date,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(conversations)
    .set({ lastMessageAt: at })
    .where(
      and(
        eq(conversations.clinicId, clinicId),
        eq(conversations.id, conversationId),
      ),
    );
}

/** Older messages collapse into this. Recent ones stay verbatim. */
export async function setSummary(
  clinicId: string,
  conversationId: string,
  summary: string,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(conversations)
    .set({ summary })
    .where(
      and(
        eq(conversations.clinicId, clinicId),
        eq(conversations.id, conversationId),
      ),
    );
}
