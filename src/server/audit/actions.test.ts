import { describe, expect, it } from "vitest";

import { auditDetail } from "./actions";

describe("auditDetail", () => {
  it("summarises a CSV import without listing rows", () => {
    expect(
      auditDetail("kb.csv_imported", { created: 2, updated: 1, skipped: 4 }),
    ).toBe("created 2, updated 1, skipped 4");
  });

  it("lists failure codes from a draft", () => {
    expect(
      auditDetail("draft.created", {
        passed: false,
        failures: ["PRICE_UNVERIFIED", "BELOW_THRESHOLD"],
      }),
    ).toBe("PRICE_UNVERIFIED, BELOW_THRESHOLD");
  });

  it("does not print a draft body", () => {
    expect(
      auditDetail("draft.approved", { state: "approved", body: "Hi Sarah" }),
    ).toBe("");
  });

  it("says passed when a revalidate cleared every code", () => {
    expect(auditDetail("draft.revalidated", { passed: true, failures: [] })).toBe(
      "passed",
    );
  });
});
