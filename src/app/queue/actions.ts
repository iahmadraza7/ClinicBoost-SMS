"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { segmentCount } from "@/lib/segments";
import { generateDraft } from "@/server/ai";
import { requireOperator } from "@/server/auth";
import { env } from "@/server/env";
import { operatorSaveMeta } from "@/server/kb/fields";
import { loadReplyContext } from "@/server/reply-context";
import * as repo from "@/server/repo";
import { queueOutboundReply, startSending } from "@/server/sms/dispatch";
import { checkSendable, describeBlocks } from "@/server/sms/guards";
import { validateDraft } from "@/server/validation";
import { modelInputFromDraft } from "@/server/validation/from-draft";
import { toValidationContext } from "@/server/validation/from-reply-context";

const decision = z.object({
  clinicId: z.string().uuid(),
  draftId: z.string().uuid(),
});

export type ActionResult =
  | { ok: true; passed?: boolean }
  | { ok: false; error: string };

const RAW_BODY_LIMIT = 2000;

function revalidateQueue() {
  revalidatePath("/queue");
  revalidatePath("/audit");
}

/**
 * Approving is what authorises a send, so the decision and the outbound message
 * are written in one transaction. The message is queued, not sent; the worker
 * sends it once this has committed.
 */
async function sendApproved(
  clinicId: string,
  draftId: string,
): Promise<ActionResult> {
  const operator = await requireOperator();

  const result = await repo.withTransaction(async (tx) => {
    const before = await repo.drafts.getDraft(clinicId, draftId, tx);
    if (!before) return { ok: false as const, error: "Draft not found" };
    if (before.state !== "pending") {
      return { ok: false as const, error: `Already ${before.state}` };
    }

    const body = before.editedBody ?? before.draftBody;
    const after = await repo.drafts.decideDraft(
      clinicId,
      draftId,
      { state: "approved", decidedBy: operator.email },
      tx,
    );
    if (!after) {
      return { ok: false as const, error: "Draft was decided by someone else" };
    }

    const message = await queueOutboundReply(
      clinicId,
      { conversationId: after.conversationId, body },
      tx,
    );

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: "draft.approved",
        entityType: "draft",
        entityId: draftId,
        before: { state: before.state, body: before.draftBody },
        after: {
          state: after.state,
          body,
          outbound_message_id: message.id,
        },
      },
      tx,
    );

    return { ok: true as const, messageId: message.id };
  });

  if (!result.ok) return result;

  if (result.messageId) {
    await startSending(clinicId, result.messageId, operator.email);
  }

  revalidateQueue();
  return { ok: true };
}

/**
 * Runs before an approval is recorded. The operator can type anything into the
 * edit box, and a Schedule 4 term in a hand-written reply breaks the same law
 * as one the model wrote.
 */
async function refuseIfUnsendable(
  clinicId: string,
  body: string,
): Promise<string | null> {
  const [clinic, blocked] = await Promise.all([
    repo.clinics.getClinic(clinicId),
    repo.blockedTerms.listBlockedTerms(clinicId),
  ]);
  if (!clinic) return "Clinic not found";

  const blocks = checkSendable({
    body,
    clinicSlug: clinic.slug,
    killSwitch: clinic.killSwitch,
    globalKillSwitch: env.GLOBAL_KILL_SWITCH,
    // Opt-out is re-checked at send time against the contact for this thread.
    contactOptedOut: false,
    blockedTerms: blocked,
    maxSegments: env.MAX_SEGMENTS_PER_DRAFT,
  });

  return blocks.length > 0 ? describeBlocks(blocks) : null;
}

export async function approveDraft(input: unknown): Promise<ActionResult> {
  await requireOperator();
  const parsed = decision.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { clinicId, draftId } = parsed.data;
  const draft = await repo.drafts.getDraft(clinicId, draftId);
  if (!draft) return { ok: false, error: "Draft not found" };

  const body = draft.editedBody ?? draft.draftBody;
  const refusal = await refuseIfUnsendable(clinicId, body);
  if (refusal) return { ok: false, error: refusal };

  return sendApproved(clinicId, draftId);
}

/**
 * Spam, wrong number, nothing needing a reply. Closes the item. Sends nothing.
 */
export async function dismissDraft(input: unknown): Promise<ActionResult> {
  const operator = await requireOperator();
  const parsed = decision.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { clinicId, draftId } = parsed.data;

  const result = await repo.withTransaction(async (tx) => {
    const before = await repo.drafts.getDraft(clinicId, draftId, tx);
    if (!before) return { ok: false as const, error: "Draft not found" };
    if (before.state !== "pending") {
      return { ok: false as const, error: `Already ${before.state}` };
    }

    const after = await repo.drafts.decideDraft(
      clinicId,
      draftId,
      { state: "dismissed", decidedBy: operator.email },
      tx,
    );
    if (!after) {
      return { ok: false as const, error: "Draft was decided by someone else" };
    }

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: "draft.dismissed",
        entityType: "draft",
        entityId: draftId,
        before: { state: before.state, body: before.draftBody },
        after: { state: after.state },
      },
      tx,
    );

    return { ok: true as const };
  });

  revalidateQueue();
  return result;
}

const redraft = decision.extend({
  note: z
    .string()
    .trim()
    .min(1, "Leave a short note on what was wrong")
    .max(500),
});

/**
 * The answer was wrong. The note goes to the model as correction context, a
 * new draft is generated, and that draft returns to the queue.
 */
export async function redraftDraft(input: unknown): Promise<ActionResult> {
  const operator = await requireOperator();
  const parsed = redraft.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const { clinicId, draftId, note } = parsed.data;
  const before = await repo.drafts.getDraft(clinicId, draftId);
  if (!before) return { ok: false, error: "Draft not found" };
  if (before.state !== "pending") {
    return { ok: false, error: `Already ${before.state}` };
  }

  const ctx = await loadReplyContext(clinicId, {
    conversationId: before.conversationId,
    inboundMessageId: before.inboundMessageId,
  });
  if (!ctx) {
    return { ok: false, error: "Could not load the enquiry for this draft" };
  }

  let generation;
  try {
    generation = await generateDraft(ctx, { correctionNote: note });
  } catch {
    return { ok: false, error: "Could not generate a new draft. Try again." };
  }

  await repo.usage.incrementUsage(clinicId, { aiCalls: 1 });

  const validation = validateDraft(generation.raw, toValidationContext(ctx));
  const output = validation.output;
  const matchedOfferId =
    output?.matched_offer_id &&
    ctx.offers.some((offer) => offer.id === output.matched_offer_id)
      ? output.matched_offer_id
      : null;
  const body = output?.draft ?? generation.raw.slice(0, RAW_BODY_LIMIT);

  const result = await repo.withTransaction(async (tx) => {
    const closed = await repo.drafts.decideDraft(
      clinicId,
      draftId,
      {
        state: "redrafted",
        correctionNote: note,
        decidedBy: operator.email,
      },
      tx,
    );
    if (!closed) {
      return { ok: false as const, error: "Draft was decided by someone else" };
    }

    const next = await repo.drafts.createDraft(
      clinicId,
      {
        conversationId: before.conversationId,
        inboundMessageId: before.inboundMessageId,
        draftBody: body,
        claims: output?.claims ?? [],
        matchedOfferId,
        selfConfidence: output?.self_confidence ?? 0,
        validationResult: {
          passed: validation.passed,
          failures: validation.failures,
        },
        state: "pending",
        redraftOf: draftId,
      },
      tx,
    );

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: "draft.redrafted",
        entityType: "draft",
        entityId: draftId,
        before: { state: before.state, body: before.draftBody },
        after: {
          state: "redrafted",
          note,
          new_draft_id: next.id,
        },
      },
      tx,
    );

    return { ok: true as const };
  });

  revalidateQueue();
  return result;
}

const edit = decision.extend({
  body: z.string().trim().min(1, "Reply cannot be empty").max(1000),
});

/**
 * Saves the edit and leaves the item pending. Approving is a separate action.
 * The edited text is also stored as a knowledge base suggestion.
 */
export async function saveEditDraft(input: unknown): Promise<ActionResult> {
  const operator = await requireOperator();
  const parsed = edit.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  const segments = segmentCount(parsed.data.body);
  if (segments > env.MAX_SEGMENTS_PER_DRAFT) {
    return {
      ok: false,
      error: `${segments} segments, cap is ${env.MAX_SEGMENTS_PER_DRAFT}`,
    };
  }

  const refusal = await refuseIfUnsendable(
    parsed.data.clinicId,
    parsed.data.body,
  );
  if (refusal) return { ok: false, error: refusal };

  const { clinicId, draftId, body } = parsed.data;
  const clinic = await repo.clinics.getClinic(clinicId);
  if (!clinic) return { ok: false, error: "Clinic not found" };

  const result = await repo.withTransaction(async (tx) => {
    const before = await repo.drafts.getDraft(clinicId, draftId, tx);
    if (!before) return { ok: false as const, error: "Draft not found" };
    if (before.state !== "pending") {
      return { ok: false as const, error: `Already ${before.state}` };
    }

    const after = await repo.drafts.saveEditedBody(clinicId, draftId, body, tx);
    if (!after) {
      return { ok: false as const, error: "Draft was decided by someone else" };
    }

    const suggestionId = await upsertEditSuggestion(
      clinic,
      after,
      body,
      operator.email,
      tx,
    );

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: "draft.edited",
        entityType: "draft",
        entityId: draftId,
        before: { state: before.state, body: before.draftBody },
        after: {
          state: after.state,
          body,
          kb_entry_id: suggestionId,
        },
      },
      tx,
    );

    return { ok: true as const };
  });

  revalidateQueue();
  revalidatePath(`/clinics/${clinic.slug}/knowledge`);
  revalidatePath(`/clinics/${clinic.slug}/knowledge/pending-edits`);
  return result;
}

async function upsertEditSuggestion(
  clinic: { id: string; slug: string },
  draft: { id: string; inboundMessageId: string },
  body: string,
  actor: string,
  tx: repo.Executor,
): Promise<string> {
  const existing = await repo.kb.getKbEntryBySourceDraft(clinic.id, draft.id, tx);
  if (existing) {
    const updated = await repo.kb.updateKbEntry(
      clinic.id,
      existing.id,
      { body, title: existing.title, ...operatorSaveMeta() },
      tx,
    );
    return updated?.id ?? existing.id;
  }

  const inbound = await repo.messages.getMessage(
    clinic.id,
    draft.inboundMessageId,
    tx,
  );
  const asked = (inbound?.body ?? "enquiry").replace(/\s+/g, " ").slice(0, 80);
  const entryKey = `${clinic.slug}.operator-edit.${draft.id.replace(/-/g, "")}`;

  const created = await repo.kb.createKbEntry(
    clinic.id,
    {
      entryKey,
      category: "faq",
      title: `Operator edit: ${asked}`,
      body,
      answerMode: "answerable",
      sourceDraftId: draft.id,
      createdBy: actor,
      ...operatorSaveMeta(),
    },
    tx,
  );

  await repo.audit.recordAudit(
    clinic.id,
    {
      actor,
      action: "kb.created",
      entityType: "kb_entry",
      entityId: created.id,
      after: {
        entry_key: created.entryKey,
        source_draft_id: draft.id,
        from_queue_edit: true,
      },
    },
    tx,
  );

  return created.id;
}

/**
 * Runs today's validator against a queued draft. Old items keep the codes
 * they were created with until this is used. Passing does not send; it
 * updates the chips so Approve is not working around a stale failure.
 */
export async function revalidateDraft(input: unknown): Promise<ActionResult> {
  const operator = await requireOperator();
  const parsed = decision.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { clinicId, draftId } = parsed.data;
  const draft = await repo.drafts.getDraft(clinicId, draftId);
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.state !== "pending") {
    return { ok: false, error: `Already ${draft.state}` };
  }

  const ctx = await loadReplyContext(clinicId, {
    conversationId: draft.conversationId,
    inboundMessageId: draft.inboundMessageId,
  });
  if (!ctx) {
    return { ok: false, error: "Could not load the enquiry for this draft" };
  }

  const validation = validateDraft(
    modelInputFromDraft({
      ...draft,
      draftBody: draft.editedBody ?? draft.draftBody,
    }),
    toValidationContext(ctx),
  );

  const result = await repo.withTransaction(async (tx) => {
    const after = await repo.drafts.updateValidationResult(
      clinicId,
      draftId,
      { passed: validation.passed, failures: validation.failures },
      tx,
    );
    if (!after) {
      return { ok: false as const, error: "Draft was decided by someone else" };
    }

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: "draft.revalidated",
        entityType: "draft",
        entityId: draftId,
        before: {
          passed: draft.validationResult?.passed ?? null,
          failures: draft.validationResult?.failures.map((f) => f.code) ?? [],
        },
        after: {
          passed: validation.passed,
          failures: validation.failures.map((f) => f.code),
        },
      },
      tx,
    );

    return { ok: true as const, passed: validation.passed };
  });

  revalidatePath("/queue");
  return result;
}
