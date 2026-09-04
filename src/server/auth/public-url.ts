/**
 * Absolute public URLs for redirects behind a reverse proxy.
 *
 * The app binds 0.0.0.0:3000. `new URL(path, request.url)` therefore resolves
 * to http://0.0.0.0:3000/... which the browser cannot reach. Prefer APP_URL,
 * then X-Forwarded-Host / X-Forwarded-Proto that Caddy sets. Never use the
 * request URL as the base.
 */

export type PublicUrlInput = {
  appUrl?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
};

export function publicOrigin(input: PublicUrlInput): string {
  const fromApp = originFromAppUrl(input.appUrl);
  if (fromApp) return fromApp;

  const fromForwarded = originFromForwarded(
    input.forwardedHost,
    input.forwardedProto,
  );
  if (fromForwarded) return fromForwarded;

  throw new Error(
    "Cannot build a public URL: set APP_URL, or send X-Forwarded-Host and X-Forwarded-Proto",
  );
}

/**
 * Resolve a same-origin path (may include ?query) against the public origin.
 */
export function absolutePublicUrl(path: string, input: PublicUrlInput): URL {
  const origin = publicOrigin(input);
  if (!path.startsWith("/")) {
    throw new Error(`Redirect path must be absolute on this host: ${path}`);
  }
  return new URL(path, `${origin}/`);
}

function originFromAppUrl(appUrl: string | null | undefined): string | null {
  const raw = (appUrl ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    // 0.0.0.0 is the listen address, never a browser-reachable host.
    // localhost is fine for local APP_URL.
    if (isBindHostname(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function originFromForwarded(
  hostHeader: string | null | undefined,
  protoHeader: string | null | undefined,
): string | null {
  const host = firstHop(hostHeader);
  if (!host) return null;
  const hostname = host.split(":")[0] ?? host;
  if (isBindHostname(hostname)) return null;
  const proto = firstHop(protoHeader) || "https";
  return `${proto}://${host}`;
}

function firstHop(header: string | null | undefined): string {
  return (header ?? "").split(",")[0]?.trim() ?? "";
}

/** Listen / all-interfaces addresses. Not loopback — localhost is valid locally. */
export function isBindHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return host === "0.0.0.0" || host === "::" || host === "[::]";
}
