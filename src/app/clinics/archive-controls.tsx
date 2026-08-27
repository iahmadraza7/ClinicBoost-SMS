"use client";

import { useState, useTransition } from "react";

import { archiveClinic, restoreClinic } from "./actions";

export function ArchiveControls({
  slug,
  archived,
}: {
  slug: string;
  archived: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error: string } | { saved: true } | null>) {
    setError(null);
    start(async () => {
      const result = await action();
      if (result && "error" in result) setError(result.error);
    });
  }

  if (archived) {
    return (
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => restoreClinic(slug))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-40"
        >
          {pending ? "Restoring..." : "Restore clinic"}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const ok = window.confirm(
            "Archive this clinic? The widget will stop taking enquiries and it will leave the approval queue. Nothing is deleted.",
          );
          if (ok) run(() => archiveClinic(slug));
        }}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40"
      >
        {pending ? "Archiving..." : "Archive clinic"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
