import { describe, expect, it } from "vitest";

import { formatAuMobile, normaliseAuMobile } from "./mobile";

describe("normalising Australian mobiles", () => {
  it("accepts the forms a customer actually types", () => {
    for (const input of [
      "0405 087 121",
      "0405087121",
      "0405-087-121",
      "(0405) 087 121",
      "+61405087121",
      "+61 405 087 121",
      "61405087121",
      "405087121",
    ]) {
      expect(normaliseAuMobile(input), input).toBe("+61405087121");
    }
  });

  it("rejects anything that is not an Australian mobile", () => {
    for (const input of [
      "12345",
      "0298765432", // Sydney landline
      "+6412345678", // too short
      "+1 415 555 0100",
      "not a number",
      "",
    ]) {
      expect(normaliseAuMobile(input), input).toBeNull();
    }
  });

  it("gives the same contact identity however the number was entered", () => {
    expect(normaliseAuMobile("0405 087 121")).toBe(
      normaliseAuMobile("+61405087121"),
    );
  });
});

describe("formatting for the operator", () => {
  it("shows the national form", () => {
    expect(formatAuMobile("+61405087121")).toBe("0405 087 121");
  });

  it("leaves anything unrecognised untouched", () => {
    expect(formatAuMobile("+1 415 555 0100")).toBe("+1 415 555 0100");
  });
});
