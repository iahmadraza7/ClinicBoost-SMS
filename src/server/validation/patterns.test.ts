import { describe, expect, it } from "vitest";

import { CURRENCY, findAll, INTERVAL, trimUrl, URL } from "./patterns";

describe("CURRENCY", () => {
  it("finds plain and decimal amounts", () => {
    expect(findAll("It is $499 or 4 payments of $99.75", CURRENCY)).toEqual([
      "$499",
      "$99.75",
    ]);
  });

  it("keeps a thousands separator", () => {
    expect(findAll("was $1,200 now $999", CURRENCY)).toEqual(["$1,200", "$999"]);
  });

  /**
   * The amount is string-matched against the knowledge base, so a stray comma
   * turns a correct price into PRICE_UNVERIFIED. Seen in a live draft.
   */
  it("does not swallow the comma that ends a clause", () => {
    expect(findAll("$399, it's 50% off for new clients.", CURRENCY)).toEqual([
      "$399",
    ]);
  });

  it("does not swallow a full stop that ends a sentence", () => {
    expect(findAll("The price is $499.", CURRENCY)).toEqual(["$499"]);
  });

  it("tolerates a space after the sign", () => {
    expect(findAll("$ 499", CURRENCY)).toEqual(["$ 499"]);
  });
});

describe("INTERVAL", () => {
  it("finds durations however they are written", () => {
    expect(
      findAll("8 weeks, a 60-minute session, 12+ months, 7-10 days", INTERVAL),
    ).toEqual(["8 weeks", "60-minute", "12+ months", "10 days"]);
  });
});

describe("URL", () => {
  it("does not treat a trailing full stop as part of the link", () => {
    const [found] = findAll(
      "Book here: http://offers.thebeautysoiree.com.au/hifu-499.",
      URL,
    );
    expect(trimUrl(found)).toBe(
      "http://offers.thebeautysoiree.com.au/hifu-499",
    );
  });
});
