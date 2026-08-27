import { describe, expect, it } from "vitest";

import {
  domainFromFromAddress,
  lastSendCheck,
  workerCheck,
  WORKER_STALE_MS,
} from "./status";

describe("workerCheck", () => {
  const now = new Date("2026-08-28T02:00:00.000Z");

  it("fails when the worker has never registered", () => {
    const check = workerCheck({
      scheduled: false,
      lastCompletedAt: null,
      now,
    });
    expect(check.tone).toBe("fail");
    expect(check.detail).toMatch(/never started/i);
  });

  it("fails when the sweep has not run", () => {
    const check = workerCheck({
      scheduled: true,
      lastCompletedAt: null,
      now,
    });
    expect(check.tone).toBe("fail");
    expect(check.detail).toMatch(/has not run/i);
  });

  it("fails when the last sweep is older than three minutes", () => {
    const check = workerCheck({
      scheduled: true,
      lastCompletedAt: new Date(now.getTime() - WORKER_STALE_MS - 1),
      now,
    });
    expect(check.tone).toBe("fail");
    expect(check.detail).toMatch(/probably down/i);
  });

  it("is ok when the sweep ran recently", () => {
    const check = workerCheck({
      scheduled: true,
      lastCompletedAt: new Date(now.getTime() - 30_000),
      now,
    });
    expect(check.tone).toBe("ok");
    expect(check.detail).toBe("Worker is running.");
  });
});

describe("lastSendCheck", () => {
  it("is amber when nothing has been sent", () => {
    const check = lastSendCheck({
      at: null,
      clinicName: null,
      formattedAt: null,
    });
    expect(check.tone).toBe("amber");
    expect(check.detail).toBe("No SMS has been sent yet.");
  });

  it("names the clinic and the time", () => {
    const check = lastSendCheck({
      at: new Date("2026-08-28T04:14:00.000Z"),
      clinicName: "Beauty Soiree",
      formattedAt: "28 Aug, 2:14 pm",
    });
    expect(check.tone).toBe("ok");
    expect(check.detail).toBe("28 Aug, 2:14 pm (Beauty Soiree)");
  });
});

describe("domainFromFromAddress", () => {
  it("reads the domain from RESEND_FROM", () => {
    expect(domainFromFromAddress("notify@notify.clinicboost.com.au")).toBe(
      "notify.clinicboost.com.au",
    );
  });

  it("rejects a value with no @", () => {
    expect(domainFromFromAddress("notify.clinicboost.com.au")).toBeNull();
  });
});
