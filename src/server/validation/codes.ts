/**
 * Machine-readable failure codes, from docs/SCHEMA.md. The queue groups by
 * these and the runbook references them by name, so the strings are fixed.
 */
export const FAILURE_CODES = {
  SCHEMA_INVALID: "model output did not parse",
  SOURCE_UNKNOWN: "cited a source_id that does not exist for this clinic",
  INSTRUCTION_CITED: "cited a behaviour entry as if it were a fact",
  SENTENCE_UNCOVERED: "a draft sentence had no claim",
  PRICE_UNVERIFIED: "price not string-matched in KB",
  INTERVAL_UNVERIFIED: "treatment interval not in KB",
  CONTRA_UNVERIFIED: "contraindication or suitability not in KB",
  URL_UNVERIFIED: "link not present verbatim in KB",
  BLOCKED_TERM: "hit the clinic blocked terms list",
  ANSWER_MODE_BLOCKED: "touched a do-not-answer entry",
  UNANSWERABLE: "no KB coverage at all",
  AI_UNAVAILABLE: "drafting failed after retries, reply by hand",
  CONTACT_OPTED_OUT: "contact has opted out",
  BELOW_THRESHOLD: "self_confidence under clinic threshold",
  KILL_SWITCH: "clinic kill switch on",
  SEGMENTS_EXCEEDED: "draft too long",
} as const;

export type FailureCode = keyof typeof FAILURE_CODES;

export function describe(code: FailureCode): string {
  return FAILURE_CODES[code];
}
