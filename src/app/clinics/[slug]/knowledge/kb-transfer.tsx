"use client";

import { useActionState, useState, useTransition } from "react";

import {
  confirmKbImport,
  exportKnowledge,
  previewKbImport,
  type KbActionState,
  type KbImportPreviewState,
} from "./actions";

export function KnowledgeTransfer({ slug }: { slug: string }) {
  const [preview, previewAction, previewPending] = useActionState<
    KbImportPreviewState,
    FormData
  >(previewKbImport.bind(null, slug), null);

  const [confirm, confirmAction, confirmPending] = useActionState<
    KbActionState,
    FormData
  >(confirmKbImport.bind(null, slug), null);

  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, startExport] = useTransition();

  const plan =
    preview && "created" in preview
      ? {
          created: preview.created,
          updated: preview.updated,
          skipped: preview.skipped,
          payload: preview.payload,
          kind: preview.kind,
        }
      : null;

  const pending = previewPending || confirmPending || exporting;
  const canImport =
    plan && plan.created.length + plan.updated.length > 0 && !pending;

  function download(format: "csv" | "json") {
    setExportError(null);
    startExport(async () => {
      const result = await exportKnowledge(slug, format);
      if ("error" in result) {
        setExportError(result.error);
        return;
      }
      const blob = new Blob([result.text], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <section className="mb-8 rounded-lg border border-neutral-300 bg-white p-4">
      <h2 className="text-sm font-semibold text-neutral-900">
        Export and import the knowledge base
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        CSV and JSON. Export, re-import, no change. Preview first. Skipped rows
        show a reason. Use this to build the other clinics in a spreadsheet.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => download("csv")}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
        >
          Export CSV
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => download("json")}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
        >
          Export JSON
        </button>
      </div>
      {exportError && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {exportError}
        </p>
      )}

      <form action={previewAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="font-medium text-neutral-900">CSV or JSON file</span>
          <input
            type="file"
            name="file"
            accept=".csv,.json,text/csv,application/json"
            className="mt-1 block text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
        >
          {previewPending ? "Reading..." : "Preview"}
        </button>
      </form>

      {preview && "error" in preview && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {preview.error}
        </p>
      )}
      {confirm && "error" in confirm && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {confirm.error}
        </p>
      )}

      {plan && (
        <div className="mt-4 space-y-4">
          <ImportGroup
            title="Will be created"
            rows={plan.created.map((r) => `${r.title} (${r.entry_key})`)}
          />
          <ImportGroup
            title="Will be updated"
            rows={plan.updated.map((r) => `${r.title} (${r.entry_key})`)}
          />
          <ImportGroup
            title="Skipped"
            rows={plan.skipped.map(
              (r) => `${r.title} (${r.entry_key}): ${r.reason}`,
            )}
          />

          <form action={confirmAction}>
            <input type="hidden" name="payload" value={plan.payload} />
            <input type="hidden" name="kind" value={plan.kind} />
            <button
              type="submit"
              disabled={!canImport}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
            >
              {confirmPending ? "Importing..." : "Confirm import"}
            </button>
            {!canImport && plan.created.length + plan.updated.length === 0 && (
              <p className="mt-2 text-sm text-neutral-600">
                Every row was skipped. Nothing to write.
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}

function ImportGroup({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-800">
        {title}{" "}
        <span className="font-normal text-neutral-500">({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <p className="mt-1 text-sm text-neutral-600">None.</p>
      ) : (
        <ul className="mt-2 divide-y divide-neutral-200 overflow-hidden rounded-md border border-neutral-300">
          {rows.map((row) => (
            <li key={row} className="px-3 py-2 text-sm text-neutral-800">
              {row}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
