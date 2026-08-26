import { normaliseAuMobile } from "@/lib/mobile";
import { segmentCount } from "@/lib/segments";
import type { Clinic } from "../db/schema";
import { enqueueDraftReply } from "../queue/boss";
import * as repo from "../repo";
import { isStopKeyword, type InboundPayload } from "./webhook-payloads";

/**
 * An inbound SMS becomes a message on the existing thread for that mobile.
 *
 * Identity is (clinic_id, mobile_number) and threads are never restarted, so a
 * customer who texted six months ago carries on the same conversation. The
 * source_type on a new thread records that it started from SMS rather than the
 * widget.
 */

export type InboundResult =
  | { kind: "opted_out"; contactId: string }
  | { kind: "queued"; messageId: string; enqueued: boolean }
  | { kind: "ignored"; reason: string };

export async function receiveInbound(
  clinic: Clinic,
  payload: InboundPayload,
): Promise<InboundResult> {
  const mobile = normaliseAuMobile(payload.sender);
  if (!mobile) {
    return { kind: "ignored", reason: `unrecognised sender ${payload.sender}` };
  }

  const body = payload.message.trim();
  const optingOut = payload.type === "unsubscribe" || isStopKeyword(body);

  if (optingOut) {
    return optOut(clinic, mobile, body);
  }

  if (body.length === 0) {
    return { kind: "ignored", reason: "empty message body" };
  }

  const { conversationId, messageId } = await repo.withTransaction(async (tx) => {
    // An inbound reply is consent to reply under the Spam Act, so a contact we
    // have never seen is created here with that consent recorded.
    const contact = await repo.contacts.upsertContact(
      clinic.id,
      { mobile, consentSource: "sms_inbound" },
      tx,
    );

    const conversation = await repo.conversations.getOrCreateConversation(
      clinic.id,
      contact.id,
      "sms_inbound",
      tx,
    );

    const message = await repo.messages.createMessage(
      clinic.id,
      {
        conversationId: conversation.id,
        direction: "inbound",
        body,
        segments: segmentCount(body),
        status: "delivered",
      },
      tx,
    );

    await repo.conversations.touchConversation(
      clinic.id,
      conversation.id,
      message.createdAt,
      tx,
    );

    await repo.usage.incrementUsage(
      clinic.id,
      { segmentsIn: message.segments },
      tx,
    );

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: "mobile_message",
        action: "enquiry.received",
        entityType: "message",
        entityId: message.id,
        after: {
          source_type: "sms_inbound",
          contact_id: contact.id,
          conversation_id: conversation.id,
          consent_source: contact.consentSource,
        },
      },
      tx,
    );

    return { conversationId: conversation.id, messageId: message.id };
  });

  let enqueued = true;
  try {
    await enqueueDraftReply({
      clinicId: clinic.id,
      conversationId,
      inboundMessageId: messageId,
    });
  } catch (error) {
    enqueued = false;
    console.error("failed to enqueue draft-reply for inbound SMS:", error);
    await repo.audit.recordAudit(clinic.id, {
      actor: "mobile_message",
      action: "enquiry.enqueue_failed",
      entityType: "message",
      entityId: messageId,
      after: { error: String(error) },
    });
  }

  return { kind: "queued", messageId, enqueued };
}

/**
 * Opting out is per contact per clinic, never global, and it is checked before
 * every send. The message itself is still stored: it is part of the thread and
 * it is the evidence of when they asked.
 */
async function optOut(
  clinic: Clinic,
  mobile: string,
  body: string,
): Promise<InboundResult> {
  const contactId = await repo.withTransaction(async (tx) => {
    const contact = await repo.contacts.upsertContact(
      clinic.id,
      { mobile, consentSource: "sms_inbound" },
      tx,
    );

    if (body.length > 0) {
      const conversation = await repo.conversations.getOrCreateConversation(
        clinic.id,
        contact.id,
        "sms_inbound",
        tx,
      );

      await repo.messages.createMessage(
        clinic.id,
        {
          conversationId: conversation.id,
          direction: "inbound",
          body,
          segments: segmentCount(body),
          status: "delivered",
        },
        tx,
      );
    }

    await repo.contacts.setOptedOut(clinic.id, contact.id, true, tx);

    await repo.audit.recordAudit(
      clinic.id,
      {
        actor: "mobile_message",
        action: "contact.opted_out",
        entityType: "contact",
        entityId: contact.id,
        before: { opted_out: contact.optedOut },
        after: { opted_out: true, via: "sms_inbound" },
      },
      tx,
    );

    return contact.id;
  });

  return { kind: "opted_out", contactId };
}
