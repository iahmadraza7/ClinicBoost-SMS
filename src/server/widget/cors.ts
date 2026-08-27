import type { Clinic } from "../db/schema";

/**
 * CORS is per clinic. A clinic's widget only answers browser requests coming
 * from that clinic's own landing pages, so one clinic's page cannot post
 * enquiries into another clinic's queue.
 *
 * `extraOrigins` is the app itself, so the operator can try the widget from
 * the clinic screen without adding the dashboard to widget_origins.
 */

function normaliseOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "").toLowerCase();
}

export function isOriginAllowed(
  clinic: Clinic,
  origin: string | null,
  extraOrigins: string[] = [],
): boolean {
  if (!origin) return false;
  const allowed = [
    ...clinic.widgetOrigins.map(normaliseOrigin),
    ...extraOrigins.map(normaliseOrigin),
  ];
  return allowed.includes(normaliseOrigin(origin));
}

export function corsHeaders(
  clinic: Clinic,
  origin: string | null,
  extraOrigins: string[] = [],
): Record<string, string> {
  if (!isOriginAllowed(clinic, origin, extraOrigins)) return {};
  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
  extraOrigins: string[] = [],
): boolean {
  return origin !== null && !isOriginAllowed(clinic, origin, extraOrigins);
}
