import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";
import { CLINIC, ENTRIES, OFFERS, seedEntryKind } from "../seed/beauty-soiree";
import type { KbFact, OfferFact, ValidationContext } from "./types";

/**
 * Test fixtures built from the real Beauty Soiree content.
 *
 * These come from src/server/seed/beauty-soiree.ts, which is transcribed from
 * knowledge-source/converted/beauty-soiree.md and asserts on load that the two
 * have not drifted apart. So the validator is tested against the same prices,
 * links and do-not-answer list the clinic actually uses, not invented examples.
 */

export const CLINIC_ID = "00000000-0000-7000-8000-000000000001";

export const kbFacts: KbFact[] = ENTRIES.map((e) => ({
  entryKey: e.entryKey,
  title: e.title,
  body: e.body,
  answerMode: e.answerMode ?? "answerable",
  entryKind: seedEntryKind(e),
  blockDeflect: e.blockDeflect ?? null,
  triggerTerms: e.triggerTerms ?? [],
}));

export const offerFacts: OfferFact[] = OFFERS.map((o) => ({
  id: o.key,
  name: o.name,
  priceDisplay: o.priceDisplay,
  rrpDisplay: o.rrpDisplay,
  bookingUrl: o.bookingUrl,
}));

export function makeContext(
  overrides: Partial<ValidationContext> = {},
): ValidationContext {
  return {
    clinic: {
      id: CLINIC_ID,
      slug: CLINIC.slug,
      confidenceThreshold: CLINIC.confidenceThreshold,
      killSwitch: false,
      closeType: CLINIC.closeType,
    },
    kbEntries: kbFacts,
    offers: offerFacts,
    blockedTerms: S4_BASELINE_TERMS,
    contactOptedOut: false,
    inboundQuestion: "how much is the hifu and how long does it take",
    maxSegments: 3,
    globalKillSwitch: false,
    ...overrides,
  };
}

/**
 * A draft that should pass every check. Each sentence maps to a claim, the
 * price and the link are verbatim from the knowledge base, and the interval is
 * one the file actually states.
 */
export const CLEAN_DRAFT = {
  draft:
    "Hey Sarah. The HIFU Lower Face, Jaw & Neck Lift is $499. It is a 60-minute treatment, one session. Easiest way is to grab your spot here: http://offers.thebeautysoiree.com.au/hifu-499",
  claims: [
    {
      text: "The HIFU Lower Face, Jaw & Neck Lift is $499.",
      source_id: "beauty-soiree.hifu-499.price",
    },
    {
      text: "It is a 60-minute treatment, one session.",
      source_id: "beauty-soiree.hifu-499.duration",
    },
    {
      text: "Easiest way is to grab your spot here: http://offers.thebeautysoiree.com.au/hifu-499",
      source_id: "beauty-soiree.hifu-499.booking-url",
    },
  ],
  unanswered: false,
  matched_offer_id: "hifu-499",
  self_confidence: 95,
};

/** Deep copy so a test mutating the draft cannot leak into the next one. */
export function cleanDraft(
  patch: Partial<typeof CLEAN_DRAFT> = {},
): Record<string, unknown> {
  return { ...structuredClone(CLEAN_DRAFT), ...patch };
}
