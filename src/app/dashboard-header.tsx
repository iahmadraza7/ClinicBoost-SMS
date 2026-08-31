import Link from "next/link";

import { SignOut } from "./sign-out";

export function DashboardHeader({
  email,
  current,
  aside,
  children,
}: {
  email: string;
  current: "home" | "queue" | "clinics" | "audit";
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <nav className="flex gap-5 border-b border-neutral-300 text-sm">
          <NavLink href="/" active={current === "home"}>
            Home
          </NavLink>
          <NavLink href="/queue" active={current === "queue"}>
            Queue
          </NavLink>
          <NavLink href="/clinics" active={current === "clinics"}>
            Clinics
          </NavLink>
          <NavLink href="/audit" active={current === "audit"}>
            Audit
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
          ? "-mb-px border-b-2 border-neutral-900 pb-2 font-semibold text-neutral-900"
          : "pb-2 text-neutral-600 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
      }
    >
      {children}
    </Link>
  );
}
