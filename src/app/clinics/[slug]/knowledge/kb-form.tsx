"use client";

import { useActionState, useState } from "react";

import {
  ANSWER_MODE_CHOICES,
  KB_CATEGORIES,
  triggerTermsText,
} from "@/server/kb/fields";
import type { AnswerMode, KbCategory } from "@/server/db/schema";
import {
  createKbEntry,
  updateKbEntry,
  type KbActionState,
} from "./actions";

export type KbFormValues = {
  id: string;
  entryKey: string;
  category: KbCategory;
  title: string;
  body: string;
  answerMode: AnswerMode;
  blockDeflect: string | null;
  triggerTerms: string[];
  status: string;
};

export function KbForm({
  slug,
  clinicSlug,
  mode,
  entry,
}: {
  slug: string;
  clinicSlug: string;
  mode: "create" | "edit";
  entry?: KbFormValues;
}) {
  const action =
    mode === "create"
      ? createKbEntry.bind(null, slug)
      : updateKbEntry.bind(null, slug, entry?.id ?? "");

  const [state, formAction, pending] = useActionState<KbActionState, FormData>(
    action,
    null,
  );
  const [answerMode, setAnswerMode] = useState<AnswerMode>(
    entry?.answerMode ?? "answerable",
  );

  return (
    <form action={formAction} className="space-y-8">
      {mode === "create" ? (
        <Field
          label="Key"
          hint="What the model cites as a source. Lowercase, dots and hyphens. Cannot be changed later."
        >
          <input
            name="entryKey"
            required
            autoComplete="off"
            defaultValue={`${clinicSlug}.`}
            placeholder={`${clinicSlug}.hifu-499.duration`}
            className={inputClass}
          />
        </Field>
      ) : (
        <p className="text-sm text-neutral-600">
          Key{" "}
          <span className="font-mono text-neutral-900">{entry?.entryKey}</span>
          <span className="text-neutral-500"> (cannot be changed)</span>
        </p>
      )}

      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={entry?.title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field
        label="Category"
      >
        <select
          name="category"
          required
          defaultValue={entry?.category ?? "faq"}
          className={inputClass}
        >
          {KB_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">
          How this entry is used
        </legend>
        <p className="mt-0.5 text-sm text-neutral-600">
          The model only sees reviewed, active entries. Saving always waits for
          review.
        </p>
        <div className="mt-3 space-y-2">
          {ANSWER_MODE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <input
                type="radio"
                name="answerMode"
                value={choice.value}
                defaultChecked={
                  (entry?.answerMode ?? "answerable") === choice.value
                }
                onChange={() => setAnswerMode(choice.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">
                  {choice.title}
                </span>
                <span className="mt-1 block text-sm text-neutral-600">
                  {choice.consequence}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Body"
        hint="The fact itself. Checked against this clinic's blocked terms on save."
      >
        <textarea
          name="body"
          required
          rows={6}
          defaultValue={entry?.body ?? ""}
          className={inputClass}
        />
      </Field>

      {answerMode === "blocked" && (
        <>
          <Field
            label="Deflect message"
            hint="What to say instead of answering. This can go out as an SMS, so no personal data and no Schedule 4 names."
          >
            <textarea
              name="blockDeflect"
              required
              rows={3}
              defaultValue={entry?.blockDeflect ?? ""}
              className={inputClass}
            />
          </Field>

          <Field
            label="Trigger terms"
            hint="One phrase per line. The validator uses these to tell that the customer asked about this topic."
          >
            <textarea
              name="triggerTerms"
              required
              rows={5}
              defaultValue={triggerTermsText(entry?.triggerTerms ?? [])}
              placeholder={"opening hours\nare you open"}
              className={inputClass}
            />
          </Field>
        </>
      )}

      {answerMode !== "blocked" && (
        <>
          <input type="hidden" name="blockDeflect" value="" />
          <input type="hidden" name="triggerTerms" value="" />
        </>
      )}

      {state && "error" in state && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state && "saved" in state && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved. Waiting for review before the model can use it.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 disabled:opacity-40"
      >
        {pending
          ? "Saving..."
          : mode === "create"
            ? "Create entry"
            : "Save changes"}
      </button>
    </form>
  );
}

const inputClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-neutral-900">{label}</span>
      {hint && <span className="mt-0.5 block text-neutral-600">{hint}</span>}
      {children}
    </label>
  );
}
