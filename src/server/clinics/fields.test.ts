import { describe, expect, it } from "vitest";

import {
  CLOSE_TYPE_CHOICES,
  SMS_NOT_CONNECTED,
  clinicSlugSchema,
  clinicSmsLabel,
  createClinicSchema,
  parseVoice,
  parseWidgetOrigins,
  pendingVoiceAfterSave,
  voiceBlockedTermError,
} from "./fields";
import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";

describe("CLOSE_TYPE_CHOICES", () => {
  it("spells out the consequence of each choice, not just a label", () => {
    const byValue = Object.fromEntries(
      CLOSE_TYPE_CHOICES.map((c) => [c.value, c]),
    );

    expect(byValue.link_only.title.toLowerCase()).not.toBe("link_only");
    expect(byValue.manual.title.toLowerCase()).not.toBe("manual");

    expect(byValue.link_only.consequence.toLowerCase()).toContain(
      "must never be told someone will get back to them",
    );
    expect(byValue.manual.consequence.toLowerCase()).toContain(
      "must never tell them the booking is confirmed",
    );
  });

  it("covers both stored values and nothing else", () => {
    expect(CLOSE_TYPE_CHOICES.map((c) => c.value).sort()).toEqual(
      ["link_only", "manual"].sort(),
    );
  });
});

describe("clinicSmsLabel", () => {
  it("states the disconnected facts instead of leaving a blank", () => {
    const { connected, label } = clinicSmsLabel(null);
    expect(connected).toBe(false);
    expect(label).toBe(SMS_NOT_CONNECTED);
    expect(label.toLowerCase()).toContain("not connected");
    expect(label.toLowerCase()).toContain("no dedicated number");
    expect(label.toLowerCase()).toContain("cannot send or receive");
  });

  it("shows the national number when one is connected", () => {
    const { connected, label } = clinicSmsLabel("+61405111222");
    expect(connected).toBe(true);
    expect(label).toContain("0405 111 222");
  });
});

describe("clinicSlugSchema", () => {
  it("accepts a kebab-case clinic slug", () => {
    expect(clinicSlugSchema.parse("beauty-soiree")).toBe("beauty-soiree");
  });

  it("rejects the create-page path and other reserved words", () => {
    expect(clinicSlugSchema.safeParse("new").success).toBe(false);
    expect(clinicSlugSchema.safeParse("queue").success).toBe(false);
  });

  it("rejects uppercase, spaces and underscores", () => {
    expect(clinicSlugSchema.safeParse("Beauty Soiree").success).toBe(false);
    expect(clinicSlugSchema.safeParse("beauty_soiree").success).toBe(false);
  });
});

describe("parseWidgetOrigins", () => {
  it("keeps one origin per line, lowercased, without a trailing slash", () => {
    expect(
      parseWidgetOrigins(
        "https://offers.thebeautysoiree.com.au/\nhttp://offers.thebeautysoiree.com.au",
      ),
    ).toEqual([
      "https://offers.thebeautysoiree.com.au",
      "http://offers.thebeautysoiree.com.au",
    ]);
  });

  it("rejects a path, a query, or a missing scheme", () => {
    expect(parseWidgetOrigins("https://offers.example.com.au/hifu")).toEqual({
      error: expect.stringContaining("origin only"),
    });
    expect(parseWidgetOrigins("offers.example.com.au")).toEqual({
      error: expect.stringContaining("not a URL"),
    });
  });
});

describe("createClinicSchema", () => {
  const base = {
    slug: "new-clinic",
    name: "New Clinic",
    location: "Brisbane",
    hours: "",
    phone: "",
    paymentNotes: "",
    bookingPlatform: "timely",
    closeType: "manual",
    smsNumber: "",
    confidenceThreshold: 90,
    killSwitch: false,
    notifyEmail: true,
    notifySms: false,
    unattendedMinutes: 15,
    widgetOrigins: [],
    widgetTheme: null,
  };

  it("requires a close type rather than defaulting one", () => {
    expect(
      createClinicSchema.safeParse({ ...base, closeType: undefined }).success,
    ).toBe(false);
  });

  it("normalises an Australian SMS number and blanks the empty fields", () => {
    const parsed = createClinicSchema.parse({
      ...base,
      smsNumber: "0405 111 222",
    });
    expect(parsed.smsNumber).toBe("+61405111222");
    expect(parsed.hours).toBeNull();
    expect(parsed.phone).toBeNull();
  });
});

describe("parseVoice", () => {
  it("treats a blank field as the default tone", () => {
    expect(parseVoice("")).toEqual({ voice: null });
    expect(parseVoice("   ")).toEqual({ voice: null });
  });

  it("keeps a trimmed voice string", () => {
    expect(parseVoice("  Warmer greetings.  ")).toEqual({
      voice: "Warmer greetings.",
    });
  });
});

describe("pendingVoiceAfterSave", () => {
  it("clears pending when the submitted text matches what is already live", () => {
    expect(pendingVoiceAfterSave("Warmer greetings.", "Warmer greetings.")).toBe(
      null,
    );
    expect(pendingVoiceAfterSave(null, null)).toBe(null);
  });

  it("stores an empty pending string when reverting to the default tone", () => {
    expect(pendingVoiceAfterSave(null, "Warmer greetings.")).toBe("");
  });
});

describe("voiceBlockedTermError", () => {
  it("refuses a Schedule 4 term in the voice field", () => {
    const error = voiceBlockedTermError(
      "Sound confident. Mention Botox if they ask.",
      S4_BASELINE_TERMS,
    );
    expect(error).toMatch(/voice field contains blocked terms/i);
    expect(error).toMatch(/botox/i);
  });

  it("lets a tone-only voice through", () => {
    expect(
      voiceBlockedTermError("Warmer greetings. Keep it short.", S4_BASELINE_TERMS),
    ).toBeNull();
  });
});
