import { env } from "../../server/env";
import type { SendSmsJob } from "../../server/queue/boss";
import * as repo from "../../server/repo";
import { getSmsAdapter } from "../../server/sms";
import { checkSendable, describeBlocks } from "../../server/sms/guards";
import { RecipientOptedOutError, SmsError } from "../../server/sms/types";

/**
 * Sends one outbound message that already exists in the database.
 *
 * The row is written before this job is queued, so nothing here creates the
 * intent to send; it only carries it out, and only if the guards still allow it
 * at this moment rather than at the moment it was approved.
 */
export async function handleSendSms(job: SendSmsJob): Promise<void> {
  const { clinicId, messageId } = job;
  const kind = job.kind ?? "customer";
  const operatorAlert = kind === "operator_alert";

  const message = await repo.messages.getMessage(clinicId, messageId);
  if (!message) {
    console.error(`send-sms: message ${messageId} not found for ${clinicId}`);
    return;
  }

  // A retry after a successful send, or a message someone already cancelled.
  if (message.status !== "queued") return;

  const conversation = await repo.conversations.getConversation(
    clinicId,
    message.conversationId,
  );
  if (!conversation) {
    console.error(`send-sms: conversation missing for message ${messageId}`);
    return;
  }

  const [clinic, contact, blockedTerms] = await Promise.all([
    repo.clinics.getClinic(clinicId),
    repo.contacts.getContact(clinicId, conversation.contactId),
    repo.blockedTerms.listBlockedTerms(clinicId),
  ]);

  if (!clinic || !contact) {
    console.error(`send-sms: clinic or contact missing for message ${messageId}`);
    return;
  }

  const to = operatorAlert ? env.OPERATOR_NOTIFY_MOBILE : contact.mobile;
  if (!to) {
    await reject(clinicId, messageId, "no operator mobile configured", {
      codes: ["NO_OPERATOR_MOBILE"],
      kind,
    });
    return;
  }

  const blocks = checkSendable({
    body: message.body,
    clinicSlug: clinic.slug,
    killSwitch: clinic.killSwitch,
    globalKillSwitch: env.GLOBAL_KILL_SWITCH,
    contactOptedOut: contact.optedOut,
    blockedTerms,
    maxSegments: env.MAX_SEGMENTS_PER_DRAFT,
    kind,
  });

  if (blocks.length > 0) {
    await reject(clinicId, messageId, describeBlocks(blocks), {
      codes: blocks.map((b) => b.code),
      kind,
    });
    return;
  }

  const adapter = getSmsAdapter();

  try {
    const receipt = await adapter.send({
      to,
      from: clinic.smsNumber ?? env.MOBILE_MESSAGE_TEST_SENDER,
      body: message.body,
      reference: message.id,
      maxSegments: env.MAX_SEGMENTS_PER_DRAFT,
    });

    await repo.messages.markSent(clinicId, messageId, receipt);
    await repo.usage.incrementUsage(clinicId, {
      segmentsOut: receipt.segments,
    });

    await repo.audit.recordAudit(clinicId, {
      actor: "worker",
      action: "sms.sent",
      entityType: "message",
      entityId: messageId,
      after: {
        provider: adapter.name,
        provider_message_id: receipt.providerMessageId,
        segments: receipt.segments,
        kind,
      },
    });
  } catch (error) {
    if (error instanceof RecipientOptedOutError) {
      // The provider knows about an opt-out we do not. Record it so we stop
      // trying, here and in every future draft for this contact.
      if (!operatorAlert) {
        await repo.contacts.setOptedOut(clinicId, contact.id, true);
      }
      await reject(clinicId, messageId, error.message, {
        codes: ["CONTACT_OPTED_OUT"],
        kind,
      });
      return;
    }

    if (error instanceof SmsError && !error.retryable) {
      await repo.messages.setMessageStatus(clinicId, messageId, "failed");
      await repo.audit.recordAudit(clinicId, {
        actor: "worker",
        action: "sms.failed",
        entityType: "message",
        entityId: messageId,
        after: { provider: adapter.name, error: error.message },
      });
      return;
    }

    // Retryable, or something unexpected. Hand it back to pg-boss with the row
    // still `queued`, so the next attempt picks up exactly where this left off.
    throw error;
  }
}

async function reject(
  clinicId: string,
  messageId: string,
  detail: string,
  after: Record<string, unknown>,
): Promise<void> {
  await repo.messages.setMessageStatus(clinicId, messageId, "rejected");
  await repo.audit.recordAudit(clinicId, {
    actor: "worker",
    action: "sms.rejected",
    entityType: "message",
    entityId: messageId,
    after: { ...after, detail },
  });
  console.error(`send-sms: refused to send ${messageId}: ${detail}`);
}

/**
 * Dead letter handler. The message stays `queued` through every retry, so all
 * this does is mark it failed and say so loudly. The text is not lost: it is on
 * the message row for the operator to resend or rewrite.
 */
export async function handleSendSmsFailed(job: SendSmsJob): Promise<void> {
  const { clinicId, messageId } = job;

  const message = await repo.messages.getMessage(clinicId, messageId);
  if (!message || message.status !== "queued") return;

  await repo.messages.setMessageStatus(clinicId, messageId, "failed");
  await repo.audit.recordAudit(clinicId, {
    actor: "worker",
    action: "sms.gave_up",
    entityType: "message",
    entityId: messageId,
    after: { detail: "the provider could not be reached after every retry" },
  });

  console.error(`send-sms: gave up sending ${messageId} for clinic ${clinicId}`);
}
