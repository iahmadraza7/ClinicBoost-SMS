import { describe, expect, it } from "vitest";

import type { KbEntry } from "../db/schema";
import {
  exportKbCsv,
  exportKbJson,
  parseKbCsv,
  parseKbJson,
  planKbImport,
  toTransferRow,
} from "./transfer";

function entry(overrides: Partial<KbEntry> = {}): KbEntry {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    clinicId: "22222222-2222-4222-8222-222222222222",
    entryKey: "beauty-soiree.hifu.duration",
    category: "faq",
    offerId: null,
    title: "HIFU duration",
    body: "About 60 minutes.",
    status: "active",
    answerMode: "answerable",
    blockDeflect: null,
    triggerTerms: ["duration", "how long"],
    source: "imported",
    sourceDraftId: null,
    createdBy: "operator@localhost",
    reviewedBy: "operator@localhost",
    reviewedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("knowledge base transfer", () => {
  it("round-trips JSON with no change", () => {
    const rows = [entry(), entry({ entryKey: "beauty-soiree.hours", title: "Hours", body: "Tue to Sat." })];
    const parsed = parseKbJson(exportKbJson(rows));
    if ("error" in parsed) throw new Error(parsed.error);
    const plan = planKbImport(parsed.rows, rows, new Set(), []);
    expect(plan.created).toHaveLength(0);
    expect(plan.updated).toHaveLength(0);
    expect(plan.skipped).toHaveLength(2);
    expect(plan.skipped.every((r) => r.reason === "unchanged")).toBe(true);
  });

  it("round-trips CSV with no change", () => {
    const rows = [entry()];
    const parsed = parseKbCsv(exportKbCsv(rows));
    if ("error" in parsed) throw new Error(parsed.error);
    const plan = planKbImport(parsed.rows, rows, new Set(), []);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].reason).toBe("unchanged");
    expect(toTransferRow(rows[0]).trigger_terms).toEqual(
      parsed.rows[0].trigger_terms,
    );
  });

  it("names a reason for each skipped row", () => {
    const existing = [entry()];
    const incoming = [
      toTransferRow(existing[0]),
      {
        ...toTransferRow(existing[0]),
        entry_key: "beauty-soiree.dup",
        title: "Botox special",
        body: "Ask about anti wrinkle.",
      },
    ];
    const plan = planKbImport(incoming, existing, new Set(), [
      { term: "anti wrinkle", reason: "Schedule 4 category term" },
    ]);
    expect(plan.skipped[0].reason).toBe("unchanged");
    expect(plan.skipped[1].reason).toMatch(/blocked term/);
  });

  it("plans a create and an update", () => {
    const existing = [entry()];
    const incoming = [
      { ...toTransferRow(existing[0]), body: "About 45 minutes." },
      {
        ...toTransferRow(existing[0]),
        entry_key: "beauty-soiree.new.fact",
        title: "New fact",
        body: "We open Tuesdays.",
      },
    ];
    const plan = planKbImport(incoming, existing, new Set(), []);
    expect(plan.updated).toHaveLength(1);
    expect(plan.created).toHaveLength(1);
  });
});
