import { segmentCount } from "@/lib/segments";
import type { Message } from "../db/schema";
import { enqueueSendSms, type SendSmsKind } from "../queue/boss";
import * as repo from "../repo";
import type { Executor } from "../repo/executor";

/**
 * Releasing a reply is two steps on purpose.
 *
 * `queueOutboundReply` writes the message row inside the caller's transaction,
 * alongside the draft decision, so the intent to send is committed atomically
 * with the decision that authorised it. `startSending` runs after the commit.
 * If the queue is down, the message sits in `queued` and is visible, rather
 * than the decision being rolled back or the send being lost.
 */

export async function queueOutboundReply(
  clinicId: string,
  args: { conversationId: string; body: string },
  tx?: Executor,
): Promise<Message> {
  const message = await repo.messages.createMessage(
    clinicId,
    {
      conversationId: args.conversationId,
      direction: "outbound",
      body: args.body,
      // Replaced by the provider's billed count once it has actually sent.
      segments: segmentCount(args.body),
      status: "queued",
    },
    tx,
  );

  await repo.conversations.touchConversation(
    clinicId,
    args.conversationId,
    message.createdAt,
    tx,
  );

  return message;
}

/** Call only after the transaction that created the message has committed. */
export async function startSending(
  clinicId: string,
  messageId: string,
  actor: string,
  kind: SendSmsKind = "customer",
): Promise<boolean> {
  try {
    await enqueueSendSms({ clinicId, messageId, kind });
    return true;
  } catch (error) {
    console.error(`failed to enqueue send-sms for ${messageId}:`, error);
    await repo.audit.recordAudit(clinicId, {
      actor,
      action: "sms.enqueue_failed",
      entityType: "message",
      entityId: messageId,
      after: { error: String(error) },
    });
    return false;
  }
}
