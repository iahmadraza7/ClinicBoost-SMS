import type { HealthCheck } from "./status";

const FAIL = {
  id: "anthropic" as const,
  label: "Anthropic",
  tone: "fail" as const,
};

/**
 * A string that cannot be a live Anthropic key. "REPLACE" on the server
 * was reporting green because GET /v1/models does not actually prove the
 * key can draft.
 */
export function anthropicKeyFailure(key: string | undefined): HealthCheck | null {
  if (!key || key.trim() === "") {
    return { ...FAIL, detail: "ANTHROPIC_API_KEY is not set." };
  }

  const value = key.trim();
  if (!value.startsWith("sk-ant-")) {
    return { ...FAIL, detail: "Anthropic rejected the key." };
  }

  return null;
}

export function anthropicFromHttp(
  status: number,
  model: string,
): HealthCheck {
  if (status === 401 || status === 403) {
    return { ...FAIL, detail: "Anthropic rejected the key." };
  }

  if (status === 404) {
    return {
      ...FAIL,
      detail: `${model} is not available on this Anthropic account.`,
    };
  }

  if (status >= 200 && status < 300) {
    return {
      id: "anthropic",
      label: "Anthropic",
      tone: "ok",
      detail: "Key is valid.",
    };
  }

  return { ...FAIL, detail: `Anthropic returned ${status}.` };
}
