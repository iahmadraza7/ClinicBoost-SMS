import { loginErrorMessage, type LoginErrorCode } from "@/server/auth/login-messages";

const LOGIN_ERRORS = new Set<LoginErrorCode>(["wrong", "rate", "config"]);

function parseLoginError(raw: string | undefined): LoginErrorCode | null {
  if (!raw || !LOGIN_ERRORS.has(raw as LoginErrorCode)) return null;
  return raw as LoginErrorCode;
}

export function LoginForm({
  from,
  error,
}: {
  from: string;
  error?: string;
}) {
  const errorCode = parseLoginError(error);

  return (
    <form method="POST" action="/api/login" className="mt-6 space-y-4">
      <input type="hidden" name="from" value={from} />

      <label className="block text-sm">
        <span className="text-neutral-700">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <label className="block text-sm">
        <span className="text-neutral-700">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </label>

      {errorCode && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {loginErrorMessage(errorCode)}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
      >
        Sign in
      </button>
    </form>
  );
}
