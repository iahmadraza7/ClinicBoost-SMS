import { env } from "../env";
import { authenticate, operatorFromEnv } from "./credentials";
import type { LoginErrorCode } from "./login-messages";
import { safeReturnTo } from "./paths";
import { hit } from "../widget/rate-limit";

export type { LoginErrorCode } from "./login-messages";

export type LoginAttemptResult =
  | { ok: true; email: string; redirectTo: string }
  | { ok: false; error: LoginErrorCode };

const LOGIN_ATTEMPTS = { limit: 5, windowMs: 15 * 60_000 };

export async function attemptLogin(input: {
  email: string;
  password: string;
  from: string | null | undefined;
  clientIp: string;
}): Promise<LoginAttemptResult> {
  const redirectTo = safeReturnTo(input.from);

  const ipLimit = hit(`login:${input.clientIp}`, LOGIN_ATTEMPTS);
  if (!ipLimit.allowed) {
    return { ok: false, error: "rate" };
  }

  if (!env.AUTH_SECRET || !operatorFromEnv(env)) {
    return { ok: false, error: "config" };
  }

  const operator = operatorFromEnv(env)!;
  if (!authenticate(input.email, input.password, operator)) {
    return { ok: false, error: "wrong" };
  }

  return { ok: true, email: operator.email, redirectTo };
}
