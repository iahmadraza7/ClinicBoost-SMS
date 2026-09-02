import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { STALE_ACTION_HEADER } from "@/lib/stale-action";

/** Set on reload responses so client-side recovery can stay out of the way. */
export { STALE_ACTION_HEADER };

let knownServerActionIds: Set<string> | null = null;

function getKnownServerActionIds(): Set<string> {
  if (knownServerActionIds) return knownServerActionIds;
  try {
    const raw = process.env.SERVER_ACTION_IDS ?? "[]";
    const parsed = JSON.parse(raw) as unknown;
    knownServerActionIds = new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    knownServerActionIds = new Set();
  }
  return knownServerActionIds;
}

/** For tests: reset the module cache after changing SERVER_ACTION_IDS. */
export function resetKnownServerActionIdsForTests(): void {
  knownServerActionIds = null;
}

/**
 * Server action IDs in Next 15 are lowercase hex strings. Reject everything
 * else before Next logs "did not match the expected format".
 */
export function mightBeServerActionId(id: string): boolean {
  if (id.length < 20 || id.length > 128) return false;
  return /^[a-f0-9]+$/.test(id);
}

export function serverActionIdFromRequest(request: NextRequest): string | null {
  if (request.method !== "POST") return null;
  const id =
    request.headers.get("Next-Action") ?? request.headers.get("next-action");
  return id && id.length > 0 ? id : null;
}

export function isKnownServerActionId(id: string): boolean {
  return getKnownServerActionIds().has(id);
}

/**
 * Widget and webhook POSTs must never be blocked by stale-action detection.
 * External senders do not use Next-Action today, but a scanner or proxy might
 * add one and silently drop a customer enquiry.
 */
export function isExternalInboundPost(request: NextRequest): boolean {
  if (request.method !== "POST") return false;
  const path = request.nextUrl.pathname;
  if (path === "/api/widget" || path.startsWith("/api/widget/")) return true;
  if (path === "/api/webhooks" || path.startsWith("/api/webhooks/")) return true;
  return false;
}

/**
 * HTML with an immediate reload. Works for full-page POST and for fetch-based
 * server actions (the script runs when the client parses the body).
 */
export function staleActionReloadResponse(): NextResponse {
  return new NextResponse(STALE_ACTION_RELOAD_HTML, {
    status: 409,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      [STALE_ACTION_HEADER]: "1",
    },
  });
}

const STALE_ACTION_RELOAD_HTML = `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<title>Updating</title>
<meta http-equiv="refresh" content="0">
</head>
<body>
<p>A new version was deployed. Reloading…</p>
<script>location.reload()</script>
</body>
</html>`;

/**
 * In production, reject server action posts whose id is missing from the
 * current build manifest. That covers stale bundles after deploy.
 */
export function staleServerActionResponse(
  request: NextRequest,
): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (isExternalInboundPost(request)) return null;

  const knownIds = getKnownServerActionIds();
  if (knownIds.size === 0) return null;

  const actionId = serverActionIdFromRequest(request);
  if (!actionId) return null;

  if (!mightBeServerActionId(actionId) || !knownIds.has(actionId)) {
    return staleActionReloadResponse();
  }

  return null;
}
