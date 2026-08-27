"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { segmentCount } from "@/lib/segments";
import { requireOperator } from "@/server/auth";
import { env } from "@/server/env";
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

/**
 * Approving is what authorises a send, so the decision and the outbound message
 * are written in one transaction. The message is queued, not sent; the worker
 * sends it once this has committed.
 */
async function decide(
  clinicId: string,
  draftId: string,
  state: "approved" | "edited" | "rejected",
  editedBody?: string,
): Promise<ActionResult> {
  const operator = await requireOperator();

  const result = await repo.withTransaction(async (tx) => {
    const before = await repo.drafts.getDraft(clinicId, draftId, tx);
    if (!before) return { ok: false as const, error: "Draft not found" };
    if (before.state !== "pending") {
      return { ok: false as const, error: `Already ${before.state}` };
    }

    const after = await repo.drafts.decideDraft(
      clinicId,
      draftId,
      { state, editedBody, decidedBy: operator.email },
      tx,
    );
    if (!after) {
      return { ok: false as const, error: "Draft was decided by someone else" };
    }

    const body = after.editedBody ?? after.draftBody;
    const message =
      state === "rejected"
        ? null
        : await queueOutboundReply(
            clinicId,
            { conversationId: after.conversationId, body },
            tx,
          );

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: `draft.${state}`,
        entityType: "draft",
        entityId: draftId,
        before: { state: before.state, body: before.draftBody },
        after: {
          state: after.state,
          body,
          outbound_message_id: message?.id ?? null,
        },
      },
      tx,
    );

    return { ok: true as const, messageId: message?.id ?? null };
  });

  if (!result.ok) return result;

  if (result.messageId) {
    await startSending(clinicId, result.messageId, operator.email);
  }

  revalidatePath("/queue");
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

  const refusal = await refuseIfUnsendable(clinicId, draft.draftBody);
  if (refusal) return { ok: false, error: refusal };

  return decide(clinicId, draftId, "approved");
}

export async function rejectDraft(input: unknown): Promise<ActionResult> {
  await requireOperator();
  const parsed = decision.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  return decide(parsed.data.clinicId, parsed.data.draftId, "rejected");
}

const edit = decision.extend({
  body: z.string().trim().min(1, "Reply cannot be empty").max(1000),
});

export async function editAndApproveDraft(
  input: unknown,
): Promise<ActionResult> {
  await requireOperator();
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

  return decide(
    parsed.data.clinicId,
    parsed.data.draftId,
    "edited",
    parsed.data.body,
  );
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
    modelInputFromDraft(draft),
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
