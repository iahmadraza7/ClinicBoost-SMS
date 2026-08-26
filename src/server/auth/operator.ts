import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "../env";
import { operatorFromEnv, normaliseEmail } from "./credentials";
import { COOKIE_NAME, readSession, type Session } from "./session";

/**
 * Reads the session cookie and checks it still names the configured operator.
 * A cookie issued before a credential rotation is not a login.
 */
export async function getOperator(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = await readSession(token, env.AUTH_SECRET ?? "");
  if (!session) return null;

  const operator = operatorFromEnv(env);
  if (!operator) return null;
  if (normaliseEmail(session.email) !== operator.email) return null;

  return session;
}

export async function requireOperator(): Promise<Session> {
  const session = await getOperator();
  if (!session) redirect("/login");
  return session;
}
