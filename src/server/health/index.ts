import { formatSydneyDateTime } from "@/lib/time";
import { env } from "../env";
import * as repo from "../repo";
import { getSmsAdapter, MobileMessageAdapter, SmsError } from "../sms";
import {
  domainFromFromAddress,
  lastSendCheck,
  workerCheck,
  type HealthCheck,
} from "./status";

const FETCH_MS = 8_000;

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
  const key = env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      id: "anthropic",
      label: "Anthropic",
      tone: "fail",
      detail: "ANTHROPIC_API_KEY is not set.",
    };
  }

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
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

  if (response.status === 401 || response.status === 403) {
    return {
      id: "anthropic",
      label: "Anthropic",
      tone: "fail",
      detail: "Anthropic rejected the key.",
    };
  }

  if (!response.ok) {
    return {
      id: "anthropic",
      label: "Anthropic",
      tone: "fail",
      detail: `Anthropic returned ${response.status}.`,
    };
  }

  const body = (await response.json()) as { data?: { id: string }[] };
  const ids = (body.data ?? []).map((m) => m.id);
  if (ids.length > 0 && !ids.includes(env.ANTHROPIC_MODEL)) {
    return {
      id: "anthropic",
      label: "Anthropic",
      tone: "amber",
      detail: `Key is valid, but ${env.ANTHROPIC_MODEL} is not on this account.`,
    };
  }

  return {
    id: "anthropic",
    label: "Anthropic",
    tone: "ok",
    detail: "Key is valid.",
  };
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
  const key = env.RESEND_API_KEY;
  if (!key) {
    return {
      id: "resend",
      label: "Resend",
      tone: "amber",
      detail: "RESEND_API_KEY is not set. Notification emails stay on this machine.",
    };
  }

  const domain = domainFromFromAddress(env.RESEND_FROM);
  if (!domain) {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: "RESEND_FROM is not an email address.",
    };
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/domains", {
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

  if (response.status === 401 || response.status === 403) {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: "Resend rejected the key.",
    };
  }

  if (!response.ok) {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: `Resend returned ${response.status}.`,
    };
  }

  const body = (await response.json()) as {
    data?: { name?: string; status?: string }[];
  };
  const match = (body.data ?? []).find(
    (row) => (row.name ?? "").toLowerCase() === domain,
  );

  if (!match) {
    return {
      id: "resend",
      label: "Resend",
      tone: "fail",
      detail: `${domain} is not on this Resend account.`,
    };
  }

  if (match.status === "verified") {
    return {
      id: "resend",
      label: "Resend",
      tone: "ok",
      detail: `${domain} is verified.`,
    };
  }

  return {
    id: "resend",
    label: "Resend",
    tone: "fail",
    detail: `${domain} is not verified (${match.status ?? "unknown"}).`,
  };
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
  "database",
  "anthropic",
  "sms",
  "resend",
  "worker",
  "lastSend",
] as const;

export async function gatherHealth(): Promise<HealthCheck[]> {
  const checks = await Promise.all([
    checkDatabase(),
    checkAnthropic(),
    checkSms(),
    checkResend(),
    checkWorker(),
    checkLastSend(),
  ]);

  return ORDER.map((id) => checks.find((c) => c.id === id)!);
}
