/**
 * Text handling shared by the checks. Deliberately small and boring: every
 * function here decides whether a draft can be sent without a human, so each
 * one has to be readable at a glance.
 */

/** Lowercase, straighten quotes, collapse whitespace, drop edge punctuation. */
export function normalise(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[.,!?;:'"()\s]+|[.,!?;:'"()\s]+$/g, "");
}

/**
 * Splits on sentence punctuation only when whitespace and a new sentence
 * follow. A full stop inside a URL or a price never splits.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=["'(\p{Lu}\d])/u))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const PLEASANTRIES = [
  /^(hi|hey|hello|hiya|morning|afternoon|evening)\b[\w\s',!.-]{0,30}$/i,
  /^(thanks|thank you|no worries|no problem|all good|sure thing|of course|youre welcome|you're welcome)\b[\w\s',!.-]{0,25}$/i,
  /^(great|awesome|lovely|perfect|nice one|good one|sounds good)\b[\w\s',!.-]{0,20}$/i,
];

/**
 * A greeting is not a factual claim, so it does not need a knowledge base
 * entry behind it. The list is short on purpose, and anything carrying a
 * number, a price or a link is never exempt however it is phrased.
 */
export function isPleasantry(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (/[\d$]/.test(trimmed)) return false;
  if (/https?:\/\//i.test(trimmed)) return false;
  return PLEASANTRIES.some((pattern) => pattern.test(trimmed));
}

/**
 * Words that cannot carry a checkable fact on their own. Used only to decide
 * whether a claim quotes enough of a sentence, never to decide whether
 * something is safe to say. Kept deliberately short: anything not on this list
 * has to be inside a claim.
 */
const FILLER = new Set([
  "a", "about", "all", "also", "an", "and", "any", "are", "as", "at", "be",
  "but", "by", "can", "did", "do", "does", "for", "from", "had", "has", "have",
  "he", "hello", "here", "hey", "hi", "i", "if", "in", "is", "it", "its",
  "it's", "just", "me", "my", "nah", "no", "not", "of", "ok", "okay", "on",
  "or", "our", "out", "she", "so", "still", "sure", "thanks", "that", "the",
  "their", "them", "then", "there", "these", "they", "this", "those", "to",
  "up", "us", "was", "we", "were", "will", "with", "would", "yeah", "yep",
  "yes", "you", "your", "you're", "youre",
]);

/**
 * The words of a sentence that a claim has to account for. Prices and links
 * survive as whole tokens so they can be matched against a claim intact.
 */
export function contentWords(text: string): string[] {
  return normalise(text)
    .split(" ")
    .map((token) => token.replace(/^[^\p{L}\p{N}$]+|[^\p{L}\p{N}$/]+$/gu, ""))
    .filter((token) => token.length > 0 && !FILLER.has(token));
}

/** Builds a case-insensitive whole-word matcher, tolerating a plural. */
export function termPattern(term: string): RegExp {
  const escaped = term
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`\\b${escaped}(?:e?s)?\\b`, "i");
}

export function containsTerm(haystack: string, term: string): boolean {
  return termPattern(term).test(haystack);
}
