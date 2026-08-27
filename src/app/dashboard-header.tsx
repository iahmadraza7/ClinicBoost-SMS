import Link from "next/link";

import { SignOut } from "./sign-out";

export function DashboardHeader({
  email,
  current,
  aside,
  children,
}: {
  email: string;
  current: "queue" | "clinics";
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <nav className="flex gap-4 text-sm">
          <NavLink href="/queue" active={current === "queue"}>
            Queue
          </NavLink>
          <NavLink href="/clinics" active={current === "clinics"}>
            Clinics
          </NavLink>
        </nav>
        {children}
      </div>
      <div className="flex flex-col items-end gap-1">
        <SignOut email={email} />
        {aside}
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "font-medium text-neutral-900"
          : "text-neutral-600 hover:text-neutral-900"
      }
    >
      {children}
    </Link>
  );
}
