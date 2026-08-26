import { z } from "zod";

import type { ModelOutput } from "./types";

/**
 * The contract from CLAUDE.md. The model returns this and nothing else: no
 * prose, no markdown fences. Anything that does not parse is SCHEMA_INVALID and
 * the draft goes to the queue.
 */
export const modelOutputSchema = z.object({
  draft: z.string().min(1),
  claims: z.array(
    z.object({
      text: z.string().min(1),
      source_id: z.string().min(1),
    }),
  ),
  unanswered: z.boolean(),
  matched_offer_id: z.string().min(1).nullable(),
  self_confidence: z.number().int().min(0).max(100),
});

export type ParseResult =
  | { ok: true; output: ModelOutput }
  | { ok: false; detail: string };

export function parseModelOutput(raw: unknown): ParseResult {
  let candidate: unknown = raw;

  if (typeof raw === "string") {
    try {
      candidate = JSON.parse(raw);
    } catch {
      return { ok: false, detail: "response was not valid JSON" };
    }
  }

  const parsed = modelOutputSchema.safeParse(candidate);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    return { ok: false, detail };
  }

  return { ok: true, output: parsed.data };
}
