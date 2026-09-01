import type { KbFact, OfferFact } from "./types";

/**
 * Everything this clinic is allowed to state as fact, flattened into one
 * searchable blob. Instruction entries govern behaviour; they are indexed by
 * key so a citation can fail INSTRUCTION_CITED, but their bodies are not
 * matched as prices, intervals or URLs.
 */
export type KbIndex = {
  byKey: Map<string, KbFact>;
  offerIds: Set<string>;
  /** Original text, for verbatim URL and price matching. */
  corpus: string;
  /** Lowercased, hyphens flattened to spaces, whitespace collapsed. */
  normalisedCorpus: string;
  /** Corpus with the space after a currency symbol removed. */
  priceCorpus: string;
};

export function buildKbIndex(
  entries: KbFact[],
  offers: OfferFact[],
): KbIndex {
  const pieces: string[] = [];

  for (const entry of entries) {
    if (entry.entryKind === "instruction") continue;
    pieces.push(entry.title, entry.body);
    if (entry.blockDeflect) pieces.push(entry.blockDeflect);
  }

  for (const offer of offers) {
    pieces.push(offer.name, offer.priceDisplay, offer.bookingUrl);
    if (offer.rrpDisplay) pieces.push(offer.rrpDisplay);
  }

  const corpus = pieces.join("\n");

  return {
    byKey: new Map(entries.map((e) => [e.entryKey, e])),
    offerIds: new Set(offers.map((o) => o.id)),
    corpus,
    normalisedCorpus: flattenIntervals(corpus),
    priceCorpus: corpus.replace(/\$\s+/g, "$"),
  };
}

/**
 * Both sides of an interval comparison are flattened the same way, so that the
 * knowledge base writing "60-minute treatment" verifies a draft saying "60
 * minutes". Hyphens become spaces and a plural unit becomes singular. Only the
 * shape changes; the number never does.
 */
export function flattenIntervals(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-\u2013\u2014]/g, " ")
    .replace(/\s+/g, " ")
    .replace(
      /(\d+)\s+(minute|hour|day|week|month|year)s\b/g,
      (_, n: string, unit: string) => `${n} ${unit}`,
    );
}
