import { describe, expect, it } from "vitest";

import { MAX_AGE_SECONDS, sign, verifyWebhook } from "./signature";

/**
 * Mobile Message publishes these three inputs and the signature they must
 * produce, so this pins our HMAC to the vendor's own arithmetic rather than to
 * our reading of the prose.
 */
const VECTOR = {
  secret: "abc123",
  timestamp: "1754640000",
  body: '{"test":1}',
  signature:
    "52344b9592722e0241d82036e0920f4286bc0d47ba4624c5a1588193490a1efb",
};

const at = (unixSeconds: number) => new Date(unixSeconds * 1000);

describe("sign", () => {
  it("reproduces the vendor's published test vector", () => {
    expect(sign(VECTOR.secret, VECTOR.timestamp, VECTOR.body)).toBe(
      VECTOR.signature,
    );
  });

  it("signs the raw body, so re-spacing the JSON changes the signature", () => {
    expect(sign(VECTOR.secret, VECTOR.timestamp, '{"test": 1}')).not.toBe(
      VECTOR.signature,
    );
  });
});

describe("verifyWebhook", () => {
  const good = {
    secret: VECTOR.secret,
    rawBody: VECTOR.body,
    timestamp: VECTOR.timestamp,
    signature: VECTOR.signature,
    now: at(Number(VECTOR.timestamp)),
  };

  it("accepts a correctly signed request", () => {
    expect(verifyWebhook(good)).toEqual({ ok: true });
  });

  it("rejects a tampered body", () => {
    const result = verifyWebhook({ ...good, rawBody: '{"test":2}' });
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects a wrong secret", () => {
    const result = verifyWebhook({ ...good, secret: "not-the-secret" });
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("refuses to run at all with no secret configured", () => {
    const result = verifyWebhook({ ...good, secret: "" });
    expect(result).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects missing headers", () => {
    expect(verifyWebhook({ ...good, signature: null })).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(verifyWebhook({ ...good, timestamp: null })).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it("rejects a replay from outside the window", () => {
    const result = verifyWebhook({
      ...good,
      now: at(Number(VECTOR.timestamp) + MAX_AGE_SECONDS + 1),
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("allows normal delay and a little clock drift", () => {
    expect(
      verifyWebhook({ ...good, now: at(Number(VECTOR.timestamp) + 120) }),
    ).toEqual({ ok: true });
    expect(
      verifyWebhook({ ...good, now: at(Number(VECTOR.timestamp) - 120) }),
    ).toEqual({ ok: true });
  });

  it("rejects a non-numeric timestamp rather than treating it as epoch", () => {
    expect(verifyWebhook({ ...good, timestamp: "not-a-time" })).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});
