"use client";

import { useState, useTransition } from "react";

import {
  archiveKbEntry,
  restoreKbEntry,
  reviewKbEntry,
} from "./actions";

export function ReviewControls({
  slug,
  entryId,
}: {
  slug: string;
  entryId: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-sm font-medium text-amber-950">Waiting for review</h2>
      <p className="mt-1 text-sm text-amber-900">
        The model cannot use this entry until you review it. Review is a
        separate action so a mistake cannot poison the knowledge base on save.
      </p>
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
        className="mt-3 rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 disabled:opacity-40"
      >
        {pending ? "Reviewing..." : "Review and make active"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function ArchiveKbControls({
  slug,
  entryId,
  archived,
}: {
  slug: string;
  entryId: string;
  archived: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<{ error: string } | { saved: true } | null>,
  ) {
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
          onClick={() => run(() => restoreKbEntry(slug, entryId))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-40"
        >
          {pending ? "Restoring..." : "Restore to review"}
        </button>
        <p className="mt-2 text-sm text-neutral-600">
          Comes back as waiting for review, not active.
        </p>
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
            "Archive this entry? The model will stop using it. Nothing is deleted.",
          );
          if (ok) run(() => archiveKbEntry(slug, entryId));
        }}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40"
      >
        {pending ? "Archiving..." : "Archive entry"}
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
