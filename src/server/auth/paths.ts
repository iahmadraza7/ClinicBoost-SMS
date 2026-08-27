/**
 * Paths the operator does not need to be signed in to reach.
 *
 * The widget and the Mobile Message webhooks are the product's public surface.
 * /login has to be reachable or the operator can never sign in. Everything
 * else, including /api/health, sits behind the session cookie.
 */
export function isPublicPath(pathname: string): boolean {
  const path = stripTrailingSlash(pathname);

  if (path === "/login") return true;
  if (path === "/widget.js") return true;
  if (path === "/api/widget" || path.startsWith("/api/widget/")) return true;
  if (path === "/api/webhooks" || path.startsWith("/api/webhooks/")) return true;

  return false;
}

/**
 * After login, send the operator back where they were trying to go. Only a
 * same-origin relative path is accepted, so a crafted `?from=` cannot bounce
 * them onto another site with a valid session cookie sitting next to it.
 */
export function safeReturnTo(from: string | null | undefined): string {
  if (!from) return "/";
  if (!from.startsWith("/")) return "/";
  if (from.startsWith("//") || from.startsWith("/\\")) return "/";
  if (from.includes("://")) return "/";
  if (from.startsWith("/login")) return "/";
  return from;
}

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
