import { describe, expect, it } from "vitest";

import {
  CLOSE_TYPE_CHOICES,
  clinicSlugSchema,
  createClinicSchema,
  parseWidgetOrigins,
} from "./fields";

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
