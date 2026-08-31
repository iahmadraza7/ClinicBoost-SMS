import { afterEach, describe, expect, it } from "vitest";

import {
  domainsIsInconclusive,
  readResendProbeCache,
  resetResendProbeCache,
  resendFromSendHttp,
  resendKeyFailure,
  RESEND_PROBE_CACHE_MS,
  writeResendProbeCache,
} from "./resend";

describe("resendKeyFailure", () => {
  it("fails when the key is missing", () => {
    expect(resendKeyFailure(undefined)?.detail).toBe("RESEND_API_KEY is missing.");
    expect(resendKeyFailure("")?.detail).toBe("RESEND_API_KEY is missing.");
    expect(resendKeyFailure("   ")?.tone).toBe("fail");
  });

  it("fails a value that is not an re_ key the same way", () => {
    const check = resendKeyFailure("REPLACE");
    expect(check?.tone).toBe("fail");
    expect(check?.detail).toBe("RESEND_API_KEY is missing.");
  });

  it("lets a real-looking key through to the probe", () => {
    expect(resendKeyFailure("re_not_a_real_secret")).toBeNull();
  });
});

describe("domainsIsInconclusive", () => {
  it("treats 401 as not a verdict so a sending-only key can fall through", () => {
    expect(domainsIsInconclusive(401)).toBe(true);
    expect(domainsIsInconclusive(403)).toBe(false);
    expect(domainsIsInconclusive(200)).toBe(false);
  });
});

describe("resendFromSendHttp", () => {
  const domain = "notify.clinicboost.com.au";

  it("is green when send validation rejects only the dummy recipient", () => {
    const check = resendFromSendHttp(
      422,
      JSON.stringify({ message: "Invalid `to` field. The email address needs to follow the email@example.com format." }),
      domain,
    );
    expect(check.tone).toBe("ok");
    expect(check.detail).toBe("Key can send.");
  });

  it("is amber when the from domain is not verified", () => {
    const check = resendFromSendHttp(
      422,
      JSON.stringify({ message: "The notify.clinicboost.com.au domain is not verified." }),
      domain,
    );
    expect(check.tone).toBe("amber");
    expect(check.detail).toMatch(/notify\.clinicboost\.com\.au/);
    expect(check.detail).toMatch(/not verified/);
  });

  it("is amber on 403 when Resend names an unverified domain", () => {
    const check = resendFromSendHttp(
      403,
      JSON.stringify({ message: "The notify.clinicboost.com.au domain is not verified." }),
      domain,
    );
    expect(check.tone).toBe("amber");
    expect(check.detail).toMatch(/not verified/);
  });

  it("is red when the send path rejects the key", () => {
    expect(resendFromSendHttp(401, "Unauthorized", domain).detail).toBe(
      "Resend rejected the key.",
    );
    expect(resendFromSendHttp(403, "restricted", domain).tone).toBe("fail");
    expect(resendFromSendHttp(403, "restricted", domain).detail).toBe(
      "Resend rejected the key.",
    );
  });

  it("reports an unexpected status", () => {
    expect(resendFromSendHttp(500, "oops", domain).detail).toBe(
      "Resend returned 500.",
    );
  });
});

describe("resend probe cache", () => {
  afterEach(() => {
    resetResendProbeCache();
  });

  it("returns a cached check inside the window and nothing after", () => {
    const check = {
      id: "resend",
      label: "Resend",
      tone: "ok" as const,
      detail: "Key can send.",
    };
    const now = 1_000_000;
    writeResendProbeCache(check, now);
    expect(readResendProbeCache(now + 1_000)).toEqual(check);
    expect(readResendProbeCache(now + RESEND_PROBE_CACHE_MS)).toBeNull();
  });
});
