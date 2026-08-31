"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/server/env";
import { authenticate, operatorFromEnv } from "@/server/auth/credentials";
import { safeReturnTo } from "@/server/auth/paths";
import {
  COOKIE_NAME,
  expiredSessionCookie,
  issueSession,
  sessionCookieOptions,
} from "@/server/auth/session";
import { hit } from "@/server/widget/rate-limit";

export type LoginState = { error: string } | null;

const LOGIN_ATTEMPTS = { limit: 5, windowMs: 15 * 60_000 };

export async function login(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const from = safeReturnTo(String(form.get("from") ?? ""));

  const ipLimit = hit(`login:${await clientIp()}`, LOGIN_ATTEMPTS);
  if (!ipLimit.allowed) {
    return { error: "Too many attempts. Wait a few minutes and try again." };
  }

  if (!env.AUTH_SECRET || !operatorFromEnv(env)) {
    return {
      error:
        "Sign-in is not configured. Set AUTH_SECRET, OPERATOR_EMAIL and OPERATOR_PASSWORD_HASH.",
    };
  }

  const operator = operatorFromEnv(env)!;
  if (!authenticate(email, password, operator)) {
    return { error: "Email or password is wrong." };
  }

  const token = await issueSession(operator.email, env.AUTH_SECRET);
  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    token,
    sessionCookieOptions(env.APP_URL.startsWith("https://")),
  );

  redirect(from);
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    "",
    expiredSessionCookie(env.APP_URL.startsWith("https://")),
  );
  redirect("/login");
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
