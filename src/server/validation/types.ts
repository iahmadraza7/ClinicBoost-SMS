import type { AnswerMode, CloseType } from "../db/schema";
import type { FailureCode } from "./codes";

/**
 * The validator takes plain data, never a database handle. Everything it needs
 * is loaded once by the caller and passed in, which is what makes it cheap to
 * test against real clinic content without a database.
 */

export type KbFact = {
  entryKey: string;
  title: string;
  body: string;
  answerMode: AnswerMode;
  blockDeflect: string | null;
  triggerTerms: string[];
};

export type OfferFact = {
  id: string;
  name: string;
  priceDisplay: string;
  rrpDisplay: string | null;
  bookingUrl: string;
};

export type ClinicFact = {
  id: string;
  slug: string;
  confidenceThreshold: number;
  killSwitch: boolean;
  closeType: CloseType;
};

export type ValidationContext = {
  clinic: ClinicFact;
  kbEntries: KbFact[];
  offers: OfferFact[];
  blockedTerms: { term: string; reason: string }[];
  contactOptedOut: boolean;
  inboundQuestion: string;
  maxSegments: number;
  globalKillSwitch: boolean;
};

export type Failure = { code: FailureCode; detail: string };

export type ModelOutput = {
  draft: string;
  claims: { text: string; source_id: string }[];
  unanswered: boolean;
  matched_offer_id: string | null;
  self_confidence: number;
};

export type DraftValidation = {
  passed: boolean;
  failures: Failure[];
  /** Null when the output did not parse. */
  output: ModelOutput | null;
  segments: number;
};
