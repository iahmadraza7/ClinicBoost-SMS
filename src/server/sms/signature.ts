import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Mobile Message webhook signatures.
 *
 * The endpoints sit on the public internet and write to the database, so an
 * unsigned request is an open door: anyone who finds the URL could inject a
 * fake customer message and provoke a reply. Signing is optional at the
 * provider; here it is mandatory.
 *
 * Scheme: HMAC-SHA256 over "{timestamp}.{raw body}", hex, in X-MM-Signature,
 * with the unix seconds in X-MM-Timestamp.
 */

export const TIMESTAMP_HEADER = "x-mm-timestamp";
export const SIGNATURE_HEADER = "x-mm-signature";

/** A captured request stays validly signed forever, so age is checked too. */
export const MAX_AGE_SECONDS = 300;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string; status: 400 | 401 };

export function sign(
  secret: string,
  timestamp: string,
  rawBody: string,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

export function verifyWebhook(args: {
  secret: string;
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  now?: Date;
}): VerifyResult {
  const { secret, rawBody, timestamp, signature } = args;

  if (!secret) {
    return { ok: false, reason: "no signing secret configured", status: 401 };
  }
  if (!timestamp || !signature) {
    return { ok: false, reason: "missing signature headers", status: 400 };
  }

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) {
    return { ok: false, reason: "timestamp is not a number", status: 400 };
  }

  const nowSeconds = (args.now?.getTime() ?? Date.now()) / 1000;
  if (Math.abs(nowSeconds - sentAt) > MAX_AGE_SECONDS) {
    return { ok: false, reason: "timestamp outside the accepted window", status: 400 };
  }

  if (!constantTimeEquals(sign(secret, timestamp, rawBody), signature)) {
    return { ok: false, reason: "signature did not match", status: 401 };
  }

  return { ok: true };
}

/** A plain === returns early on the first wrong byte, which leaks the answer. */
function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
