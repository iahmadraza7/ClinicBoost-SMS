export type LoginErrorCode = "wrong" | "rate" | "config";

export function loginErrorMessage(code: LoginErrorCode): string {
  switch (code) {
    case "rate":
      return "Too many attempts. Wait a few minutes and try again.";
    case "config":
      return "Sign-in is not configured. Set AUTH_SECRET, OPERATOR_EMAIL and OPERATOR_PASSWORD_HASH.";
    case "wrong":
      return "Email or password is wrong.";
  }
}
