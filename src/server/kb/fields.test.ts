import { describe, expect, it } from "vitest";

import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";
import {
  ANSWER_MODE_CHOICES,
  DO_NOT_ANSWER_GAP,
  OPERATOR_SAVE_STATUS,
  createKbFieldsFromForm,
  entryKeySchema,
  hasDoNotAnswerCoverage,
  kbBlockedTermError,
  kbFieldsFromForm,
  kbTextForBlockedCheck,
  operatorSaveMeta,
  parseTriggerTerms,
  reviewMeta,
} from "./fields";

describe("ANSWER_MODE_CHOICES", () => {
  it("spells out the consequence of each choice, not just a label", () => {
    const byValue = Object.fromEntries(
      ANSWER_MODE_CHOICES.map((c) => [c.value, c]),
    );

    expect(byValue.answerable.title.toLowerCase()).not.toBe("answerable");
    expect(byValue.blocked.title.toLowerCase()).not.toBe("blocked");
    expect(byValue.missing.title.toLowerCase()).not.toBe("missing");

    const answerable = `${byValue.answerable.title} ${byValue.answerable.consequence}`.toLowerCase();
    const blocked = `${byValue.blocked.title} ${byValue.blocked.consequence}`.toLowerCase();
    const missing = `${byValue.missing.title} ${byValue.missing.consequence}`.toLowerCase();

    expect(answerable).toContain("cited and sent");
    expect(blocked).toContain("never attempt");
    expect(blocked).toContain("always queue");
    expect(blocked).toContain("deflect");
    expect(missing).toContain("unanswerable");
    expect(missing).toContain("stored");
  });

  it("covers the three stored values and nothing else", () => {
    expect(ANSWER_MODE_CHOICES.map((c) => c.value).sort()).toEqual(
      ["answerable", "blocked", "missing"].sort(),
    );
  });
});

describe("operatorSaveMeta", () => {
  it("lands an operator write as pending_review, never active", () => {
    const meta = operatorSaveMeta();
    expect(meta.status).toBe(OPERATOR_SAVE_STATUS);
    expect(meta.status).toBe("pending_review");
    expect(meta.status).not.toBe("active");
    expect(meta.source).toBe("operator_edit");
    expect(meta.reviewedBy).toBeNull();
    expect(meta.reviewedAt).toBeNull();
  });
});

describe("reviewMeta", () => {
  it("records who reviewed and when, as a separate action from save", () => {
    const at = new Date("2026-08-28T01:00:00.000Z");
    const meta = reviewMeta("operator@localhost", at);
    expect(meta.status).toBe("active");
    expect(meta.reviewedBy).toBe("operator@localhost");
    expect(meta.reviewedAt).toBe(at);
  });
});

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

const answerable = {
  title: "HIFU duration",
  body: "The appointment is about 60 minutes.",
  category: "offer",
  answerMode: "answerable",
  blockDeflect: "",
  triggerTerms: "",
  entryKey: "beauty-soiree.hifu-499.duration",
};

describe("kbFieldsFromForm", () => {
  it("requires a deflect and trigger terms when the mode is blocked", () => {
    const missingDeflect = kbFieldsFromForm(
      form({
        ...answerable,
        answerMode: "blocked",
        blockDeflect: "",
        triggerTerms: "hours\nopening",
      }),
    );
    expect(missingDeflect.error?.toLowerCase()).toContain("deflect");

    const missingTriggers = kbFieldsFromForm(
      form({
        ...answerable,
        answerMode: "blocked",
        blockDeflect: "All the times are in the booking link.",
        triggerTerms: "",
      }),
    );
    expect(missingTriggers.error?.toLowerCase()).toContain("trigger");

    const ok = kbFieldsFromForm(
      form({
        ...answerable,
        answerMode: "blocked",
        blockDeflect: "All the times are in the booking link.",
        triggerTerms: "opening hours\nare you open",
      }),
    );
    expect(ok.fields?.blockDeflect).toContain("booking link");
    expect(ok.fields?.triggerTerms).toEqual(["opening hours", "are you open"]);
  });

  it("clears deflect and trigger terms on an answerable entry", () => {
    const parsed = kbFieldsFromForm(
      form({
        ...answerable,
        blockDeflect: "should not stick",
        triggerTerms: "should-not-stick",
      }),
    );
    expect(parsed.fields?.blockDeflect).toBeNull();
    expect(parsed.fields?.triggerTerms).toEqual([]);
  });
});

describe("createKbFieldsFromForm", () => {
  it("reads the entry key on create", () => {
    const parsed = createKbFieldsFromForm(form(answerable));
    expect(parsed.fields?.entryKey).toBe("beauty-soiree.hifu-499.duration");
  });
});

describe("entryKeySchema", () => {
  it("accepts the existing citation shape", () => {
    expect(entryKeySchema.parse("beauty-soiree.hifu-499.duration")).toBe(
      "beauty-soiree.hifu-499.duration",
    );
  });

  it("rejects spaces and uppercase", () => {
    expect(entryKeySchema.safeParse("Beauty Soiree").success).toBe(false);
    expect(entryKeySchema.safeParse("hifu_duration").success).toBe(false);
  });
});

describe("kbBlockedTermError", () => {
  it("refuses a body that names a Schedule 4 brand", () => {
    const error = kbBlockedTermError(
      kbTextForBlockedCheck({
        title: "Offer",
        body: "Ask us about Botox this month.",
        blockDeflect: null,
      }),
      S4_BASELINE_TERMS,
    );
    expect(error?.toLowerCase()).toContain("botox");
    expect(error?.toLowerCase()).toContain("blocked");
  });

  it("allows ordinary offer copy", () => {
    expect(
      kbBlockedTermError(
        kbTextForBlockedCheck({
          title: "HIFU price",
          body: "HIFU Lower Face, Jaw and Neck Lift - $499",
          blockDeflect: null,
        }),
        S4_BASELINE_TERMS,
      ),
    ).toBeNull();
  });
});

describe("hasDoNotAnswerCoverage", () => {
  it("is false when every live entry is answerable", () => {
    expect(
      hasDoNotAnswerCoverage([
        { answerMode: "answerable", status: "active" },
        { answerMode: "blocked", status: "archived" },
      ]),
    ).toBe(false);
  });

  it("counts a pending blocked or missing entry as coverage being written", () => {
    expect(
      hasDoNotAnswerCoverage([
        { answerMode: "missing", status: "pending_review" },
      ]),
    ).toBe(true);
    expect(
      hasDoNotAnswerCoverage([{ answerMode: "blocked", status: "active" }]),
    ).toBe(true);
  });

  it("tells the operator to write the gap, not that we will", () => {
    expect(DO_NOT_ANSWER_GAP.toLowerCase()).toContain("nothing is being blocked");
    expect(DO_NOT_ANSWER_GAP.toLowerCase()).toContain("not generated");
  });
});

describe("parseTriggerTerms", () => {
  it("keeps one term per line and drops blanks and duplicates", () => {
    expect(parseTriggerTerms("hours\n\nHours\nopening hours")).toEqual([
      "hours",
      "opening hours",
    ]);
  });
});
