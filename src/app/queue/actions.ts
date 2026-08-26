"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { segmentCount } from "@/lib/segments";
import { requireOperator } from "@/server/auth";
import { env } from "@/server/env";
import * as repo from "@/server/repo";
import { queueOutboundReply, startSending } from "@/server/sms/dispatch";
import { checkSendable, describeBlocks } from "@/server/sms/guards";

const decision = z.object({
  clinicId: z.string().uuid(),
  draftId: z.string().uuid(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

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
