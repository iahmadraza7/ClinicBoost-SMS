import { describe, expect, it } from "vitest";

import { modelInputFromDraft } from "./from-draft";

describe("modelInputFromDraft", () => {
  const base = {
    draftBody: "HIFU is 60 minutes.",
    claims: [{ text: "HIFU is 60 minutes.", source_id: "beauty-soiree.hifu.duration" }],
    matchedOfferId: "offer-1",
    selfConfidence: 92,
    validationResult: {
      passed: false,
      failures: [{ code: "BELOW_THRESHOLD", detail: "self_confidence 80 is under 90" }],
    },
  };

  it("rebuilds structured output so a later threshold change can clear", () => {
    expect(modelInputFromDraft(base)).toEqual({
      draft: "HIFU is 60 minutes.",
      claims: base.claims,
      unanswered: false,
      matched_offer_id: "offer-1",
      self_confidence: 92,
    });
  });

  it("feeds SCHEMA_INVALID drafts back as the raw body", () => {
    expect(
      modelInputFromDraft({
        ...base,
        draftBody: "{not json",
        claims: [],
        validationResult: {
          passed: false,
          failures: [{ code: "SCHEMA_INVALID", detail: "response was not valid JSON" }],
        },
      }),
    ).toBe("{not json");
  });

  it("keeps the model's unanswered flag when that is why it queued", () => {
    expect(
      modelInputFromDraft({
        ...base,
        claims: [],
        validationResult: {
          passed: false,
          failures: [
            {
              code: "UNANSWERABLE",
              detail: "the model reported it could not answer from the KB",
            },
          ],
        },
      }),
    ).toMatchObject({ unanswered: true });
  });
});
