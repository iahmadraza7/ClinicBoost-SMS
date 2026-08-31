"use client";

import { useState, useTransition } from "react";

import { revertAudit } from "./actions";

export function RevertButton({
  clinicId,
  auditId,
}: {
  clinicId: string;
  auditId: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await revertAudit({ clinicId, auditId });
            if (!result.ok) setError(result.error);
          });
        }}
        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
      >
        {pending ? "Reverting..." : "Revert"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
