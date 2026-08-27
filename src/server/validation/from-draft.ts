import type { Claim, ValidationResult } from "../db/schema";
import type { ModelOutput } from "./types";

/**
 * Rebuilds what the validator should see for a stored draft. Structured fields
 * are preferred; a SCHEMA_INVALID draft is fed back as the original raw body
 * so a later parser fix can clear it.
 */
export function modelInputFromDraft(draft: {
  draftBody: string;
  claims: Claim[];
  matchedOfferId: string | null;
  selfConfidence: number;
  validationResult: ValidationResult | null;
}): unknown {
  if (draft.validationResult?.failures.some((f) => f.code === "SCHEMA_INVALID")) {
    return draft.draftBody;
  }

  const unanswered =
    draft.validationResult?.failures.some(
      (f) =>
        f.code === "UNANSWERABLE" &&
        f.detail.includes("could not answer from the KB"),
    ) ?? false;

  const input: ModelOutput = {
    draft: draft.draftBody,
    claims: draft.claims,
    unanswered,
    matched_offer_id: draft.matchedOfferId,
    self_confidence: draft.selfConfidence,
  };
  return input;
}
