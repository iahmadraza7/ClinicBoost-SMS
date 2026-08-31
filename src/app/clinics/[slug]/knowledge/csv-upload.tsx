"use client";

import { useActionState } from "react";

import type { BookingCsvPlanRow } from "@/server/kb/csv";
import {
  confirmBookingCsv,
  previewBookingCsv,
  type CsvPreviewState,
  type KbActionState,
} from "./actions";

export function CsvUpload({ slug }: { slug: string }) {
  const [preview, previewAction, previewPending] = useActionState<
    CsvPreviewState,
    FormData
  >(previewBookingCsv.bind(null, slug), null);

  const [confirm, confirmAction, confirmPending] = useActionState<
    KbActionState,
    FormData
  >(confirmBookingCsv.bind(null, slug), null);

  const plan =
    preview && "created" in preview
      ? {
          created: preview.created,
          updated: preview.updated,
          skipped: preview.skipped,
          csvText: preview.csvText,
        }
      : null;

  const pending = previewPending || confirmPending;
  const canImport =
    plan && plan.created.length + plan.updated.length > 0 && !pending;

  return (
    <section className="mb-8 rounded-lg border border-neutral-300 bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-900">
        Booking URLs from a CSV
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Columns: treatment name, booking URL, price display. Preview first.
        Nothing is written until you confirm. New and changed rows wait for
        review, like any other entry.
      </p>

      <form action={previewAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="font-medium text-neutral-900">CSV file</span>
          <input
            type="file"
            name="csv"
            accept=".csv,text/csv"
            className="mt-1 block text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-40"
        >
          {previewPending ? "Reading..." : "Preview"}
        </button>
      </form>

      {preview && "error" in preview && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {preview.error}
        </p>
      )}
      {confirm && "error" in confirm && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {confirm.error}
        </p>
      )}

      {plan && (
        <div className="mt-4 space-y-4">
          <PlanGroup
            title="Will be created"
            empty="None."
            rows={plan.created}
          />
          <PlanGroup
            title="Will be updated"
            empty="None."
            rows={plan.updated}
          />
          <PlanGroup
            title="Already matches, will be skipped"
            empty="None."
            rows={plan.skipped}
          />

          <form action={confirmAction}>
            <input type="hidden" name="csvText" value={plan.csvText} />
            <button
              type="submit"
              disabled={!canImport}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              {confirmPending ? "Importing..." : "Confirm import"}
            </button>
            {!canImport && plan.created.length + plan.updated.length === 0 && (
              <p className="mt-2 text-sm text-neutral-600">
                Every row already matches. Nothing to write.
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}

function PlanGroup({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: BookingCsvPlanRow[];
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-800">
        {title}{" "}
        <span className="font-normal text-neutral-500">({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-neutral-600">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-md border border-neutral-200">
          {rows.map((row) => (
            <li key={`${row.action}-${row.entryKey}`} className="px-3 py-2 text-sm">
              <p className="font-medium text-neutral-900">{row.name}</p>
              <p className="mt-0.5 text-neutral-600">
                {row.priceDisplay}
                <span className="text-neutral-400"> · </span>
                <span className="break-all">{row.bookingUrl}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
