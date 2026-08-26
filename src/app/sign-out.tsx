import { logout } from "@/app/login/actions";

export function SignOut({ email }: { email: string }) {
  return (
    <form action={logout} className="flex items-center gap-3">
      <span className="text-xs text-neutral-500">{email}</span>
      <button
        type="submit"
        className="text-xs text-neutral-600 underline hover:text-neutral-900"
      >
        Sign out
      </button>
    </form>
  );
}
