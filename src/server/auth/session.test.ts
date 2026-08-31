import { describe, expect, it } from "vitest";

import {
  COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  expiredSessionCookie,
  issueSession,
  readSession,
  sessionCookieIsStale,
  sessionCookieOptions,
  timingSafeEqual,
} from "./session";

const SECRET = "test-secret-not-for-production-use-32b";

describe("issueSession / readSession", () => {
  it("round-trips an email", async () => {
    const token = await issueSession("ted@clinicboost.com.au", SECRET);
    const session = await readSession(token, SECRET);
    expect(session?.email).toBe("ted@clinicboost.com.au");
    expect(session?.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("rejects a tampered payload", async () => {
    const token = await issueSession("ted@clinicboost.com.au", SECRET);
    const [body, signature] = token.split(".");
    const tampered = body.replace(/.$/, body.endsWith("A") ? "B" : "A");
    expect(await readSession(`${tampered}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueSession("ted@clinicboost.com.au", SECRET);
    expect(await readSession(token, "some-other-secret-of-similar-length")).toBeNull();
  });

  it("rejects an expired session", async () => {
    const issuedAt =
      Date.now() - (SESSION_MAX_AGE_SECONDS + 60) * 1000;
    const token = await issueSession("ted@clinicboost.com.au", SECRET, issuedAt);
    expect(await readSession(token, SECRET)).toBeNull();
  });

  it("rejects missing or empty input rather than throwing", async () => {
    expect(await readSession(undefined, SECRET)).toBeNull();
    expect(await readSession("", SECRET)).toBeNull();
    expect(await readSession("nope", SECRET)).toBeNull();
    expect(await readSession("a.b.c", SECRET)).toBeNull();
    const token = await issueSession("ted@clinicboost.com.au", SECRET);
    expect(await readSession(token, "")).toBeNull();
  });

  it("refuses to issue a cookie without a signing secret", async () => {
    await expect(issueSession("ted@clinicboost.com.au", "")).rejects.toThrow(
      /AUTH_SECRET/,
    );
  });
});

describe("timingSafeEqual", () => {
  it("accepts identical strings", () => {
    expect(timingSafeEqual("abcd", "abcd")).toBe(true);
  });

  it("rejects a different string of the same length", () => {
    expect(timingSafeEqual("abcd", "abce")).toBe(false);
  });

  it("rejects different lengths without throwing", () => {
    expect(timingSafeEqual("abc", "ab")).toBe(false);
  });
});

describe("cookie name", () => {
  it("is a dedicated name, not the generic session default", () => {
    expect(COOKIE_NAME).toBe("cb_session");
  });
});

describe("stale session cookie", () => {
  it("is stale only when a cookie was sent and it failed validation", () => {
    expect(sessionCookieIsStale(undefined, null)).toBe(false);
    expect(sessionCookieIsStale("", null)).toBe(false);
    expect(sessionCookieIsStale("not-a-session", null)).toBe(true);
    expect(
      sessionCookieIsStale("token", { email: "a@b.c", exp: 1 }),
    ).toBe(false);
  });

  it("expires with the same attributes the live cookie used", () => {
    const live = sessionCookieOptions(true);
    const expired = expiredSessionCookie(true);
    expect(expired.maxAge).toBe(0);
    expect(expired.path).toBe(live.path);
    expect(expired.httpOnly).toBe(live.httpOnly);
    expect(expired.sameSite).toBe(live.sameSite);
    expect(expired.secure).toBe(true);
    expect(expiredSessionCookie(false).secure).toBe(false);
  });
});
