import { describe, expect, it } from "vitest";

import { cleanDraft, CLEAN_DRAFT, makeContext } from "./fixtures";
import type { FailureCode } from "./codes";
import { validateDraft } from "./index";
import type { ValidationContext } from "./types";

function codes(
  raw: unknown,
  ctx: ValidationContext = makeContext(),
): FailureCode[] {
  return validateDraft(raw, ctx).failures.map((f) => f.code);
}

describe("the happy path", () => {
  it("passes a draft where every sentence, price, interval and link is grounded", () => {
    const result = validateDraft(cleanDraft(), makeContext());

    expect(result.failures).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.output?.draft).toBe(CLEAN_DRAFT.draft);
  });

  it("accepts the model output as a JSON string, which is how it arrives", () => {
    const result = validateDraft(
      JSON.stringify(cleanDraft()),
      makeContext(),
    );
    expect(result.passed).toBe(true);
  });

  it("reports the segment count regardless of outcome", () => {
    const result = validateDraft(cleanDraft(), makeContext());
    expect(result.segments).toBeGreaterThan(0);
  });
});

describe("SCHEMA_INVALID", () => {
  it("fails when the model returns prose instead of JSON", () => {
    expect(codes("I'm sorry, I can't help with that.")).toEqual([
      "SCHEMA_INVALID",
    ]);
  });

  it("fails when the model wraps JSON in a markdown fence", () => {
    const fenced = "```json\n" + JSON.stringify(cleanDraft()) + "\n```";
    expect(codes(fenced)).toEqual(["SCHEMA_INVALID"]);
  });

  it("fails when a required field is missing", () => {
    const { draft, claims } = cleanDraft() as Record<string, unknown>;
    expect(codes({ draft, claims })).toEqual(["SCHEMA_INVALID"]);
  });

  it("fails when self_confidence is out of range", () => {
    expect(codes(cleanDraft({ self_confidence: 140 }))).toEqual([
      "SCHEMA_INVALID",
    ]);
  });

  it("checks nothing about the draft after a parse failure, since there is no draft", () => {
    const result = validateDraft("not json", makeContext());
    expect(codes("not json")).toEqual(["SCHEMA_INVALID"]);
    expect(result.output).toBeNull();
    expect(result.passed).toBe(false);
  });

  it("still reports an opt-out, which is true whatever the model returned", () => {
    const found = codes("not json", makeContext({ contactOptedOut: true }));
    expect(found).toContain("SCHEMA_INVALID");
    expect(found).toContain("CONTACT_OPTED_OUT");
  });

  it("still reports the kill switch after a parse failure", () => {
    const found = codes("not json", makeContext({ globalKillSwitch: true }));
    expect(found).toContain("SCHEMA_INVALID");
    expect(found).toContain("KILL_SWITCH");
  });
});

describe("SOURCE_UNKNOWN", () => {
  it("fails a citation to another clinic's entry_key", () => {
    const draft = cleanDraft();
    draft.claims = [
      { ...CLEAN_DRAFT.claims[0], source_id: "gem-esthetics.hifu-499.price" },
      CLEAN_DRAFT.claims[1],
      CLEAN_DRAFT.claims[2],
    ];

    expect(codes(draft)).toContain("SOURCE_UNKNOWN");
  });

  it("fails a citation to an entry_key that does not exist at all", () => {
    const draft = cleanDraft();
    draft.claims = [
      { ...CLEAN_DRAFT.claims[0], source_id: "beauty-soiree.hifu-499.invented" },
      CLEAN_DRAFT.claims[1],
      CLEAN_DRAFT.claims[2],
    ];

    expect(codes(draft)).toContain("SOURCE_UNKNOWN");
  });

  it("fails a matched_offer_id that is not an offer for this clinic", () => {
    expect(codes(cleanDraft({ matched_offer_id: "some-other-offer" }))).toContain(
      "SOURCE_UNKNOWN",
    );
  });
});

describe("INSTRUCTION_CITED", () => {
  it("fails a draft that cites price-contrast as a fact source", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Budget clinics sell 3-session packages at $299 each. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "Budget clinics sell 3-session packages at $299 each.",
          source_id: "beauty-soiree.hifu-499.price-contrast",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    const result = validateDraft(draft, makeContext());
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain("INSTRUCTION_CITED");
    expect(result.failures.map((f) => f.code)).not.toContain("SOURCE_UNKNOWN");
  });

  it("does not treat competitor prices in an instruction as verified facts", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Budget clinics sell packages at $299 each. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "Budget clinics sell packages at $299 each.",
          source_id: "beauty-soiree.hifu-499.price",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    expect(codes(draft)).toContain("PRICE_UNVERIFIED");
  });
});

describe("SENTENCE_UNCOVERED", () => {
  it("fails a factual sentence with no claim behind it", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. The HIFU Lower Face, Jaw & Neck Lift is $499. Lisa has done over 100 treatments with zero complications.",
      claims: [CLEAN_DRAFT.claims[0]],
    });

    expect(codes(draft)).toContain("SENTENCE_UNCOVERED");
  });

  it("does not require a claim for a bare greeting", () => {
    const draft = cleanDraft({
      draft: "Hey Sarah. The HIFU Lower Face, Jaw & Neck Lift is $499.",
      claims: [CLEAN_DRAFT.claims[0]],
    });

    expect(codes(draft)).not.toContain("SENTENCE_UNCOVERED");
  });

  it("still requires a claim for a short sentence carrying a number", () => {
    const draft = cleanDraft({
      draft: "Thanks, it is $499.",
      claims: [],
    });

    expect(codes(draft)).toContain("SENTENCE_UNCOVERED");
  });

  it("accepts a claim that quotes the sentence but drops a leading Yes", () => {
    const draft = cleanDraft({
      draft: "Yes, the HIFU Lower Face, Jaw & Neck Lift is $499.",
      claims: [
        {
          text: "the HIFU Lower Face, Jaw & Neck Lift is $499",
          source_id: "beauty-soiree.hifu-499.price",
        },
      ],
    });

    expect(codes(draft)).not.toContain("SENTENCE_UNCOVERED");
  });

  it("combines two partial claims that together quote the whole sentence", () => {
    const draft = cleanDraft({
      draft: "It is $499 and the appointment is 60 minutes.",
      claims: [
        { text: "It is $499", source_id: "beauty-soiree.hifu-499.price" },
        {
          text: "the appointment is 60 minutes",
          source_id: "beauty-soiree.hifu-499.duration",
        },
      ],
    });

    expect(codes(draft)).not.toContain("SENTENCE_UNCOVERED");
  });

  it("fails when a partial claim leaves a word of substance unquoted", () => {
    const draft = cleanDraft({
      draft: "It is $499 and Lisa guarantees the result.",
      claims: [{ text: "It is $499", source_id: "beauty-soiree.hifu-499.price" }],
    });

    expect(codes(draft)).toContain("SENTENCE_UNCOVERED");
  });

  it("does not let a claim quoted from one sentence cover another", () => {
    const draft = cleanDraft({
      draft: "It is $499. Numbing is included.",
      claims: [{ text: "It is $499.", source_id: "beauty-soiree.hifu-499.price" }],
    });

    expect(codes(draft)).toContain("SENTENCE_UNCOVERED");
  });
});

describe("PRICE_UNVERIFIED", () => {
  it("fails a draft quoting $450 when the knowledge base says $499", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. The HIFU Lower Face, Jaw & Neck Lift is $450. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "The HIFU Lower Face, Jaw & Neck Lift is $450.",
          source_id: "beauty-soiree.hifu-499.price",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    const failures = validateDraft(draft, makeContext()).failures;
    expect(failures.map((f) => f.code)).toContain("PRICE_UNVERIFIED");
    expect(failures.find((f) => f.code === "PRICE_UNVERIFIED")?.detail).toContain(
      "$450",
    );
  });

  it("accepts a price that appears in the knowledge base verbatim", () => {
    expect(codes(cleanDraft())).not.toContain("PRICE_UNVERIFIED");
  });

  it("accepts the Afterpay instalment figure, which the file states", () => {
    const draft = cleanDraft({
      draft: "Hey Sarah. Afterpay: 4 payments of $99.75.",
      claims: [
        {
          text: "Afterpay: 4 payments of $99.75.",
          source_id: "beauty-soiree.pmu-399.payment",
        },
      ],
      matched_offer_id: "pmu-399",
    });

    expect(codes(draft)).not.toContain("PRICE_UNVERIFIED");
  });
});

describe("INTERVAL_UNVERIFIED", () => {
  it("fails a treatment interval the knowledge base does not state", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. You will see results in 3 weeks. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "You will see results in 3 weeks.",
          source_id: "beauty-soiree.hifu-499.results",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    expect(codes(draft)).toContain("INTERVAL_UNVERIFIED");
  });

  it("accepts an interval the file actually states", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Results build from around 8 weeks and last 12+ months.",
      claims: [
        {
          text: "Results build from around 8 weeks and last 12+ months.",
          source_id: "beauty-soiree.hifu-499.results",
        },
      ],
    });

    expect(codes(draft)).not.toContain("INTERVAL_UNVERIFIED");
  });

  it("accepts the 60-minute appointment length", () => {
    expect(codes(cleanDraft())).not.toContain("INTERVAL_UNVERIFIED");
  });

  it('accepts "60 minutes" against a KB that writes "60-minute"', () => {
    const draft = cleanDraft({
      draft: "Hey Sarah. The appointment is 60 minutes.",
      claims: [
        {
          text: "The appointment is 60 minutes.",
          source_id: "beauty-soiree.hifu-499.duration",
        },
      ],
    });

    expect(codes(draft)).not.toContain("INTERVAL_UNVERIFIED");
  });

  it("does not let singularising a unit change the number", () => {
    const draft = cleanDraft({
      draft: "Hey Sarah. The appointment is 90 minutes.",
      claims: [
        {
          text: "The appointment is 90 minutes.",
          source_id: "beauty-soiree.hifu-499.duration",
        },
      ],
    });

    expect(codes(draft)).toContain("INTERVAL_UNVERIFIED");
  });
});

describe("CONTRA_UNVERIFIED", () => {
  it("fails suitability language with no knowledge base entry behind it", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. It is suitable for most skin types and perfectly safe during pregnancy.",
      claims: [
        {
          text: "It is suitable for most skin types and perfectly safe during pregnancy.",
          source_id: "beauty-soiree.hifu-499.device",
        },
      ],
    });

    expect(codes(draft)).toContain("CONTRA_UNVERIFIED");
  });

  it("leaves a draft with no suitability language alone", () => {
    expect(codes(cleanDraft())).not.toContain("CONTRA_UNVERIFIED");
  });

  it("still fails a HIFU-for-everyone claim the knowledge base does not support", () => {
    // Voice may ask the model to "be confident about results and reassure
    // customers HIFU works for everyone". validateDraft does not take voice.
    // The gate is the knowledge base, not the STYLE section.
    const draft = cleanDraft({
      draft: "Hey Sarah. HIFU is suitable for everyone.",
      claims: [
        {
          text: "HIFU is suitable for everyone.",
          source_id: "beauty-soiree.hifu-499.device",
        },
      ],
    });

    expect(codes(draft)).toContain("CONTRA_UNVERIFIED");
  });
});

describe("URL_UNVERIFIED", () => {
  it("fails a booking link the model invented", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Easiest way is to grab your spot here: http://offers.thebeautysoiree.com.au/hifu-special",
      claims: [
        {
          text: "Easiest way is to grab your spot here: http://offers.thebeautysoiree.com.au/hifu-special",
          source_id: "beauty-soiree.hifu-499.booking-url",
        },
      ],
    });

    expect(codes(draft)).toContain("URL_UNVERIFIED");
  });

  it("accepts the real booking link", () => {
    expect(codes(cleanDraft())).not.toContain("URL_UNVERIFIED");
  });

  it("fails the other offer's link swapped in with a different path", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Book here: http://offers.thebeautysoiree.com.au/pmu-brows",
      claims: [
        {
          text: "Book here: http://offers.thebeautysoiree.com.au/pmu-brows",
          source_id: "beauty-soiree.pmu-399.booking-url",
        },
      ],
      matched_offer_id: "pmu-399",
    });

    expect(codes(draft)).toContain("URL_UNVERIFIED");
  });
});

describe("BLOCKED_TERM", () => {
  it("fails a draft naming a Schedule 4 product", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. HIFU lifts without Botox. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "HIFU lifts without Botox.",
          source_id: "beauty-soiree.hifu-499.device",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    const failures = validateDraft(draft, makeContext()).failures;
    expect(failures.map((f) => f.code)).toContain("BLOCKED_TERM");
    expect(failures.find((f) => f.code === "BLOCKED_TERM")?.detail).toMatch(
      /botox/i,
    );
  });

  it("fails a Schedule 4 category term, not just a brand name", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. It works well alongside anti wrinkle injections. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "It works well alongside anti wrinkle injections.",
          source_id: "beauty-soiree.hifu-499.device",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    expect(codes(draft)).toContain("BLOCKED_TERM");
  });

  it("does not fire on a word that merely contains a blocked term", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. The detox side of things is not what this is. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "The detox side of things is not what this is.",
          source_id: "beauty-soiree.hifu-499.device",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    expect(codes(draft)).not.toContain("BLOCKED_TERM");
  });
});

describe("ANSWER_MODE_BLOCKED", () => {
  it("fails a draft answering whether HIFU hurts", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Most people say it does not really hurt at all. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "Most people say it does not really hurt at all.",
          source_id: "beauty-soiree.hifu-499.duration",
        },
        CLEAN_DRAFT.claims[1],
      ],
    });

    const ctx = makeContext({ inboundQuestion: "hi does the hifu hurt much?" });
    expect(codes(draft, ctx)).toContain("ANSWER_MODE_BLOCKED");
  });

  it("fails when the customer asks a do-not-answer question, even if the draft deflects", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. That one is best answered by Lisa directly. Text or call her on 0405 087 121.",
      claims: [
        {
          text: "That one is best answered by Lisa directly.",
          source_id: "beauty-soiree.config.phone",
        },
        {
          text: "Text or call her on 0405 087 121.",
          source_id: "beauty-soiree.config.phone",
        },
      ],
    });

    const ctx = makeContext({
      inboundQuestion: "am I ok to get this done while pregnant?",
    });
    expect(codes(draft, ctx)).toContain("ANSWER_MODE_BLOCKED");
  });

  it("fails when a claim cites a do-not-answer entry directly", () => {
    const draft = cleanDraft({
      draft: "Hey Sarah. We are open Saturdays.",
      claims: [
        {
          text: "We are open Saturdays.",
          source_id: "beauty-soiree.config.hours",
        },
      ],
    });

    expect(codes(draft)).toContain("ANSWER_MODE_BLOCKED");
  });

  it("leaves an ordinary price and duration question alone", () => {
    expect(codes(cleanDraft())).not.toContain("ANSWER_MODE_BLOCKED");
  });
});

describe("UNANSWERABLE", () => {
  it("fails when the model says it could not answer", () => {
    expect(codes(cleanDraft({ unanswered: true }))).toContain("UNANSWERABLE");
  });

  it("fails a factual draft with no claims at all", () => {
    const draft = cleanDraft({
      draft: "Hey Sarah. The treatment takes 60 minutes.",
      claims: [],
    });

    expect(codes(draft)).toContain("UNANSWERABLE");
  });
});

describe("CONTACT_OPTED_OUT", () => {
  it("fails when the contact has opted out of this clinic", () => {
    const ctx = makeContext({ contactOptedOut: true });
    expect(codes(cleanDraft(), ctx)).toContain("CONTACT_OPTED_OUT");
  });
});

describe("BELOW_THRESHOLD", () => {
  it("fails when self_confidence is under the clinic threshold", () => {
    expect(codes(cleanDraft({ self_confidence: 80 }))).toContain(
      "BELOW_THRESHOLD",
    );
  });

  it("passes at exactly the threshold", () => {
    expect(codes(cleanDraft({ self_confidence: 90 }))).not.toContain(
      "BELOW_THRESHOLD",
    );
  });

  it("respects a per-clinic threshold", () => {
    const ctx = makeContext({
      clinic: { ...makeContext().clinic, confidenceThreshold: 99 },
    });
    expect(codes(cleanDraft({ self_confidence: 95 }), ctx)).toContain(
      "BELOW_THRESHOLD",
    );
  });
});

describe("KILL_SWITCH", () => {
  it("fails when the clinic kill switch is on", () => {
    const ctx = makeContext({
      clinic: { ...makeContext().clinic, killSwitch: true },
    });
    expect(codes(cleanDraft(), ctx)).toContain("KILL_SWITCH");
  });

  it("fails when the global kill switch is on", () => {
    const ctx = makeContext({ globalKillSwitch: true });
    expect(codes(cleanDraft(), ctx)).toContain("KILL_SWITCH");
  });
});

describe("SEGMENTS_EXCEEDED", () => {
  it("fails a draft over the segment cap", () => {
    const long = `Hey Sarah. ${"The HIFU Lower Face, Jaw & Neck Lift is $499. ".repeat(12)}`;
    const draft = cleanDraft({
      draft: long,
      claims: [CLEAN_DRAFT.claims[0]],
    });

    const result = validateDraft(draft, makeContext());
    expect(result.failures.map((f) => f.code)).toContain("SEGMENTS_EXCEEDED");
    expect(result.segments).toBeGreaterThan(3);
  });

  it("respects a lower cap", () => {
    const ctx = makeContext({ maxSegments: 1 });
    expect(codes(cleanDraft(), ctx)).toContain("SEGMENTS_EXCEEDED");
  });
});

describe("confidence is the last check, not the first", () => {
  it("still queues at self_confidence 99 when the price is wrong", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. The HIFU Lower Face, Jaw & Neck Lift is $450. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "The HIFU Lower Face, Jaw & Neck Lift is $450.",
          source_id: "beauty-soiree.hifu-499.price",
        },
        CLEAN_DRAFT.claims[1],
      ],
      self_confidence: 99,
    });

    const result = validateDraft(draft, makeContext());
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.code)).toContain("PRICE_UNVERIFIED");
    expect(result.failures.map((f) => f.code)).not.toContain("BELOW_THRESHOLD");
  });

  it("still queues at self_confidence 99 when a Schedule 4 term appears", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Better value than dermal filler. It is a 60-minute treatment, one session.",
      claims: [
        {
          text: "Better value than dermal filler.",
          source_id: "beauty-soiree.hifu-499.price-contrast",
        },
        CLEAN_DRAFT.claims[1],
      ],
      self_confidence: 99,
    });

    expect(validateDraft(draft, makeContext()).passed).toBe(false);
  });

  it("reports every reason at once so the operator sees the whole picture", () => {
    const draft = cleanDraft({
      draft:
        "Hey Sarah. Botox and HIFU both cost $450 and you wait 3 weeks. Book at http://offers.thebeautysoiree.com.au/made-up",
      claims: [],
      self_confidence: 99,
    });

    const found = codes(draft);
    expect(found).toContain("PRICE_UNVERIFIED");
    expect(found).toContain("INTERVAL_UNVERIFIED");
    expect(found).toContain("URL_UNVERIFIED");
    expect(found).toContain("BLOCKED_TERM");
    expect(found).toContain("SENTENCE_UNCOVERED");
  });
});
