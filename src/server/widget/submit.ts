import { z } from "zod";

import { normaliseAuMobile } from "@/lib/mobile";
import { segmentCount } from "@/lib/segments";
import type { Clinic } from "../db/schema";
import { enqueueDraftReply } from "../queue/boss";
import * as repo from "../repo";

export const widgetSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  mobile: z
    .string()
    .trim()
    .min(1, "Mobile is required")
    .transform((v, ctx) => {
      const normalised = normaliseAuMobile(v);
      if (!normalised) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid Australian mobile number",
        });
        return z.NEVER;
      }
      return normalised;
    }),
  question: z.string().trim().min(1, "Question is required").max(1000),
});

export type WidgetSubmission = z.infer<typeof widgetSubmissionSchema>;

export type SubmitResult = {
  conversationId: string;
  inboundMessageId: string;
  enqueued: boolean;
};

/**
 * Persist first, then enqueue. The database write is one transaction, so a
 * failure leaves nothing half-created; the enqueue happens after it commits, so
 * a queue outage cannot lose the enquiry, only delay the draft.
 */
export async function submitEnquiry(
  clinic: Clinic,
  submission: WidgetSubmission,
): Promise<SubmitResult> {
  const { conversationId, inboundMessageId } = await repo.withTransaction(
    async (tx) => {
      const contact = await repo.contacts.upsertContact(
        clinic.id,
        {
          mobile: submission.mobile,
          name: submission.name,
          consentSource: "widget",
        },
        tx,
      );

      const conversation = await repo.conversations.getOrCreateConversation(
        clinic.id,
        contact.id,
        "widget",
        tx,
      );

      const message = await repo.messages.createMessage(
        clinic.id,
        {
          conversationId: conversation.id,
          direction: "inbound",
          body: submission.question,
          segments: segmentCount(submission.question),
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

      await repo.audit.recordAudit(
        clinic.id,
        {
          actor: "widget",
          action: "enquiry.received",
          entityType: "message",
          entityId: message.id,
          after: {
            source_type: "widget",
            contact_id: contact.id,
            conversation_id: conversation.id,
            consent_source: "widget",
          },
        },
        tx,
      );

      return { conversationId: conversation.id, inboundMessageId: message.id };
    },
  );

  let enqueued = true;
  try {
    await enqueueDraftReply({
      clinicId: clinic.id,
      conversationId,
      inboundMessageId,
    });
  } catch (error) {
    // The enquiry is stored. Losing the job means no draft appears, which is
    // visible in the dashboard, so surface it loudly rather than failing the
    // customer's submission.
    enqueued = false;
    console.error("failed to enqueue draft-reply job:", error);
    await repo.audit.recordAudit(clinic.id, {
      actor: "widget",
      action: "enquiry.enqueue_failed",
      entityType: "message",
      entityId: inboundMessageId,
      after: { error: String(error) },
    });
  }

  return { conversationId, inboundMessageId, enqueued };
}
