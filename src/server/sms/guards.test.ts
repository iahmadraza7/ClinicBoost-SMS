import { describe, expect, it } from "vitest";

import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";
import { checkSendable } from "./guards";

const base = {
  body: "Hey! The appointment is 60 minutes.",
  clinicSlug: "beauty-soiree",
  killSwitch: false,
  globalKillSwitch: false,
  contactOptedOut: false,
  blockedTerms: S4_BASELINE_TERMS.map((t) => ({
    term: t.term,
    reason: t.reason,
  })),
  maxSegments: 3,
};

const codes = (args: Parameters<typeof checkSendable>[0]) =>
  checkSendable(args).map((b) => b.code);

describe("checkSendable", () => {
  it("lets a clean reply through", () => {
    expect(checkSendable(base)).toEqual([]);
  });

  it("stops a Schedule 4 term an operator typed by hand", () => {
    expect(codes({ ...base, body: "We do botox from $199, want a time?" })).toContain(
      "BLOCKED_TERM",
    );
  });

  it("stops a category term as well as a brand name", () => {
    expect(
      codes({ ...base, body: "Our anti wrinkle injections start at $9" }),
    ).toContain("BLOCKED_TERM");
  });

  it("stops a send to a contact who opted out", () => {
    expect(codes({ ...base, contactOptedOut: true })).toContain(
      "CONTACT_OPTED_OUT",
    );
  });

  it("stops every send for a clinic whose kill switch is on", () => {
    expect(codes({ ...base, killSwitch: true })).toContain("KILL_SWITCH");
  });

  it("stops every send when the global kill switch is on", () => {
    expect(codes({ ...base, globalKillSwitch: true })).toContain("KILL_SWITCH");
  });

  it("stops a reply longer than the segment cap", () => {
    expect(codes({ ...base, body: "a".repeat(500) })).toContain(
      "SEGMENTS_EXCEEDED",
    );
  });

  it("reports every reason at once rather than the first", () => {
    const found = codes({
      ...base,
      body: `botox ${"a".repeat(500)}`,
      contactOptedOut: true,
      killSwitch: true,
    });

    expect(found).toContain("BLOCKED_TERM");
    expect(found).toContain("CONTACT_OPTED_OUT");
    expect(found).toContain("KILL_SWITCH");
    expect(found).toContain("SEGMENTS_EXCEEDED");
  });
});
