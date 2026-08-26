import type { Clinic } from "../db/schema";

/**
 * CORS is per clinic. A clinic's widget only answers browser requests coming
 * from that clinic's own landing pages, so one clinic's page cannot post
 * enquiries into another clinic's queue.
 */

function normaliseOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "").toLowerCase();
}

export function isOriginAllowed(clinic: Clinic, origin: string | null): boolean {
  if (!origin) return false;
  const allowed = clinic.widgetOrigins.map(normaliseOrigin);
  return allowed.includes(normaliseOrigin(origin));
}

export function corsHeaders(
  clinic: Clinic,
  origin: string | null,
): Record<string, string> {
  if (!isOriginAllowed(clinic, origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * A same-origin or server-to-server request carries no Origin header and is not
 * a CORS request at all. Only reject when a browser presents an origin we do
 * not know.
 */
export function isCrossOriginRejected(
  clinic: Clinic,
  origin: string | null,
): boolean {
  return origin !== null && !isOriginAllowed(clinic, origin);
}
