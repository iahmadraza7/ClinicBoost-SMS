import { describe, expect, it } from "vitest";

import {
  bookingEntryKey,
  parseBookingCsv,
  parseBookingUrl,
  planBookingCsv,
  priceCentsFromDisplay,
} from "./csv";

const HIFU = {
  id: "offer-hifu",
  name: "HIFU Lower Face, Jaw & Neck Lift",
  bookingUrl: "http://offers.thebeautysoiree.com.au/hifu-499",
  priceDisplay: "$499",
};

const HIFU_ENTRY = {
  id: "entry-hifu",
  entryKey: "beauty-soiree.hifu-499.booking-url",
  category: "booking",
  offerId: "offer-hifu",
  body: "http://offers.thebeautysoiree.com.au/hifu-499",
  status: "active",
};

describe("parseBookingUrl", () => {
  it("accepts an http booking link with a path", () => {
    expect(parseBookingUrl("http://offers.thebeautysoiree.com.au/hifu-499")).toBe(
      "http://offers.thebeautysoiree.com.au/hifu-499",
    );
  });

  it("rejects a malformed URL at parse time", () => {
    const result = parseBookingUrl("offers.thebeautysoiree.com.au/hifu");
    expect(result).toEqual({ error: expect.stringContaining("not a URL") });
  });

  it("rejects a javascript URL", () => {
    const result = parseBookingUrl("javascript:alert(1)");
    expect(result).toEqual({
      error: expect.stringContaining("http:// or https://"),
    });
  });
});

describe("parseBookingCsv", () => {
  it("reads treatment name, booking URL and price display", () => {
    const parsed = parseBookingCsv(
      "treatment name,booking url,price display\nHIFU Lower Face,http://offers.example.com.au/hifu,$499\n",
    );
    expect(parsed).toEqual({
      rows: [
        {
          line: 2,
          name: "HIFU Lower Face",
          bookingUrl: "http://offers.example.com.au/hifu",
          priceDisplay: "$499",
        },
      ],
    });
  });

  it("rejects a malformed URL before any preview is built", () => {
    const parsed = parseBookingCsv(
      "name,url,price\nHIFU,not-a-url,$499\nPMU,http://offers.example.com.au/pmu,$399\n",
    );
    expect("error" in parsed && parsed.error).toContain("Line 2");
    expect("error" in parsed && parsed.error).toContain("not a URL");
  });

  it("rejects a duplicate treatment name in the same file", () => {
    const parsed = parseBookingCsv(
      "name,url,price\nHIFU,http://offers.example.com.au/a,$499\nHIFU,http://offers.example.com.au/b,$499\n",
    );
    expect("error" in parsed && parsed.error).toContain("more than once");
  });

  it("accepts quoted names that contain a comma", () => {
    const parsed = parseBookingCsv(
      'name,url,price\n"HIFU Lower Face, Jaw & Neck Lift",http://offers.example.com.au/hifu,$499\n',
    );
    expect("rows" in parsed && parsed.rows[0]?.name).toBe(
      "HIFU Lower Face, Jaw & Neck Lift",
    );
  });
});

describe("planBookingCsv", () => {
  it("skips a row that already matches the live offer and booking entry", () => {
    const plan = planBookingCsv(
      "beauty-soiree",
      [
        {
          line: 2,
          name: HIFU.name,
          bookingUrl: HIFU.bookingUrl,
          priceDisplay: HIFU.priceDisplay,
        },
      ],
      [HIFU],
      [HIFU_ENTRY],
    );
    if ("error" in plan) throw new Error(plan.error);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.created).toHaveLength(0);
    expect(plan.updated).toHaveLength(0);
  });

  it("updates the existing booking entry, keeping its key, when the URL changes", () => {
    const plan = planBookingCsv(
      "beauty-soiree",
      [
        {
          line: 2,
          name: HIFU.name,
          bookingUrl: "http://offers.thebeautysoiree.com.au/hifu-new",
          priceDisplay: "$599",
        },
      ],
      [HIFU],
      [HIFU_ENTRY],
    );
    if ("error" in plan) throw new Error(plan.error);
    expect(plan.updated).toHaveLength(1);
    expect(plan.updated[0]?.entryId).toBe("entry-hifu");
    expect(plan.updated[0]?.entryKey).toBe(
      "beauty-soiree.hifu-499.booking-url",
    );
  });

  it("creates a new offer and entry when the treatment is unknown", () => {
    const plan = planBookingCsv(
      "beauty-soiree",
      [
        {
          line: 2,
          name: "New Laser",
          bookingUrl: "http://offers.thebeautysoiree.com.au/laser",
          priceDisplay: "$199",
        },
      ],
      [HIFU],
      [HIFU_ENTRY],
    );
    if ("error" in plan) throw new Error(plan.error);
    expect(plan.created).toHaveLength(1);
    expect(plan.created[0]?.entryKey).toBe(
      bookingEntryKey("beauty-soiree", "New Laser"),
    );
    expect(plan.created[0]?.offerId).toBeNull();
  });

  it("matches an existing offer by name even when the generated key differs", () => {
    expect(bookingEntryKey("beauty-soiree", HIFU.name)).not.toBe(
      "beauty-soiree.hifu-499.booking-url",
    );
  });
});

describe("priceCentsFromDisplay", () => {
  it("reads a dollar amount into cents", () => {
    expect(priceCentsFromDisplay("$499")).toBe(49900);
    expect(priceCentsFromDisplay("$99.75")).toBe(9975);
  });
});
