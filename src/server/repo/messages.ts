import { and, desc, eq, inArray } from "drizzle-orm";

import {
  messages,
  type Message,
  type MessageDirection,
  type MessageStatus,
} from "../db/schema";
import { exec, type Executor } from "./executor";

export async function createMessage(
  clinicId: string,
  values: {
    conversationId: string;
    direction: MessageDirection;
    body: string;
    segments: number;
    status: MessageStatus;
    providerMessageId?: string | null;
  },
  tx?: Executor,
): Promise<Message> {
  const [row] = await exec(tx)
    .insert(messages)
    .values({ ...values, clinicId })
    .returning();
  return row;
}

/** Newest first. Callers reverse for prompt construction. */
export async function listRecentMessages(
  clinicId: string,
  conversationId: string,
  limit: number,
  tx?: Executor,
): Promise<Message[]> {
  return exec(tx)
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.clinicId, clinicId),
        eq(messages.conversationId, conversationId),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function getMessage(
  clinicId: string,
  messageId: string,
  tx?: Executor,
): Promise<Message | null> {
  const [row] = await exec(tx)
    .select()
    .from(messages)
    .where(and(eq(messages.clinicId, clinicId), eq(messages.id, messageId)))
    .limit(1);
  return row ?? null;
}

/**
 * Delivery receipts arrive keyed by the provider's id, which we only learn once
 * the send succeeds. Still scoped by clinic: the caller resolves the clinic
 * from the number the receipt came in on before looking anything up.
 */
export async function getMessageByProviderId(
  clinicId: string,
  providerMessageId: string,
  tx?: Executor,
): Promise<Message | null> {
  const [row] = await exec(tx)
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.clinicId, clinicId),
        eq(messages.providerMessageId, providerMessageId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Records what the provider actually billed, which can differ from our own
 * count. Their number is the one that costs money, so it is the one we keep.
 */
/** Newest outbound SMS that actually left, for the health panel. */
export async function getLastSuccessfulSend(
  clinicId: string,
  tx?: Executor,
): Promise<Message | null> {
  const [row] = await exec(tx)
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.clinicId, clinicId),
        eq(messages.direction, "outbound"),
        inArray(messages.status, ["sent", "delivered"]),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return row ?? null;
}

export async function markSent(
  clinicId: string,
  messageId: string,
  values: { providerMessageId: string; segments: number },
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(messages)
    .set({
      status: "sent",
      providerMessageId: values.providerMessageId,
      segments: values.segments,
    })
    .where(and(eq(messages.clinicId, clinicId), eq(messages.id, messageId)));
}

export async function setMessageStatus(
  clinicId: string,
  messageId: string,
  status: MessageStatus,
  providerMessageId?: string | null,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(messages)
    .set({
      status,
      ...(providerMessageId === undefined ? {} : { providerMessageId }),
    })
    .where(and(eq(messages.clinicId, clinicId), eq(messages.id, messageId)));
}
