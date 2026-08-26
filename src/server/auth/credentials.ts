import { verifyPassword } from "./password";

export type OperatorCredentials = {
  email: string;
  passwordHash: string;
};

/**
 * The operator is not a row. Email and password hash live in the environment,
 * which is the whole access-control model for a one-person product.
 *
 * The password is always hashed, even when the email is wrong, so a miss on
 * the email does not return faster than a miss on the password.
 */
export function authenticate(
  email: string,
  password: string,
  operator: OperatorCredentials | null,
): boolean {
  if (!operator?.email || !operator.passwordHash) return false;

  const passwordOk = verifyPassword(password, operator.passwordHash);
  const emailOk = normaliseEmail(email) === normaliseEmail(operator.email);

  return emailOk && passwordOk;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function operatorFromEnv(env: {
  OPERATOR_EMAIL?: string;
  OPERATOR_PASSWORD_HASH?: string;
}): OperatorCredentials | null {
  if (!env.OPERATOR_EMAIL || !env.OPERATOR_PASSWORD_HASH) return null;
  return {
    email: normaliseEmail(env.OPERATOR_EMAIL),
    passwordHash: env.OPERATOR_PASSWORD_HASH,
  };
}
