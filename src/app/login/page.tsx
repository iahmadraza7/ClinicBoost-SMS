import { env } from "@/server/env";
import { safeReturnTo } from "@/server/auth/paths";

import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const configured = Boolean(
    env.AUTH_SECRET && env.OPERATOR_EMAIL && env.OPERATOR_PASSWORD_HASH,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-xl font-semibold">ClinicBoost SMS</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Sign in to the dashboard.
      </p>

      {configured ? (
        <LoginForm from={safeReturnTo(from)} error={error} />
      ) : (
        <p className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Sign-in is not configured yet. Set AUTH_SECRET, OPERATOR_EMAIL and
          OPERATOR_PASSWORD_HASH, then restart the app.
        </p>
      )}
    </main>
  );
}
