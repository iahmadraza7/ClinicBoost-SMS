"use client";

import { useState, useTransition } from "react";

import { discardPendingEdit, reviewKbEntry } from "../actions";

export function PendingEditControls({
  slug,
  entryId,
  archivedClinic,
}: {
  slug: string;
  entryId: string;
  archivedClinic: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (archivedClinic) {
    return (
      <p className="text-sm text-neutral-600">
        Restore this clinic before approving or discarding.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await reviewKbEntry(slug, entryId);
            if (result && "error" in result) setError(result.error);
          });
        }}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
      >
        {pending ? "Working..." : "Approve into knowledge base"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await discardPendingEdit(slug, entryId);
            if (result && "error" in result) setError(result.error);
          });
        }}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
      >
        Discard
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}
