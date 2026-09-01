import { describe, expect, it } from "vitest";

import {
  backupCheck,
  domainFromFromAddress,
  formatBackupAge,
  lastSendCheck,
  workerCheck,
  WORKER_STALE_MS,
  diskCheck,
  DISK_AMBER_PERCENT,
  DISK_FAIL_PERCENT,
  BACKUP_AMBER_MS,
  BACKUP_FAIL_MS,
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

describe("diskCheck", () => {
  it("is ok below 75 percent", () => {
    const check = diskCheck(DISK_AMBER_PERCENT - 1);
    expect(check.tone).toBe("ok");
    expect(check.detail).toBe("Disk is 74 percent full.");
  });

  it("is amber at 75 percent", () => {
    const check = diskCheck(DISK_AMBER_PERCENT);
    expect(check.tone).toBe("amber");
    expect(check.detail).toMatch(/75 percent full/);
    expect(check.detail).toMatch(/docker builder prune -af/);
  });

  it("is still amber just under 85 percent", () => {
    expect(diskCheck(DISK_FAIL_PERCENT - 1).tone).toBe("amber");
  });

  it("is red at 85 percent and names the Postgres outage", () => {
    const check = diskCheck(DISK_FAIL_PERCENT);
    expect(check.tone).toBe("fail");
    expect(check.detail).toMatch(/85 percent full/);
    expect(check.detail).toMatch(/stops Postgres/i);
    expect(check.detail).toMatch(/total outage/i);
  });
});

describe("backupCheck", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("is ok when the newest dump is under 36 hours old", () => {
    const check = backupCheck({
      lastBackupAt: new Date(now.getTime() - BACKUP_AMBER_MS + 60_000),
      fileName: "clinicboost-2026-09-01.sql.gz",
      formattedAt: "1 Sep, 3:00 am",
      now,
    });
    expect(check.tone).toBe("ok");
    expect(check.detail).toMatch(/clinicboost-2026-09-01\.sql\.gz/);
  });

  it("is amber when the newest dump is over 36 hours old", () => {
    const check = backupCheck({
      lastBackupAt: new Date(now.getTime() - BACKUP_AMBER_MS - 1),
      fileName: "clinicboost-2026-08-30.sql.gz",
      formattedAt: "30 Aug, 3:00 am",
      now,
    });
    expect(check.tone).toBe("amber");
    expect(check.detail).toMatch(/Expected a nightly backup/i);
  });

  it("is red when the newest dump is over 72 hours old", () => {
    const check = backupCheck({
      lastBackupAt: new Date(now.getTime() - BACKUP_FAIL_MS - 1),
      fileName: "clinicboost-2026-08-28.sql.gz",
      formattedAt: "28 Aug, 3:00 am",
      now,
    });
    expect(check.tone).toBe("fail");
    expect(check.detail).toMatch(/nightly backup may have stopped/i);
  });
});

describe("formatBackupAge", () => {
  it("uses minutes under one hour", () => {
    expect(formatBackupAge(5 * 60 * 1000)).toBe("5 minutes");
  });

  it("uses hours under two days", () => {
    expect(formatBackupAge(40 * 60 * 60 * 1000)).toBe("40 hours");
  });

  it("uses days after that", () => {
    expect(formatBackupAge(3 * 24 * 60 * 60 * 1000)).toBe("3 days");
  });
});
