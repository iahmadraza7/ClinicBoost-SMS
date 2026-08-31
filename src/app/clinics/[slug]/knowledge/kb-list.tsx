"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { ANSWER_MODE_CHOICES } from "@/server/kb/fields";
import type { AnswerMode, KbStatus } from "@/server/db/schema";

import { updateKbEntryBody } from "./actions";

export type KnowledgeListEntry = {
  id: string;
  entryKey: string;
  title: string;
  body: string;
  answerMode: AnswerMode;
  status: KbStatus;
};

export function KnowledgeList({
  slug,
  entries,
  archivedClinic,
}: {
  slug: string;
  entries: KnowledgeListEntry[];
  archivedClinic: boolean;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.body.toLowerCase().includes(q) ||
        entry.entryKey.toLowerCase().includes(q),
    );
  }, [entries, query]);

  function save(entryId: string) {
    setMessage(null);
    start(async () => {
      const result = await updateKbEntryBody(slug, entryId, draft);
      if (result && "error" in result) setMessage(result.error);
      else {
        setEditingId(null);
        setMessage("Saved. Waiting for review before the model can use it.");
      }
    });
  }

  return (
    <div>
      <label className="mb-3 block">
        <span className="sr-only">Search title and body</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title and body"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        />
      </label>

      {message && (
        <p className="mb-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
          {message}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-600">
          Nothing matches.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-300 bg-white">
          {filtered.map((entry) => {
            const mode = ANSWER_MODE_CHOICES.find(
              (c) => c.value === entry.answerMode,
            );
            const open = editingId === entry.id;
            const canEdit =
              !archivedClinic && entry.status !== "archived";
            return (
              <li key={entry.id} className="px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-neutral-500">
                      {entry.entryKey}
                    </p>
                  </div>
                  <p className="text-sm text-neutral-600 sm:text-right">
                    {modeTitle(entry.answerMode, mode?.title)}
                  </p>
                </div>

                {open ? (
                  <div className="mt-3">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-neutral-300 p-2 text-sm focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => save(entry.id)}
                        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40"
                      >
                        {pending ? "Saving..." : "Save body"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                    {entry.body}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {canEdit && !open && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(entry.id);
                        setDraft(entry.body);
                        setMessage(null);
                      }}
                      className="text-neutral-900 underline underline-offset-2 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    >
                      Edit body
                    </button>
                  )}
                  <Link
                    href={`/clinics/${slug}/knowledge/${entry.id}`}
                    className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                  >
                    Open entry
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function modeTitle(mode: AnswerMode, title: string | undefined): string {
  return title ?? mode;
}
