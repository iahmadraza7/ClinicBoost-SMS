import { segmentCount } from "@/lib/segments";
import { findBlockedTerms } from "./blocked-terms";
import { buildKbIndex, flattenIntervals, type KbIndex } from "./kb-index";
import { parseModelOutput } from "./model-output";
import {
  CONTRA_TERMS,
  CURRENCY,
  findAll,
  INTERVAL,
  trimUrl,
  URL,
} from "./patterns";
import {
  containsTerm,
  contentWords,
  isPleasantry,
  normalise,
  splitSentences,
} from "./text";
import type {
  DraftValidation,
  Failure,
  KbFact,
  ModelOutput,
  ValidationContext,
} from "./types";

export { FAILURE_CODES, type FailureCode } from "./codes";
export { findBlockedTerms } from "./blocked-terms";
export type {
  DraftValidation,
  KbFact,
  OfferFact,
  ValidationContext,
} from "./types";

/**
 * The deterministic gate. It runs after the model and trusts nothing the model
 * said: not the claims, not the citations, and least of all the confidence
 * score, which is the last check rather than the first.
 *
 * Every check runs and every reason is collected, rather than stopping at the
 * first, so the operator sees the whole picture in one go. The single exception
 * is a parse failure, after which there is nothing left to inspect.
 *
 * Any failure means the draft goes to the approval queue. Passing is the only
 * thing that permits an auto-send.
 */
export function validateDraft(
  raw: unknown,
  ctx: ValidationContext,
): DraftValidation {
  const failures: Failure[] = [];
  const add = (code: Failure["code"], detail: string) =>
    failures.push({ code, detail });

  const parsed = parseModelOutput(raw);
  if (!parsed.ok) {
    add("SCHEMA_INVALID", parsed.detail);
    // Whether this contact opted out, and whether the clinic is switched off,
    // are facts about the world rather than about the model's output. They
    // still hold when nothing parsed, and the operator needs to see them before
    // deciding to write the reply by hand.
    checkContext(ctx, add);
    return { passed: false, failures, output: null, segments: 0 };
  }

  const output = parsed.output;
  const kb = buildKbIndex(ctx.kbEntries, ctx.offers);

  checkCitations(output, kb, add);
  checkSentenceCoverage(output, add);
  checkPrices(output, kb, add);
  checkIntervals(output, kb, add);
  checkContraindications(output, kb, add);
  checkUrls(output, kb, add);
  checkBlockedTerms(output, ctx, add);
  checkAnswerMode(output, ctx, kb, add);
  checkUnanswerable(output, add);

  checkContext(ctx, add);

  if (output.self_confidence < ctx.clinic.confidenceThreshold) {
    add(
      "BELOW_THRESHOLD",
      `self_confidence ${output.self_confidence} is under the clinic threshold of ${ctx.clinic.confidenceThreshold}`,
    );
  }

  const segments = segmentCount(output.draft);
  if (segments > ctx.maxSegments) {
    add(
      "SEGMENTS_EXCEEDED",
      `draft is ${segments} segments, cap is ${ctx.maxSegments}`,
    );
  }

  return { passed: failures.length === 0, failures, output, segments };
}

type Add = (code: Failure["code"], detail: string) => void;

/** Reasons that hold regardless of what, or whether, the model produced. */
function checkContext(ctx: ValidationContext, add: Add) {
  if (ctx.contactOptedOut) {
    add("CONTACT_OPTED_OUT", "contact has opted out of this clinic");
  }

  if (ctx.clinic.killSwitch || ctx.globalKillSwitch) {
    add(
      "KILL_SWITCH",
      ctx.clinic.killSwitch
        ? `kill switch is on for ${ctx.clinic.slug}`
        : "the global kill switch is on",
    );
  }
}

/** Every source_id must resolve to an entry belonging to this clinic. */
function checkCitations(output: ModelOutput, kb: KbIndex, add: Add) {
  for (const claim of output.claims) {
    if (!kb.byKey.has(claim.source_id)) {
      add(
        "SOURCE_UNKNOWN",
        `claim cites "${claim.source_id}", which is not a knowledge base entry for this clinic`,
      );
    }
  }

  if (output.matched_offer_id && !kb.offerIds.has(output.matched_offer_id)) {
    add(
      "SOURCE_UNKNOWN",
      `matched_offer_id "${output.matched_offer_id}" is not an offer for this clinic`,
    );
  }
}

/** Every factual sentence must be backed by a claim. */
function checkSentenceCoverage(output: ModelOutput, add: Add) {
  const claims = output.claims.map((c) => normalise(c.text));

  for (const sentence of splitSentences(output.draft)) {
    if (isPleasantry(sentence)) continue;
    if (!covered(sentence, claims)) {
      add("SENTENCE_UNCOVERED", `no claim covers "${sentence}"`);
    }
  }
}

/**
 * A sentence is covered when claims quoted from it account for every word that
 * could carry a fact. Claims that quote the sentence in part are accepted, and
 * combine, because models routinely drop a leading "Yes," from the quote. What
 * they cannot do is leave a word of substance unquoted: the residue has to be
 * filler.
 */
function covered(sentence: string, claims: string[]): boolean {
  const target = normalise(sentence);

  // One claim spanning the whole sentence, or several sentences at once.
  if (claims.some((claim) => claim === target || claim.includes(target))) {
    return true;
  }

  const outstanding = new Set(contentWords(sentence));
  if (outstanding.size === 0) return true;

  for (const claim of claims) {
    if (!target.includes(claim)) continue;
    for (const word of contentWords(claim)) outstanding.delete(word);
  }

  return outstanding.size === 0;
}

function checkPrices(output: ModelOutput, kb: KbIndex, add: Add) {
  for (const price of findAll(output.draft, CURRENCY)) {
    const compact = price.replace(/\s/g, "");
    if (!kb.priceCorpus.includes(compact)) {
      add(
        "PRICE_UNVERIFIED",
        `"${compact}" does not appear anywhere in the knowledge base`,
      );
    }
  }
}

function checkIntervals(output: ModelOutput, kb: KbIndex, add: Add) {
  for (const interval of findAll(output.draft, INTERVAL)) {
    const flattened = flattenIntervals(interval);
    if (!kb.normalisedCorpus.includes(flattened)) {
      add(
        "INTERVAL_UNVERIFIED",
        `"${interval.trim()}" is not an interval the knowledge base states`,
      );
    }
  }
}

/**
 * Suitability is never inferred. If the draft talks about it at all, a claim
 * has to point at an entry that actually covers suitability.
 */
function checkContraindications(output: ModelOutput, kb: KbIndex, add: Add) {
  const draft = output.draft.toLowerCase();
  const mentioned = CONTRA_TERMS.filter((term) => draft.includes(term));
  if (mentioned.length === 0) return;

  const grounded = output.claims.some((claim) => {
    const entry = kb.byKey.get(claim.source_id);
    return entry ? coversSuitability(entry) : false;
  });

  if (!grounded) {
    add(
      "CONTRA_UNVERIFIED",
      `draft raises suitability (${mentioned.join(", ")}) without citing an entry that covers it`,
    );
  }
}

function coversSuitability(entry: KbFact): boolean {
  const haystack = `${entry.entryKey} ${entry.title} ${entry.body}`.toLowerCase();
  return CONTRA_TERMS.some((term) => haystack.includes(term));
}

function checkUrls(output: ModelOutput, kb: KbIndex, add: Add) {
  const corpus = kb.corpus.toLowerCase();

  for (const match of findAll(output.draft, URL)) {
    const url = trimUrl(match);
    if (!corpus.includes(url.toLowerCase())) {
      add("URL_UNVERIFIED", `"${url}" is not a link in the knowledge base`);
    }
  }
}

function checkBlockedTerms(
  output: ModelOutput,
  ctx: ValidationContext,
  add: Add,
) {
  for (const hit of findBlockedTerms(output.draft, ctx.blockedTerms)) {
    add(
      "BLOCKED_TERM",
      `draft contains the blocked term "${hit.term}" (${hit.reason})`,
    );
  }
}

/**
 * A do-not-answer topic always queues. It is tripped either by citing a blocked
 * entry, or by the topic appearing in the customer's question or in the draft.
 * Never attempting the answer is the point, so the deflect queues too.
 */
function checkAnswerMode(
  output: ModelOutput,
  ctx: ValidationContext,
  kb: KbIndex,
  add: Add,
) {
  const blockedByCitation = new Set<string>();

  for (const claim of output.claims) {
    const entry = kb.byKey.get(claim.source_id);
    if (entry && entry.answerMode === "blocked") {
      blockedByCitation.add(entry.entryKey);
      add(
        "ANSWER_MODE_BLOCKED",
        `claim cites "${entry.entryKey}", which is listed as do not answer`,
      );
    }
  }

  const haystack = `${ctx.inboundQuestion}\n${output.draft}`;

  for (const entry of ctx.kbEntries) {
    if (entry.answerMode !== "blocked") continue;
    if (blockedByCitation.has(entry.entryKey)) continue;

    const trigger = entry.triggerTerms.find((term) =>
      containsTerm(haystack, term),
    );
    if (trigger) {
      add(
        "ANSWER_MODE_BLOCKED",
        `"${trigger}" touches "${entry.entryKey}", which is listed as do not answer`,
      );
    }
  }
}

function checkUnanswerable(output: ModelOutput, add: Add) {
  if (output.unanswered) {
    add("UNANSWERABLE", "the model reported it could not answer from the KB");
    return;
  }

  if (output.claims.length > 0) return;

  const factual = splitSentences(output.draft).filter((s) => !isPleasantry(s));
  if (factual.length > 0) {
    add(
      "UNANSWERABLE",
      "the draft makes statements but cites no knowledge base entry at all",
    );
  }
}
