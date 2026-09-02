"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { formatAuMobile } from "@/lib/mobile";
import { countSegments } from "@/lib/segments";
import type { CloseType, ValidationResult } from "@/server/db/schema";
import {
  approveDraft,
  dismissDraft,
  redraftDraft,
  revalidateDraft,
  saveEditDraft,
} from "./actions";

export type QueueRow = {
  draftId: string;
  clinicId: string;
  conversationId: string;
  draftBody: string;
  editedBody: string | null;
  validationResult: ValidationResult | null;
  selfConfidence: number;
  createdAt: string;
  receivedTime: string;
  receivedDateTime: string;
  question: string;
  contactName: string | null;
  contactMobile: string;
  clinicName: string;
  clinicSlug: string;
  closeType: CloseType | null;
  killSwitch: boolean;
};

const SHORTCUTS = [
  ["j / k", "move"],
  ["r", "redraft"],
  ["a", "approve"],
  ["e", "edit"],
  ["d", "dismiss"],
  ["v", "re-validate"],
  ["Ctrl+Enter", "save edit"],
  ["Esc", "cancel"],
];

export function QueueList({
  rows,
  maxSegments,
}: {
  rows: QueueRow[];
  maxSegments: number;
}) {
  const [selected, setSelected] = useState(0);
  const [editing, setEditing] = useState(false);
  const [redrafting, setRedrafting] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [redraftNote, setRedraftNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const redraftRef = useRef<HTMLTextAreaElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const index = Math.min(selected, Math.max(rows.length - 1, 0));
  const row = rows[index];
  const displayed = row?.editedBody ?? row?.draftBody ?? "";

  useEffect(() => {
    itemRefs.current[index]?.scrollIntoView({ block: "nearest" });
  }, [index]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (redrafting) redraftRef.current?.focus();
  }, [redrafting]);

  useEffect(() => {
    setNote(null);
    setMessage(null);
    setEditing(false);
    setRedrafting(false);
    setRedraftNote("");
  }, [row?.draftId]);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage(null);
    setNote(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setMessage(result.error ?? "Something went wrong");
      else {
        setEditing(false);
        setRedrafting(false);
      }
    });
  }

  function revalidate() {
    if (!row) return;
    setMessage(null);
    setNote(null);
    startTransition(async () => {
      const result = await revalidateDraft({
        clinicId: row.clinicId,
        draftId: row.draftId,
      });
      if (!result.ok) setMessage(result.error ?? "Something went wrong");
      else if (result.passed) {
        setNote("All checks pass now. Approve to send.");
      }
    });
  }

  function approve() {
    if (!row) return;
    run(() => approveDraft({ clinicId: row.clinicId, draftId: row.draftId }));
  }

  function dismiss() {
    if (!row) return;
    run(() => dismissDraft({ clinicId: row.clinicId, draftId: row.draftId }));
  }

  function saveEdit() {
    if (!row) return;
    startTransition(async () => {
      setMessage(null);
      const result = await saveEditDraft({
        clinicId: row.clinicId,
        draftId: row.draftId,
        body: editValue,
      });
      if (!result.ok) setMessage(result.error ?? "Something went wrong");
      else {
        setEditing(false);
        setNote("Saved. The item is still pending. Approve to send.");
      }
    });
  }

  function submitRedraft() {
    if (!row) return;
    run(() =>
      redraftDraft({
        clinicId: row.clinicId,
        draftId: row.draftId,
        note: redraftNote,
      }),
    );
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (editing || redrafting || pending) return;

      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      switch (event.key) {
        case "j":
        case "ArrowDown":
          event.preventDefault();
          setSelected((i) => Math.min(i + 1, rows.length - 1));
          break;
        case "k":
        case "ArrowUp":
          event.preventDefault();
          setSelected((i) => Math.max(i - 1, 0));
          break;
        case "a":
          event.preventDefault();
          approve();
          break;
        case "r":
          event.preventDefault();
          setRedrafting(true);
          setRedraftNote("");
          break;
        case "d":
          event.preventDefault();
          dismiss();
          break;
        case "e":
          event.preventDefault();
          if (row) {
            setEditValue(displayed);
            setEditing(true);
          }
          break;
        case "v":
          event.preventDefault();
          revalidate();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, redrafting, pending, rows.length, row?.draftId, displayed]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
        <p className="text-sm text-neutral-600">
          No drafts waiting. Submit an enquiry through a clinic widget and it
          will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <ul className="max-h-[70vh] overflow-y-auto rounded-lg border border-neutral-300 bg-white">
        {rows.map((r, i) => (
          <li
            key={r.draftId}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelected(i);
                setEditing(false);
                setRedrafting(false);
              }}
              className={`w-full border-b border-neutral-200 px-3 py-2.5 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900 ${
                i === index ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium">
                  {r.clinicSlug}
                </span>
                <time
                  className={`shrink-0 text-[11px] ${
                    i === index ? "text-neutral-300" : "text-neutral-500"
                  }`}
                  dateTime={r.createdAt}
                  title={r.receivedDateTime}
                >
                  {r.receivedTime}
                </time>
              </div>
              <p
                className={`mt-1 line-clamp-2 text-xs ${
                  i === index ? "text-neutral-200" : "text-neutral-600"
                }`}
              >
                {r.question}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <section className="rounded-lg border border-neutral-300 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-neutral-900">{row.clinicName}</span>
          <Chip
            tone={
              row.closeType === "manual"
                ? "amber"
                : row.closeType === "link_only"
                  ? "neutral"
                  : "amber"
            }
          >
            {row.closeType === "manual"
              ? "person confirms"
              : row.closeType === "link_only"
                ? "customer books"
                : "close not set"}
          </Chip>
          {row.killSwitch && <Chip tone="red">kill switch on</Chip>}
          {row.editedBody && <Chip tone="neutral">edited, not sent</Chip>}
        </div>

        <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-neutral-500">From</dt>
          <dd className="text-neutral-900">
            {row.contactName ?? "Unknown"}{" "}
            <span className="text-neutral-500">
              {formatAuMobile(row.contactMobile)}
            </span>
          </dd>
          <dt className="text-neutral-500">Received</dt>
          <dd className="text-neutral-900">{row.receivedDateTime}</dd>
          <dt className="text-neutral-500">Asked</dt>
          <dd className="whitespace-pre-wrap text-neutral-900">
            {row.question}
          </dd>
        </dl>

        <Failures result={row.validationResult} />

        <div className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Draft reply
          </h2>
          {editing ? (
            <Editor
              ref={textareaRef}
              value={editValue}
              maxSegments={maxSegments}
              onChange={setEditValue}
              onCancel={() => setEditing(false)}
              onSave={saveEdit}
              disabled={pending}
            />
          ) : (
            <p className="mt-2 whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-900">
              {displayed}
            </p>
          )}
        </div>

        {redrafting && (
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              What was wrong
              <textarea
                ref={redraftRef}
                value={redraftNote}
                disabled={pending}
                onChange={(e) => setRedraftNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setRedrafting(false);
                  }
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    submitRedraft();
                  }
                }}
                rows={3}
                placeholder="Short note for the next draft. This is correction context, not a fact to send."
                className="mt-2 w-full rounded-md border border-neutral-300 p-3 text-sm focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <Action onClick={submitRedraft} disabled={pending || !redraftNote.trim()}>
                Generate new draft
              </Action>
              <Action
                onClick={() => setRedrafting(false)}
                disabled={pending}
              >
                Cancel
              </Action>
            </div>
          </div>
        )}

        {note && (
          <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {note}
          </p>
        )}

        {message && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Action
            onClick={() => {
              setRedrafting(true);
              setRedraftNote("");
            }}
            disabled={pending || editing || redrafting}
          >
            Redraft <Key>r</Key>
          </Action>
          <Action onClick={approve} disabled={pending || editing || redrafting}>
            Approve <Key>a</Key>
          </Action>
          <Action
            onClick={() => {
              setEditValue(displayed);
              setEditing(true);
            }}
            disabled={pending || editing || redrafting}
          >
            Edit <Key>e</Key>
          </Action>
          <Action
            onClick={dismiss}
            disabled={pending || editing || redrafting}
            tone="danger"
          >
            Dismiss <Key>d</Key>
          </Action>
          <Action onClick={revalidate} disabled={pending || editing || redrafting}>
            Re-validate <Key>v</Key>
          </Action>
        </div>

        <footer className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-200 pt-3 text-[11px] text-neutral-500">
          {SHORTCUTS.map(([key, label]) => (
            <span key={key}>
              <Key>{key}</Key> {label}
            </span>
          ))}
        </footer>
      </section>
    </div>
  );
}

function Editor({
  ref,
  value,
  maxSegments,
  onChange,
  onCancel,
  onSave,
  disabled,
}: {
  ref: React.Ref<HTMLTextAreaElement>;
  value: string;
  maxSegments: number;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  disabled: boolean;
}) {
  const info = countSegments(value);
  const over = info.segments > maxSegments;

  return (
    <div className="mt-2">
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSave();
          }
        }}
        rows={5}
        className="w-full rounded-md border border-neutral-300 p-3 text-sm focus-visible:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
        <span className={over ? "font-medium text-red-600" : "text-neutral-500"}>
          {info.segments} segment{info.segments === 1 ? "" : "s"} of{" "}
          {maxSegments}, {info.units} chars, {info.remaining} left
        </span>
        {info.encoding === "ucs2" && (
          <span className="font-medium text-amber-700">
            {info.offendingChars.join(" ")} forces UCS-2 and halves capacity
          </span>
        )}
        <span className="text-neutral-500">
          Ctrl+Enter saves and leaves this pending. Approve is a second step.
        </span>
      </div>
    </div>
  );
}

/**
 * The same code can fire more than once, for example one SENTENCE_UNCOVERED per
 * unsourced sentence. Group them so the operator scans codes, not repeats, and
 * keep every detail in the tooltip.
 */
function Failures({ result }: { result: ValidationResult | null }) {
  if (!result || result.failures.length === 0) return null;

  const grouped = new Map<string, string[]>();
  for (const failure of result.failures) {
    grouped.set(failure.code, [
      ...(grouped.get(failure.code) ?? []),
      failure.detail,
    ]);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {[...grouped].map(([code, details]) => (
        <span
          key={code}
          title={details.join("\n")}
          className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] text-amber-900"
        >
          {code}
          {details.length > 1 && ` ×${details.length}`}
        </span>
      ))}
    </div>
  );
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
    amber: "border-amber-200 bg-amber-100 text-amber-800",
    red: "border-red-200 bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Action({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-40 ${
        tone === "danger"
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-neutral-300 text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1 font-mono text-[10px] text-neutral-600">
      {children}
    </kbd>
  );
}
