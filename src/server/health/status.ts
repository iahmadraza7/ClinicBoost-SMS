export type HealthTone = "ok" | "amber" | "fail";

export type HealthCheck = {
  id: string;
  label: string;
  tone: HealthTone;
  detail: string;
};

export const WORKER_STALE_MS = 3 * 60 * 1000;

export function workerCheck(input: {
  scheduled: boolean;
  lastCompletedAt: Date | null;
  now?: Date;
}): HealthCheck {
  const now = input.now ?? new Date();
  if (!input.scheduled) {
    return {
      id: "worker",
      label: "Worker",
      tone: "fail",
      detail: "Worker has never started. Drafts will sit unprocessed.",
    };
  }

  if (!input.lastCompletedAt) {
    return {
      id: "worker",
      label: "Worker",
      tone: "fail",
      detail: "Worker is registered but the every-minute sweep has not run.",
    };
  }

  const age = now.getTime() - input.lastCompletedAt.getTime();
  if (age > WORKER_STALE_MS) {
    return {
      id: "worker",
      label: "Worker",
      tone: "fail",
      detail: "Worker last ran a sweep more than 3 minutes ago. It is probably down.",
    };
  }

  return {
    id: "worker",
    label: "Worker",
    tone: "ok",
    detail: "Worker is running.",
  };
}

export function lastSendCheck(input: {
  at: Date | null;
  clinicName: string | null;
  formattedAt: string | null;
}): HealthCheck {
  if (!input.at || !input.clinicName || !input.formattedAt) {
    return {
      id: "lastSend",
      label: "Last send",
      tone: "amber",
      detail: "No SMS has been sent yet.",
    };
  }

  return {
    id: "lastSend",
    label: "Last send",
    tone: "ok",
    detail: `${input.formattedAt} (${input.clinicName})`,
  };
}

export function domainFromFromAddress(from: string): string | null {
  const at = from.lastIndexOf("@");
  if (at < 0) return null;
  const domain = from.slice(at + 1).trim().toLowerCase();
  return domain.length > 0 ? domain : null;
}

/**
 * The droplet is 8.7GB. Build cache, not leftover images, is what fills it.
 * Amber at 75, red at 85: a full disk stops Postgres and looks like a total
 * outage rather than a disk problem.
 */
export const DISK_AMBER_PERCENT = 75;
export const DISK_FAIL_PERCENT = 85;

export function diskCheck(percentUsed: number): HealthCheck {
  const pct = Math.round(percentUsed);

  if (pct >= DISK_FAIL_PERCENT) {
    return {
      id: "disk",
      label: "Disk",
      tone: "fail",
      detail: `Disk is ${pct} percent full. A full disk stops Postgres and looks like a total outage. After a successful deploy run docker builder prune -af. The next build will be slower.`,
    };
  }

  if (pct >= DISK_AMBER_PERCENT) {
    return {
      id: "disk",
      label: "Disk",
      tone: "amber",
      detail: `Disk is ${pct} percent full. After a successful deploy run docker builder prune -af. The next build will be slower.`,
    };
  }

  return {
    id: "disk",
    label: "Disk",
    tone: "ok",
    detail: `Disk is ${pct} percent full.`,
  };
}
