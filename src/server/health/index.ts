import { readdirSync, statSync, statfsSync } from "node:fs";
import { join } from "node:path";

import { formatSydneyDateTime } from "@/lib/time";
import { env } from "../env";
import * as repo from "../repo";
import { getSmsAdapter, MobileMessageAdapter, SmsError } from "../sms";
import { anthropicFromHttp, anthropicKeyFailure } from "./anthropic";
import {
  domainsIsInconclusive,
  readResendProbeCache,
  resendFromSendHttp,
  resendKeyFailure,
  writeResendProbeCache,
} from "./resend";
import {
  backupCheck,
  diskCheck,
  domainFromFromAddress,
  lastSendCheck,
  workerCheck,
  type HealthCheck,
} from "./status";

const FETCH_MS = 8_000;

function checkDisk(): HealthCheck {
  try {
    const stats = statfsSync(process.cwd());
    const block = stats.bsize || (stats as { frsize?: number }).frsize || 0;
    const total = stats.blocks * block;
    const available = stats.bavail * block;
    if (total <= 0) {
      throw new Error("statfs returned no capacity");
    }
    return diskCheck(((total - available) / total) * 100);
  } catch {
    return {
      id: "disk",
      label: "Disk",
      tone: "fail",
      detail: "Could not read disk usage.",
    };
  }
}

const BACKUP_PATTERN = /^clinicboost-.*\.sql\.gz$/;

function backupDir(): string {
  return process.env.BACKUP_DIR ?? join(process.cwd(), "backups");
}

function checkBackup(): HealthCheck {
  const dir = backupDir();
  try {
    const names = readdirSync(dir).filter((name) => BACKUP_PATTERN.test(name));
    if (names.length === 0) {
      return {
        id: "backup",
        label: "Backup",
        tone: "fail",
        detail: "No database backup found in backups/. Install the nightly cron or run ./scripts/backup-db.sh.",
      };
    }

    let newest: { name: string; mtime: Date } | null = null;
    for (const name of names) {
      const mtime = statSync(join(dir, name)).mtime;
      if (!newest || mtime > newest.mtime) {
        newest = { name, mtime };
      }
    }

    if (!newest) {
      return {
        id: "backup",
        label: "Backup",
        tone: "fail",
        detail: "No database backup found in backups/.",
      };
    }

    return backupCheck({
      lastBackupAt: newest.mtime,
      fileName: newest.name,
      formattedAt: formatSydneyDateTime(newest.mtime),
    });
  } catch {
    return {
      id: "backup",
      label: "Backup",
      tone: "fail",
      detail: "Could not read the backups directory.",
    };
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await repo.system.pingDatabase();
    return {
      id: "database",
      label: "Database",
      tone: "ok",
      detail: "Database reachable.",
    };
  } catch {
    return {
      id: "database",
      label: "Database",
      tone: "fail",
      detail: "Database is not reachable.",
    };
  }
}

async function checkAnthropic(): Promise<HealthCheck> {
  const key = (env.ANTHROPIC_API_KEY ?? "").trim();
  const early = anthropicKeyFailure(key === "" ? undefined : key);
  if (early) return early;

  const model = env.ANTHROPIC_MODEL;

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "." }],
      }),
      signal: AbortSignal.timeout(FETCH_MS),
    });
  } catch {
    return {
      id: "anthropic",
      label: "Anthropic",
      tone: "fail",
      detail: "Could not reach Anthropic.",
    };
  }

  return anthropicFromHttp(response.status, model);
}

async function checkSms(): Promise<HealthCheck> {
  const apiUser = env.MOBILE_MESSAGE_API_USER;
  const apiPassword = env.MOBILE_MESSAGE_API_PASSWORD;

  if (!apiUser || !apiPassword) {
    if (env.SMS_PROVIDER === "mobile_message") {
      return {
        id: "sms",
        label: "Mobile Message",
        tone: "fail",
        detail: "SMS_PROVIDER is live but the API credentials are not set.",
      };
    }
    return {
      id: "sms",
      label: "Mobile Message",
      tone: "amber",
      detail: "Test mode. SMS is not going out.",
    };
  }

  try {
    const adapter =
      env.SMS_PROVIDER === "mobile_message"
        ? getSmsAdapter()
        : new MobileMessageAdapter({ apiUser, apiPassword });
    const credits = await adapter.balance();
    if (env.SMS_PROVIDER === "console") {
      return {
        id: "sms",
        label: "Mobile Message",
        tone: "amber",
        detail:
          credits === null
            ? "Test mode. SMS is not going out."
            : `Test mode. SMS is not going out. Account has ${credits} credits.`,
      };
    }

    if (credits === null) {
      return {
        id: "sms",
        label: "Mobile Message",
        tone: "amber",
        detail: "Credentials work. Credit balance was not returned.",
      };
    }

    if (credits <= 0) {
      return {
        id: "sms",
        label: "Mobile Message",
        tone: "fail",
        detail: "No Mobile Message credits remaining.",
      };
    }

    if (credits < 10) {
      return {
        id: "sms",
        label: "Mobile Message",
        tone: "amber",
        detail: `${credits} credits remaining.`,
      };
    }

    return {
      id: "sms",
      label: "Mobile Message",
      tone: "ok",
      detail: `${credits} credits remaining.`,
    };
  } catch (error) {
    const detail =
      error instanceof SmsError
        ? error.message
        : "Could not reach Mobile Message.";
    return {
      id: "sms",
      label: "Mobile Message",
      tone: "fail",
      detail,
    };
  }
}

async function checkResend(): Promise<HealthCheck> {
  const key = (env.RESEND_API_KEY ?? "").trim();
  const early = resendKeyFailure(key === "" ? undefined : key);
  if (early) return early;

  const domain = domainFromFromAddress(env.RESEND_FROM);
  if (!domain) {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: "RESEND_FROM is not an email address.",
    };
  }

  let domainsResponse: Response | null = null;
  try {
    domainsResponse = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(FETCH_MS),
    });
  } catch {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: "Could not reach Resend.",
    };
  }

  // Sending-access keys get 401 here. That is not a verdict; we send.
  if (domainsResponse.ok) {
    const body = (await domainsResponse.json()) as {
      data?: { name?: string; status?: string }[];
    };
    const match = (body.data ?? []).find(
      (row) => (row.name ?? "").toLowerCase() === domain,
    );
    if (match?.status === "verified") {
      return {
        id: "resend",
        label: "Resend",
        tone: "ok",
        detail: `${domain} is verified.`,
      };
    }
    if (match) {
      return {
        id: "resend",
        label: "Resend",
        tone: "amber",
        detail: `${domain} is not verified (${match.status ?? "unknown"}). Notification emails will not send until the domain is verified on Resend.`,
      };
    }
  } else if (!domainsIsInconclusive(domainsResponse.status)) {
    // Any domains result other than 401 is unused. Fall through to send.
  }

  const cached = readResendProbeCache();
  if (cached) return cached;

  const probed = await probeResendSend(key, domain);
  writeResendProbeCache(probed);
  return probed;
}

/**
 * Invalid `to` so Resend never queues a message. 422 on that field means the
 * key reached the send path. Cached so the dashboard does not probe on every
 * refresh.
 */
async function probeResendSend(
  key: string,
  domain: string,
): Promise<HealthCheck> {
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: ["health-check-invalid"],
        subject: "health-check",
        text: ".",
      }),
      signal: AbortSignal.timeout(FETCH_MS),
    });
  } catch {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: "Could not reach Resend.",
    };
  }

  const bodyText = await response.text().catch(() => "");
  return resendFromSendHttp(response.status, bodyText, domain);
}

async function checkWorker(): Promise<HealthCheck> {
  try {
    const [scheduled, lastCompletedAt] = await Promise.all([
      repo.system.sweepIsScheduled(),
      repo.system.lastSweepCompletedAt(),
    ]);
    return workerCheck({ scheduled, lastCompletedAt });
  } catch {
    return {
      id: "worker",
      label: "Worker",
      tone: "fail",
      detail: "Could not read worker status from the database.",
    };
  }
}

async function checkLastSend(): Promise<HealthCheck> {
  const clinics = await repo.clinics.listClinics();
  const sends = await Promise.all(
    clinics.map(async (clinic) => {
      const message = await repo.messages.getLastSuccessfulSend(clinic.id);
      return message ? { clinic, at: message.createdAt } : null;
    }),
  );

  const latest = sends.reduce<{
    clinicName: string;
    at: Date;
  } | null>((best, row) => {
    if (!row) return best;
    if (!best || row.at > best.at) {
      return { clinicName: row.clinic.name, at: row.at };
    }
    return best;
  }, null);

  return lastSendCheck({
    at: latest?.at ?? null,
    clinicName: latest?.clinicName ?? null,
    formattedAt: latest ? formatSydneyDateTime(latest.at) : null,
  });
}

const ORDER = [
  "disk",
  "database",
  "backup",
  "anthropic",
  "sms",
  "resend",
  "worker",
  "lastSend",
] as const;

export async function gatherHealth(): Promise<HealthCheck[]> {
  const checks = await Promise.all([
    checkDisk(),
    checkDatabase(),
    Promise.resolve(checkBackup()),
    checkAnthropic(),
    checkSms(),
    checkResend(),
    checkWorker(),
    checkLastSend(),
  ]);

  return ORDER.map((id) => checks.find((c) => c.id === id)!);
}
