import { NextResponse } from "next/server";

import { attemptLogin } from "@/server/auth/login-flow";
import { safeReturnTo } from "@/server/auth/paths";
import { absolutePublicUrl } from "@/server/auth/public-url";
import {
  COOKIE_NAME,
  issueSession,
  sessionCookieOptions,
} from "@/server/auth/session";
import { env } from "@/server/env";

/**
 * Plain POST login. No server action id, so a stale JS bundle after deploy
 * cannot break the one page a locked-out operator needs.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const from = safeReturnTo(String(form.get("from") ?? ""));

  const result = await attemptLogin({
    email,
    password,
    from,
    clientIp: clientIpFromRequest(request),
  });

  if (!result.ok) {
    const login = redirectUrl("/login", request);
    login.searchParams.set("error", result.error);
    login.searchParams.set("from", from);
    return NextResponse.redirect(login);
  }

  const token = await issueSession(result.email, env.AUTH_SECRET!);
  const response = NextResponse.redirect(
    redirectUrl(result.redirectTo, request),
  );
  response.cookies.set(
    COOKIE_NAME,
    token,
    sessionCookieOptions(env.APP_URL.startsWith("https://")),
  );
  return response;
}

function redirectUrl(path: string, request: Request): URL {
  return absolutePublicUrl(path, {
    appUrl: env.APP_URL,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  });
}

function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
