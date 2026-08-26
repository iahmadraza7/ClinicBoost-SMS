import { describe, expect, it } from "vitest";

import { countSegments, segmentCount } from "./segments";

describe("GSM-7 messages", () => {
  it("counts a short message as one segment", () => {
    const info = countSegments("Hey Sarah, the HIFU is $499.");
    expect(info.encoding).toBe("gsm7");
    expect(info.segments).toBe(1);
  });

  it("fits exactly 160 characters in one segment", () => {
    expect(segmentCount("a".repeat(160))).toBe(1);
  });

  it("drops to 153 per segment once it spills over", () => {
    expect(segmentCount("a".repeat(161))).toBe(2);
    expect(segmentCount("a".repeat(306))).toBe(2);
    expect(segmentCount("a".repeat(307))).toBe(3);
  });

  it("charges two septets for an extended character", () => {
    expect(countSegments("[").units).toBe(2);
    expect(countSegments("€").units).toBe(2);
  });

  it("reports how much room is left", () => {
    expect(countSegments("a".repeat(100)).remaining).toBe(60);
  });
});

describe("characters that force UCS-2", () => {
  it("halves capacity when an emoji appears", () => {
    const info = countSegments(`${"a".repeat(100)}😀`);
    expect(info.encoding).toBe("ucs2");
    expect(info.segments).toBeGreaterThan(1);
  });

  it("names the offending characters so the operator can remove them", () => {
    const info = countSegments("Results peak at 8 weeks — no downtime");
    expect(info.encoding).toBe("ucs2");
    expect(info.offendingChars).toContain("—");
  });

  it("catches smart quotes and the ellipsis character", () => {
    expect(countSegments("it\u2019s great").encoding).toBe("ucs2");
    expect(countSegments("hold on\u2026").encoding).toBe("ucs2");
  });

  it("counts an emoji outside the BMP as two code units", () => {
    expect(countSegments("😀").units).toBe(2);
  });

  it("leaves plain Australian text on GSM-7", () => {
    const info = countSegments(
      "No worries, all the times are in the link so you can pick what suits.",
    );
    expect(info.encoding).toBe("gsm7");
    expect(info.offendingChars).toEqual([]);
  });
});
