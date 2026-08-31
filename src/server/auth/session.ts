/**
 * HMAC-signed session cookie. Edge-safe (Web Crypto only) so middleware can
 * verify it without Node APIs.
 *
 * This is the Lucia pattern for a single operator: a signed payload, not a
 * session table, because there is no users table. Auth.js would be the other
 * allowed option and is heavier than one email in the environment.
 *
 * The cookie is the whole credential. Rotating AUTH_SECRET logs the operator
 * out everywhere, which is the intended "stolen laptop" response.
 */

export const COOKIE_NAME = "cb_session";

/** Twelve hours. Long enough for a working day, short enough that a copied
 * cookie is not a permanent key. */
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export type Session = {
  email: string;
  exp: number;
};

export type CookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/**
 * Same attributes as the live cookie, maxAge 0. The name, path, Secure and
 * SameSite must match or the browser will keep the stale value and bounce
 * / ↔ /login after a deploy.
 */
export function expiredSessionCookie(secure: boolean): CookieOptions {
  return {
    ...sessionCookieOptions(secure),
    maxAge: 0,
  };
}

/** Cookie was sent but is not a live session. */
export function sessionCookieIsStale(
  token: string | undefined,
  session: Session | null,
): boolean {
  return Boolean(token) && session === null;
}

export async function issueSession(
  email: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload: Session = {
    email,
    exp: Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = toBase64Url(JSON.stringify(payload));
  const signature = await sign(secret, body);
  return `${body}.${signature}`;
}

export async function readSession(
  token: string | undefined | null,
  secret: string,
  now = Date.now(),
): Promise<Session | null> {
  if (!token || !secret) return null;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot !== token.lastIndexOf(".")) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = await sign(secret, body);
  if (!timingSafeEqual(signature, expected)) return null;

  let payload: Session;
  try {
    payload = JSON.parse(fromBase64Url(body)) as Session;
  } catch {
    return null;
  }

  if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
    return null;
  }
  if (payload.exp * 1000 <= now) return null;

  return payload;
}

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return toBase64UrlBytes(new Uint8Array(bytes));
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(text: string): string {
  return toBase64UrlBytes(encoder.encode(text));
}

function toBase64UrlBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(text: string): string {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return decoder.decode(bytes);
}

/** XOR-and-accumulate so a mismatch does not return on the first wrong byte. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
