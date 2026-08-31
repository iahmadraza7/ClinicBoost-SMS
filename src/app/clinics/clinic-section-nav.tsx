import Link from "next/link";

export function ClinicSectionNav({
  slug,
  current,
}: {
  slug: string;
  current: "settings" | "knowledge" | "pending-edits" | "opt-outs";
}) {
  return (
    <nav className="mb-6 flex gap-4 border-b border-neutral-300 text-sm">
      <SectionLink href={`/clinics/${slug}`} active={current === "settings"}>
        Settings
      </SectionLink>
      <SectionLink
        href={`/clinics/${slug}/knowledge`}
        active={current === "knowledge"}
      >
        Knowledge base
      </SectionLink>
      <SectionLink
        href={`/clinics/${slug}/knowledge/pending-edits`}
        active={current === "pending-edits"}
      >
        Pending edits
      </SectionLink>
      <SectionLink
        href={`/clinics/${slug}/opt-outs`}
        active={current === "opt-outs"}
      >
        Opt-outs
      </SectionLink>
    </nav>
  );
}

function SectionLink({
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
          ? "-mb-px border-b-2 border-neutral-900 pb-2 font-medium text-neutral-900"
          : "pb-2 text-neutral-600 hover:text-neutral-900"
      }
    >
      {children}
    </Link>
  );
}
