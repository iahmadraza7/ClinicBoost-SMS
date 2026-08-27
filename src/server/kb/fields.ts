import { z } from "zod";

import type { AnswerMode, KbCategory, KbEntry } from "../db/schema";
import { findBlockedTerms } from "../validation/blocked-terms";

/**
 * The operator is picking what the model is allowed to do with this fact, not
 * a schema label. Same treatment as close_type: the consequence is written out
 * on the choice itself.
 */
export const ANSWER_MODE_CHOICES: {
  value: AnswerMode;
  title: string;
  consequence: string;
}[] = [
  {
    value: "answerable",
    title: "Can be cited and sent",
    consequence:
      "Once reviewed, the model may use this as a source and a fully grounded draft may auto-send.",
  },
  {
    value: "blocked",
    title: "Never attempt, always queue",
    consequence:
      "Do not answer this topic. The model must deflect with the text you write below. The draft always waits in the queue. Needs trigger terms so the validator can tell the topic came up.",
  },
  {
    value: "missing",
    title: "Known gap, flag as unanswerable",
    consequence:
      "This is absent from the knowledge base on purpose. The model must not guess. The enquiry is flagged unanswerable and the operator's later answer is stored.",
  },
];

export const KB_CATEGORIES: { value: KbCategory; label: string }[] = [
  { value: "config", label: "Clinic config" },
  { value: "offer", label: "Offer" },
  { value: "policy", label: "Policy" },
  { value: "faq", label: "FAQ" },
  { value: "booking", label: "Booking" },
];

export const KB_CATEGORY_ORDER: KbCategory[] = KB_CATEGORIES.map((c) => c.value);

/**
 * Operator writes never go live on save. A separate review is what makes an
 * entry usable by the model, in case something wrong would poison the
 * knowledge base.
 */
export const OPERATOR_SAVE_STATUS = "pending_review" as const;

export const entryKeySchema = z
  .string()
  .trim()
  .min(3, "Key is at least 3 characters")
  .max(120, "Key is at most 120 characters")
  .regex(
    /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/,
    "Key is lowercase letters, numbers, dots and hyphens, e.g. beauty-soiree.hifu-499.duration",
  );

const kbFieldsObject = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(4000),
  category: z.enum(["config", "offer", "policy", "faq", "booking"], {
    message: "Pick a category",
  }),
  answerMode: z.enum(["answerable", "blocked", "missing"], {
    message: "Pick how this entry is used",
  }),
  blockDeflect: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === "" ? null : v)),
  triggerTerms: z.array(z.string()),
});

export const kbFieldsSchema = kbFieldsObject.superRefine((data, ctx) => {
  if (data.answerMode !== "blocked") return;

  if (!data.blockDeflect) {
    ctx.addIssue({
      code: "custom",
      message:
        "Blocked entries need a deflect message: what to say instead of answering",
      path: ["blockDeflect"],
    });
  }
  if (data.triggerTerms.length === 0) {
    ctx.addIssue({
      code: "custom",
      message:
        "Blocked entries need trigger terms so the validator can tell the topic came up",
      path: ["triggerTerms"],
    });
  }
});

export type KbFields = z.infer<typeof kbFieldsSchema>;
export type CreateKbFields = KbFields & { entryKey: string };

export function parseTriggerTerms(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function triggerTermsText(terms: string[]): string {
  return terms.join("\n");
}

export function kbTextForBlockedCheck(fields: {
  title: string;
  body: string;
  blockDeflect: string | null;
}): string {
  return [fields.title, fields.body, fields.blockDeflect ?? ""].join("\n");
}

/**
 * The client's own offer copy carries Schedule 4 category terms. Catch them
 * on save so they cannot be cited as a legitimate source.
 */
export function kbBlockedTermError(
  text: string,
  terms: { term: string; reason: string }[],
): string | null {
  const hits = findBlockedTerms(text, terms);
  if (hits.length === 0) return null;
  const listed = hits.map((h) => `"${h.term}"`).join(", ");
  return `This entry contains blocked terms: ${listed}. Schedule 4 names cannot go in the knowledge base.`;
}

function fieldsFromValues(values: {
  title: unknown;
  body: unknown;
  category: unknown;
  answerMode: unknown;
  blockDeflect: unknown;
  triggerTerms: string[];
}) {
  const parsed = kbFieldsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }

  const fields = parsed.data;
  if (fields.answerMode !== "blocked") {
    return {
      fields: {
        ...fields,
        blockDeflect: null,
        triggerTerms: fields.answerMode === "missing" ? fields.triggerTerms : [],
      },
    };
  }
  return { fields };
}

export function kbFieldsFromForm(form: FormData): {
  fields?: KbFields;
  error?: string;
} {
  return fieldsFromValues({
    title: form.get("title"),
    body: form.get("body") ?? "",
    category: form.get("category"),
    answerMode: form.get("answerMode"),
    blockDeflect: form.get("blockDeflect") ?? "",
    triggerTerms: parseTriggerTerms(String(form.get("triggerTerms") ?? "")),
  });
}

export function createKbFieldsFromForm(form: FormData): {
  fields?: CreateKbFields;
  error?: string;
} {
  const base = kbFieldsFromForm(form);
  if (!base.fields) return { error: base.error ?? "Invalid entry" };

  const keyParsed = entryKeySchema.safeParse(form.get("entryKey"));
  if (!keyParsed.success) {
    return { error: keyParsed.error.issues[0]?.message ?? "Invalid key" };
  }

  return { fields: { ...base.fields, entryKey: keyParsed.data } };
}

/** What a create or edit writes. Never `active`. */
export function operatorSaveMeta() {
  return {
    status: OPERATOR_SAVE_STATUS,
    source: "operator_edit" as const,
    reviewedBy: null,
    reviewedAt: null,
  };
}

export function reviewMeta(actor: string, at = new Date()) {
  return {
    status: "active" as const,
    reviewedBy: actor,
    reviewedAt: at,
  };
}

/**
 * A clinic with nothing in blocked or missing has no do-not-answer coverage.
 * Nine of the eleven clinics are in that state. Surface it; do not invent the
 * entries.
 */
export function hasDoNotAnswerCoverage(
  entries: { answerMode: string; status: string }[],
): boolean {
  return entries.some(
    (e) =>
      e.status !== "archived" &&
      (e.answerMode === "blocked" || e.answerMode === "missing"),
  );
}

export const DO_NOT_ANSWER_GAP =
  "Nothing is being blocked for this clinic. There are no blocked or missing entries, so known do-not-answer topics will not be caught. Write those entries here. They are not generated for you.";

export function kbAuditShape(entry: Pick<
  KbEntry,
  | "entryKey"
  | "category"
  | "title"
  | "body"
  | "status"
  | "answerMode"
  | "blockDeflect"
  | "triggerTerms"
  | "source"
  | "reviewedBy"
  | "reviewedAt"
>) {
  return {
    entry_key: entry.entryKey,
    category: entry.category,
    title: entry.title,
    body: entry.body,
    status: entry.status,
    answer_mode: entry.answerMode,
    block_deflect: entry.blockDeflect,
    trigger_terms: entry.triggerTerms,
    source: entry.source,
    reviewed_by: entry.reviewedBy,
    reviewed_at: entry.reviewedAt?.toISOString() ?? null,
  };
}
