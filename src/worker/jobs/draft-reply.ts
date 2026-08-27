import { generateDraft } from "../../server/ai";
import {
  enqueueNotifyEmail,
  type DraftReplyJob,
} from "../../server/queue/boss";
import { loadReplyContext } from "../../server/reply-context";
import * as repo from "../../server/repo";
import { queueOutboundReply, startSending } from "../../server/sms/dispatch";
import { validateDraft } from "../../server/validation";
import { toValidationContext } from "../../server/validation/from-reply-context";

/** Enough to show the operator what the model said when the JSON is malformed. */
const RAW_BODY_LIMIT = 2000;

export async function handleDraftReply(job: DraftReplyJob): Promise<void> {
  const { clinicId, conversationId, inboundMessageId } = job;

  const existing = await repo.drafts.getDraftByInboundMessage(
    clinicId,
    inboundMessageId,
  );
  if (existing) return;

  const ctx = await loadReplyContext(clinicId, {
    conversationId,
    inboundMessageId,
  });
  if (!ctx) {
    console.error(
      `draft-reply: could not load context for clinic ${clinicId}, message ${inboundMessageId}`,
    );
    return;
  }

  // Throwing hands the job back to pg-boss to retry with backoff. Once the
  // retries are exhausted it lands on the dead letter queue, which writes the
  // enquiry into the approval queue for a hand-written reply.
  const generation = await generateDraft(ctx);

  await repo.usage.incrementUsage(clinicId, { aiCalls: 1 });

  const validation = validateDraft(generation.raw, toValidationContext(ctx));
  const output = validation.output;

  // The model is asked to copy an offer id verbatim. If it returned something
  // else, the validator has already recorded SOURCE_UNKNOWN, and writing it to
  // a foreign key column would fail the whole job over a field nobody needs.
  const matchedOfferId =
    output?.matched_offer_id &&
    ctx.offers.some((offer) => offer.id === output.matched_offer_id)
      ? output.matched_offer_id
      : null;

  // Passing every check is the only thing that permits an auto-send. The
  // message row is created in the same transaction as the draft, so a draft can
  // never be marked auto_sent without something queued to actually send.
  const autoSend = validation.passed;
  const body = output?.draft ?? generation.raw.slice(0, RAW_BODY_LIMIT);

  const result = await repo.withTransaction(async (tx) => {
    const draft = await repo.drafts.createDraft(
      clinicId,
      {
        conversationId,
        inboundMessageId,
        draftBody: body,
        claims: output?.claims ?? [],
        matchedOfferId,
        selfConfidence: output?.self_confidence ?? 0,
        validationResult: {
          passed: validation.passed,
          failures: validation.failures,
        },
        state: autoSend ? "auto_sent" : "pending",
      },
      tx,
    );

    const message = autoSend
      ? await queueOutboundReply(clinicId, { conversationId, body }, tx)
      : null;

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: "worker",
        action: "draft.created",
        entityType: "draft",
        entityId: draft.id,
        after: {
          inbound_message_id: inboundMessageId,
          passed: validation.passed,
          failures: validation.failures.map((f) => f.code),
          segments: validation.segments,
          self_confidence: output?.self_confidence ?? null,
          model: generation.model,
          usage: generation.usage,
          auto_sent: autoSend,
          outbound_message_id: message?.id ?? null,
        },
      },
      tx,
    );

    return {
      outboundMessageId: message?.id ?? null,
      queuedDraftId: autoSend ? null : draft.id,
    };
  });

  if (result.outboundMessageId) {
    await startSending(clinicId, result.outboundMessageId, "worker");
  }

  // Auto-sent drafts never alert. A failure here is logged, not thrown: the
  // draft already exists, so a retry of this job would skip, and the sweep
  // covers a missed enqueue.
  if (result.queuedDraftId) {
    await enqueueQueueEmail(clinicId, result.queuedDraftId);
  }
}

/**
 * Dead letter handler. Runs once the draft-reply job has given up. Nothing is
 * drafted; the enquiry is put in front of the operator with a code that the
 * runbook explains, so a Claude outage looks like extra manual work rather than
 * like silence.
 */
export async function handleDraftReplyFailed(
  job: DraftReplyJob,
): Promise<void> {
  const { clinicId, conversationId, inboundMessageId } = job;

  const existing = await repo.drafts.getDraftByInboundMessage(
    clinicId,
    inboundMessageId,
  );
  if (existing) return;

  const draft = await repo.drafts.createDraft(clinicId, {
    conversationId,
    inboundMessageId,
    draftBody: "",
    claims: [],
    selfConfidence: 0,
    validationResult: {
      passed: false,
      failures: [
        {
          code: "AI_UNAVAILABLE",
          detail: "drafting failed after retries, write this reply by hand",
        },
      ],
    },
    state: "pending",
  });

  await repo.audit.recordAudit(clinicId, {
    actor: "worker",
    action: "draft.ai_unavailable",
    entityType: "draft",
    entityId: draft.id,
    after: { inbound_message_id: inboundMessageId },
  });

  await enqueueQueueEmail(clinicId, draft.id);

  console.error(
    `draft-reply: gave up drafting for clinic ${clinicId}, message ${inboundMessageId}. Queued for manual reply.`,
  );
}

async function enqueueQueueEmail(
  clinicId: string,
  draftId: string,
): Promise<void> {
  try {
    await enqueueNotifyEmail({ clinicId, draftId });
  } catch (error) {
    console.error(`failed to enqueue notify-email for ${draftId}:`, error);
  }
}
