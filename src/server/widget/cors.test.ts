import { describe, expect, it } from "vitest";

import type { Clinic } from "../db/schema";
import { corsHeaders, isCrossOriginRejected, isOriginAllowed } from "./cors";

const clinic = {
  widgetOrigins: [
    "https://offers.thebeautysoiree.com.au",
    "http://offers.thebeautysoiree.com.au",
  ],
} as Clinic;

describe("isOriginAllowed", () => {
  it("allows a listed landing page and nothing else", () => {
    expect(
      isOriginAllowed(clinic, "https://offers.thebeautysoiree.com.au"),
    ).toBe(true);
    expect(isOriginAllowed(clinic, "https://evil.example")).toBe(false);
    expect(isOriginAllowed(clinic, null)).toBe(false);
  });

  it("allows the dashboard origin so the operator can try the widget", () => {
    expect(
      isOriginAllowed(clinic, "http://localhost:3000", [
        "http://localhost:3000",
      ]),
    ).toBe(true);
  });
});

describe("corsHeaders", () => {
  it("echoes the origin and names GET and POST", () => {
    const headers = corsHeaders(
      clinic,
      "https://offers.thebeautysoiree.com.au",
    );
    expect(headers["Access-Control-Allow-Origin"]).toBe(
      "https://offers.thebeautysoiree.com.au",
    );
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
  });
});

describe("isCrossOriginRejected", () => {
  it("lets a request with no Origin through, and refuses an unknown site", () => {
    expect(isCrossOriginRejected(clinic, null)).toBe(false);
    expect(isCrossOriginRejected(clinic, "https://evil.example")).toBe(true);
  });
});
