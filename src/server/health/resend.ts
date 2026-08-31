import type { HealthCheck } from "./status";

const FAIL = {
  id: "resend" as const,
  label: "Resend",
  tone: "fail" as const,
};

const OK = {
  id: "resend" as const,
  label: "Resend",
  tone: "ok" as const,
};

const AMBER = {
  id: "resend" as const,
  label: "Resend",
  tone: "amber" as const,
};

/** Sending-access keys cannot list domains. A 401 there is not a verdict. */
export function domainsIsInconclusive(status: number): boolean {
  return status === 401;
}

/**
 * No key, or a value that cannot be a live Resend key. Placeholders such as
 * REPLACE fail here instead of being sent to the API.
 */
export function resendKeyFailure(key: string | undefined): HealthCheck | null {
  if (!key || key.trim() === "") {
    return { ...FAIL, detail: "RESEND_API_KEY is missing." };
  }
  if (!key.trim().startsWith("re_")) {
    return { ...FAIL, detail: "RESEND_API_KEY is missing." };
  }
  return null;
}

function bodyLooksLikeUnverifiedDomain(bodyText: string): boolean {
  const text = bodyText.toLowerCase();
  return (
    text.includes("not verified") ||
    text.includes("unverified") ||
    (text.includes("domain") &&
      (text.includes("verify") || text.includes("verified")))
  );
}

/**
 * Maps the send-path probe. We never queue a real email: the `to` address is
 * invalid on purpose. 422 on that field means the key reached send validation.
 */
export function resendFromSendHttp(
  status: number,
  bodyText: string,
  domain: string,
): HealthCheck {
  if (bodyLooksLikeUnverifiedDomain(bodyText) && (status === 422 || status === 403)) {
    return {
      ...AMBER,
      detail: `${domain} is not verified. Notification emails will not send until the domain is verified on Resend.`,
    };
  }

  if (status === 401 || status === 403) {
    return { ...FAIL, detail: "Resend rejected the key." };
  }

  if (status === 422 || (status >= 200 && status < 300)) {
    return { ...OK, detail: "Key can send." };
  }

  return { ...FAIL, detail: `Resend returned ${status}.` };
}

export const RESEND_PROBE_CACHE_MS = 3 * 60 * 1000;

type CachedProbe = { at: number; check: HealthCheck };

let probeCache: CachedProbe | null = null;

export function readResendProbeCache(
  now = Date.now(),
): HealthCheck | null {
  if (!probeCache) return null;
  if (now - probeCache.at >= RESEND_PROBE_CACHE_MS) return null;
  return probeCache.check;
}

export function writeResendProbeCache(
  check: HealthCheck,
  now = Date.now(),
): void {
  probeCache = { at: now, check };
}

/** Test seam. */
export function resetResendProbeCache(): void {
  probeCache = null;
}
