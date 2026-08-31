"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOperator } from "@/server/auth";
import * as repo from "@/server/repo";

export type RevertResult = { ok: true } | { ok: false; error: string };

const input = z.object({
  clinicId: z.string().uuid(),
  auditId: z.string().uuid(),
});

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Dismiss and redraft are revertible from the audit log. Revert puts the
 * original item back in the pending queue. A redraft also closes the replacement
 * draft if it is still waiting.
 */
export async function revertAudit(raw: unknown): Promise<RevertResult> {
  const operator = await requireOperator();
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const { clinicId, auditId } = parsed.data;
  const row = await repo.audit.getAudit(clinicId, auditId);
  if (!row) return { ok: false, error: "Audit entry not found" };

  if (row.action !== "draft.dismissed" && row.action !== "draft.redrafted") {
    return { ok: false, error: "Only dismiss and redraft can be reverted" };
  }

  const after = asRecord(row.after);
  const draftId = row.entityId;

  const result = await repo.withTransaction(async (tx) => {
    if (row.action === "draft.dismissed") {
      const restored = await repo.drafts.reopenDraft(
        clinicId,
        draftId,
        ["dismissed"],
        tx,
      );
      if (!restored) {
        return {
          ok: false as const,
          error: "That draft is no longer dismissed",
        };
      }
    } else {
      const newId =
        typeof after.new_draft_id === "string" ? after.new_draft_id : null;
      if (newId) {
        const replacement = await repo.drafts.getDraft(clinicId, newId, tx);
        if (replacement?.state === "pending") {
          await repo.drafts.closePendingDraft(
            clinicId,
            newId,
            "dismissed",
            operator.email,
            tx,
          );
        } else if (replacement && replacement.state !== "dismissed") {
          return {
            ok: false as const,
            error: "The replacement draft has already been decided",
          };
        }
      }

      const restored = await repo.drafts.reopenDraft(
        clinicId,
        draftId,
        ["redrafted"],
        tx,
      );
      if (!restored) {
        return {
          ok: false as const,
          error: "That draft is no longer waiting to be reverted",
        };
      }
    }

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: operator.email,
        action: "draft.reverted",
        entityType: "draft",
        entityId: draftId,
        before: { action: row.action },
        after: {
          restored: row.action === "draft.dismissed" ? "dismissed" : "redrafted",
          closed_draft_id:
            row.action === "draft.redrafted" ? after.new_draft_id ?? null : null,
        },
      },
      tx,
    );

    return { ok: true as const };
  });

  revalidatePath("/queue");
  revalidatePath("/audit");
  return result;
}
