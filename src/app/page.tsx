import Link from "next/link";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-lg font-semibold">ClinicBoost SMS</h1>
      <Link
        href="/queue"
        className="mt-2 inline-block text-sm text-neutral-600 underline"
      >
        Approval queue
      </Link>
    </main>
  );
}
