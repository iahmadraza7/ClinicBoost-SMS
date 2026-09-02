import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath } from "@/server/auth/paths";
import { staleServerActionResponse } from "@/server/auth/stale-action";
import {
  COOKIE_NAME,
  expiredSessionCookie,
  readSession,
  sessionCookieIsStale,
} from "@/server/auth/session";

/**
 * Everything except the widget, the SMS webhooks, and the login page requires
 * a valid session cookie. Those three are the only things that have to work
 * without Ted being at his desk.
 *
 * A cookie that fails validation is expired on the way to /login. After a
 * deploy the browser still sends yesterday's cookie; leaving it in place
 * bounced / and /login until the browser gave up.
 */
export async function middleware(request: NextRequest) {
  const staleAction = staleServerActionResponse(request);
  if (staleAction) return staleAction;

  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = await readSession(token, process.env.AUTH_SECRET ?? "");
  const stale = sessionCookieIsStale(token, session);

  if (isPublicPath(pathname)) {
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      if (session) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      const next = NextResponse.next();
      if (stale) clearStaleSession(next, request);
      return next;
    }
    return NextResponse.next();
  }

  if (session) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("from", pathname);
  const response = NextResponse.redirect(login);
  if (stale) clearStaleSession(response, request);
  return response;
}

/**
 * Secure must match how the cookie was issued (APP_URL is https in
 * production). Caddy talks to the app over HTTP, so request.url is not enough.
 */
function cookieIsSecure(request: NextRequest): boolean {
  const appUrl = process.env.APP_URL ?? "";
  if (appUrl.startsWith("https://")) return true;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  return request.nextUrl.protocol === "https:";
}

function clearStaleSession(response: NextResponse, request: NextRequest): void {
  response.cookies.set(
    COOKIE_NAME,
    "",
    expiredSessionCookie(cookieIsSecure(request)),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
