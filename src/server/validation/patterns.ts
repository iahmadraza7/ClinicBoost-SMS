/**
 * The three things the client said must never be invented are prices, time
 * between treatments, and contraindications. These are the patterns that find
 * them in a draft.
 */

/**
 * $499, $99.75, $1,200, $ 499
 *
 * A comma only counts as part of the amount when digits follow it, so
 * "$399, it's 50% off" yields "$399" and not "$399,". The trailing punctuation
 * would otherwise be looked up in the knowledge base and never found.
 */
export const CURRENCY = /\$\s?\d+(?:,\d{3})*(?:\.\d{1,2})?/g;

/** 8 weeks, 60-minute, 12+ months, 7-10 days (matches the "10 days" tail) */
export const INTERVAL = /\d+\+?[\s-]?(?:day|week|month|year|hour|minute)s?/gi;

export const URL = /https?:\/\/[^\s<>"')\]]+/gi;

/**
 * Suitability and contraindication language. Substrings rather than whole
 * words, so "pregnan" covers pregnant and pregnancy.
 */
export const CONTRA_TERMS = [
  "contraindication",
  "suitable",
  "suitability",
  "safe for",
  "safe to",
  "safe during",
  "pregnan",
  "breastfeed",
  "pacemaker",
  "implant",
  "blood thinner",
  "keloid",
  "allergic",
  "allergy",
  "medical condition",
  "skin condition",
  "side effect",
];

export function findAll(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map(
    (m) => m[0],
  );
}

/** Trailing sentence punctuation is not part of a link. */
export function trimUrl(url: string): string {
  return url.replace(/[.,;:!?]+$/, "");
}
