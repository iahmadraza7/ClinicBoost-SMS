import { describe, expect, it } from "vitest";

import { clinic, makeReplyContext, message, offers } from "./fixtures";
import { INSTRUCTIONS } from "./instructions";
import { buildClinicPrompt, buildMessages } from "./prompt";

describe("the whole knowledge base goes in", () => {
  it("includes every answerable entry with its citable id", () => {
    const ctx = makeReplyContext();
    const prompt = buildClinicPrompt(ctx);

    const answerable = ctx.kbEntries.filter(
      (e) => e.answerMode === "answerable",
    );
    expect(answerable.length).toBeGreaterThan(20);

    for (const entry of answerable) {
      expect(prompt, entry.entryKey).toContain(entry.entryKey);
      expect(prompt, entry.entryKey).toContain(entry.body);
    }
  });

  it("carries prices and booking links verbatim, so the validator can match them", () => {
    const prompt = buildClinicPrompt(makeReplyContext());

    expect(prompt).toContain("$499");
    expect(prompt).toContain("$999");
    expect(prompt).toContain("$399");
    expect(prompt).toContain("http://offers.thebeautysoiree.com.au/hifu-499");
    expect(prompt).toContain("http://offers.thebeautysoiree.com.au/pmu-399");
  });

  it("gives the offer ids the model has to copy into matched_offer_id", () => {
    const prompt = buildClinicPrompt(makeReplyContext());
    for (const offer of offers) {
      expect(prompt).toContain(offer.id);
    }
  });
});

describe("do-not-answer entries", () => {
  it("lists every blocked topic with the text to send instead", () => {
    const ctx = makeReplyContext();
    const prompt = buildClinicPrompt(ctx);

    const blocked = ctx.kbEntries.filter((e) => e.answerMode === "blocked");
    expect(blocked.length).toBeGreaterThan(0);

    for (const entry of blocked) {
      expect(prompt, entry.entryKey).toContain(entry.title);
      if (entry.blockDeflect) {
        expect(prompt, entry.entryKey).toContain(entry.blockDeflect);
      }
    }
  });

  it("keeps blocked bodies out of the answerable knowledge base section", () => {
    const ctx = makeReplyContext();
    const prompt = buildClinicPrompt(ctx);
    const kbSection = prompt.slice(prompt.indexOf("# CLINIC KNOWLEDGE BASE"));

    for (const entry of ctx.kbEntries.filter((e) => e.answerMode === "blocked")) {
      expect(kbSection, entry.entryKey).not.toContain(entry.entryKey);
    }
  });

  it("warns explicitly when a clinic has no do-not-answer list yet", () => {
    const ctx = makeReplyContext({
      kbEntries: makeReplyContext().kbEntries.map((e) => ({
        ...e,
        answerMode: "answerable" as const,
      })),
    });

    const prompt = buildClinicPrompt(ctx);
    expect(prompt).toContain("Nothing is listed for this clinic yet");
  });
});

describe("close_type behaviour", () => {
  it("tells a link-only clinic never to promise a confirmation", () => {
    const prompt = buildClinicPrompt(makeReplyContext());
    expect(prompt).toMatch(/never say anyone will confirm/i);
    expect(prompt).not.toMatch(/someone will come back to them/i);
  });

  it("tells a manual clinic never to say the booking is confirmed", () => {
    const ctx = makeReplyContext({
      clinic: { ...clinic, closeType: "manual" },
    });

    const prompt = buildClinicPrompt(ctx);
    expect(prompt).toMatch(/never tell the customer their booking is confirmed/i);
    expect(prompt).toMatch(/someone will come back to them/i);
  });
});

describe("blocked terms", () => {
  it("lists the Schedule 4 terms the model must never write", () => {
    const prompt = buildClinicPrompt(makeReplyContext());
    expect(prompt).toContain("# BLOCKED TERMS");
    expect(prompt).toContain("botox");
    expect(prompt).toContain("dermal filler");
    expect(prompt).toContain("anti wrinkle injection");
  });
});

describe("clinic config", () => {
  it("states that hours are unconfirmed when the clinic has none", () => {
    const prompt = buildClinicPrompt(makeReplyContext());
    expect(prompt).toMatch(/hours: NOT CONFIRMED/i);
  });

  it("includes the rolling summary when the thread has one", () => {
    const base = makeReplyContext();
    const ctx = makeReplyContext({
      conversation: { ...base.conversation, summary: "Asked about HIFU in June." },
    });

    expect(buildClinicPrompt(ctx)).toContain("Asked about HIFU in June.");
  });
});

describe("the static instructions", () => {
  it("carries the SMS formatting rules", () => {
    expect(INSTRUCTIONS).toMatch(/no emojis/i);
    expect(INSTRUCTIONS).toMatch(/no em dashes/i);
    expect(INSTRUCTIONS).toMatch(/no smart quotes/i);
    expect(INSTRUCTIONS).toMatch(/casual australian/i);
    expect(INSTRUCTIONS).toMatch(/one question per message/i);
    expect(INSTRUCTIONS).toMatch(/do not out-text them/i);
    expect(INSTRUCTIONS).toMatch(/no email-style signoffs/i);
  });

  it("names the four things that may never be invented", () => {
    expect(INSTRUCTIONS).toMatch(/a price, a discount/i);
    expect(INSTRUCTIONS).toMatch(/time between treatments/i);
    expect(INSTRUCTIONS).toMatch(/contraindication/i);
    expect(INSTRUCTIONS).toMatch(/booking link/i);
  });

  it("states the Schedule 4 constraint", () => {
    expect(INSTRUCTIONS).toMatch(/schedule 4/i);
    expect(INSTRUCTIONS).toMatch(/prescription medicines/i);
  });

  it("describes the JSON contract and forbids markdown fences", () => {
    expect(INSTRUCTIONS).toContain('"self_confidence"');
    expect(INSTRUCTIONS).toContain('"matched_offer_id"');
    expect(INSTRUCTIONS).toContain('"unanswered"');
    expect(INSTRUCTIONS).toMatch(/no markdown code fences/i);
  });

  it("tells the model its confidence score does not decide anything", () => {
    expect(INSTRUCTIONS).toMatch(/does not decide anything on its own/i);
  });
});

describe("conversation turns", () => {
  it("maps inbound to the customer and outbound to the clinic", () => {
    const ctx = makeReplyContext({
      history: [
        message("inbound", "how much is the hifu", 0),
        message("outbound", "It is $499.", 1),
        message("inbound", "and how long does it take", 2),
      ],
    });

    expect(buildMessages(ctx)).toEqual([
      { role: "user", content: "how much is the hifu" },
      { role: "assistant", content: "It is $499." },
      { role: "user", content: "and how long does it take" },
    ]);
  });

  it("merges consecutive messages from the same side into one turn", () => {
    const ctx = makeReplyContext({
      history: [
        message("inbound", "hi", 0),
        message("inbound", "is the $499 still on", 1),
      ],
    });

    expect(buildMessages(ctx)).toEqual([
      { role: "user", content: "hi\nis the $499 still on" },
    ]);
  });

  it("starts and ends on a customer turn, which the API requires", () => {
    const ctx = makeReplyContext({
      history: [message("outbound", "Just checking in.", 0)],
    });

    const turns = buildMessages(ctx);
    expect(turns[0].role).toBe("user");
    expect(turns[turns.length - 1].role).toBe("user");
  });
});

