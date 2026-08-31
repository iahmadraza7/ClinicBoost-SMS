import type {
  AnswerMode,
  KbCategory,
  KbEntry,
  KbSource,
  KbStatus,
} from "../db/schema";
import { findBlockedTerms } from "../validation/blocked-terms";
import { parseCsv } from "./csv";
import { entryKeySchema } from "./fields";

const CATEGORIES = new Set<KbCategory>([
  "config",
  "offer",
  "policy",
  "faq",
  "booking",
]);
const STATUSES = new Set<KbStatus>(["active", "pending_review", "archived"]);
const ANSWER_MODES = new Set<AnswerMode>([
  "answerable",
  "blocked",
  "missing",
]);
const SOURCES = new Set<KbSource>([
  "imported",
  "operator_edit",
  "operator_answer",
]);

export type KbTransferRow = {
  entry_key: string;
  category: KbCategory;
  title: string;
  body: string;
  status: KbStatus;
  answer_mode: AnswerMode;
  block_deflect: string | null;
  trigger_terms: string[];
  source: KbSource;
  offer_id: string | null;
  source_draft_id: string | null;
};

export type KbPlanRow = KbTransferRow & {
  action: "create" | "update" | "skip";
  reason?: string;
  entryId?: string;
};

export type KbImportPlan = {
  created: KbPlanRow[];
  updated: KbPlanRow[];
  skipped: KbPlanRow[];
};

const HEADERS = [
  "entry_key",
  "category",
  "title",
  "body",
  "status",
  "answer_mode",
  "block_deflect",
  "trigger_terms",
  "source",
  "offer_id",
  "source_draft_id",
] as const;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toTransferRow(entry: KbEntry): KbTransferRow {
  return {
    entry_key: entry.entryKey,
    category: entry.category,
    title: entry.title,
    body: entry.body,
    status: entry.status,
    answer_mode: entry.answerMode,
    block_deflect: entry.blockDeflect,
    trigger_terms: [...entry.triggerTerms],
    source: entry.source,
    offer_id: entry.offerId,
    source_draft_id: entry.sourceDraftId,
  };
}

export function exportKbJson(entries: KbEntry[]): string {
  return `${JSON.stringify(entries.map(toTransferRow), null, 2)}\n`;
}

export function exportKbCsv(entries: KbEntry[]): string {
  const lines = [HEADERS.join(",")];
  for (const entry of entries) {
    const row = toTransferRow(entry);
    lines.push(
      [
        row.entry_key,
        row.category,
        row.title,
        row.body,
        row.status,
        row.answer_mode,
        row.block_deflect ?? "",
        row.trigger_terms.join("|"),
        row.source,
        row.offer_id ?? "",
        row.source_draft_id ?? "",
      ]
        .map((cell) => csvEscape(cell))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function sameTerms(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((v, i) => v === right[i]);
}

export function transferEquals(
  incoming: KbTransferRow,
  existing: KbEntry,
): boolean {
  return (
    incoming.entry_key === existing.entryKey &&
    incoming.category === existing.category &&
    incoming.title === existing.title &&
    incoming.body === existing.body &&
    incoming.status === existing.status &&
    incoming.answer_mode === existing.answerMode &&
    (incoming.block_deflect ?? null) === (existing.blockDeflect ?? null) &&
    sameTerms(incoming.trigger_terms, existing.triggerTerms) &&
    incoming.source === existing.source &&
    (incoming.offer_id ?? null) === (existing.offerId ?? null) &&
    (incoming.source_draft_id ?? null) === (existing.sourceDraftId ?? null)
  );
}

function asEnum<T extends string>(
  value: string,
  allowed: Set<T>,
  label: string,
): T | { error: string } {
  if (allowed.has(value as T)) return value as T;
  return { error: `${label} "${value}" is not valid` };
}

function parseTriggerCell(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof raw !== "string" || raw.trim() === "") return [];
  return raw
    .split(/[|,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseTransferRow(
  raw: Record<string, unknown>,
  line: number,
): KbTransferRow | { error: string; line: number } {
  const keyParsed = entryKeySchema.safeParse(String(raw.entry_key ?? "").trim());
  if (!keyParsed.success) {
    return {
      error: keyParsed.error.issues[0]?.message ?? "Invalid key",
      line,
    };
  }

  const category = asEnum(String(raw.category ?? ""), CATEGORIES, "category");
  if (typeof category === "object") return { ...category, line };

  const answer = asEnum(
    String(raw.answer_mode ?? ""),
    ANSWER_MODES,
    "answer_mode",
  );
  if (typeof answer === "object") return { ...answer, line };

  const statusRaw = String(raw.status ?? "pending_review").trim() || "pending_review";
  const status = asEnum(statusRaw, STATUSES, "status");
  if (typeof status === "object") return { ...status, line };

  const sourceRaw = String(raw.source ?? "imported").trim() || "imported";
  const source = asEnum(sourceRaw, SOURCES, "source");
  if (typeof source === "object") return { ...source, line };

  const title = String(raw.title ?? "").trim();
  const body = String(raw.body ?? "").trim();
  if (!title) return { error: "title is required", line };
  if (!body) return { error: "body is required", line };

  const offer = String(raw.offer_id ?? "").trim();
  const draft = String(raw.source_draft_id ?? "").trim();
  const deflect = String(raw.block_deflect ?? "").trim();

  return {
    entry_key: keyParsed.data,
    category,
    title,
    body,
    status,
    answer_mode: answer,
    block_deflect: deflect === "" ? null : deflect,
    trigger_terms: parseTriggerCell(raw.trigger_terms),
    source,
    offer_id: offer === "" ? null : offer,
    source_draft_id: draft === "" ? null : draft,
  };
}

export function parseKbJson(
  text: string,
): { rows: KbTransferRow[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "That file is not valid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { error: "JSON must be an array of knowledge base rows" };
  }

  const rows: KbTransferRow[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item || typeof item !== "object") {
      return { error: `Row ${i + 1} is not an object` };
    }
    const row = parseTransferRow(item as Record<string, unknown>, i + 1);
    if ("error" in row) return { error: `Row ${row.line}: ${row.error}` };
    rows.push(row);
  }
  return { rows };
}

export function parseKbCsv(
  text: string,
): { rows: KbTransferRow[] } | { error: string } {
  const table = parseCsv(text);
  if (table.length === 0) return { error: "The CSV is empty" };

  const header = table[0].map((h) =>
    h.toLowerCase().trim().replace(/\s+/g, "_"),
  );
  const idx = (name: string) => header.indexOf(name);
  if (idx("entry_key") < 0 || idx("title") < 0 || idx("body") < 0) {
    return {
      error: "The CSV needs columns for entry_key, title and body",
    };
  }

  const rows: KbTransferRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    if (cells.every((c) => c.trim() === "")) continue;
    const raw: Record<string, unknown> = {};
    for (const name of HEADERS) {
      const at = idx(name);
      raw[name] = at >= 0 ? (cells[at] ?? "") : "";
    }
    const row = parseTransferRow(raw, i + 1);
    if ("error" in row) return { error: `Line ${row.line}: ${row.error}` };
    rows.push(row);
  }
  return { rows };
}

export function planKbImport(
  incoming: KbTransferRow[],
  existing: KbEntry[],
  offerIds: Set<string>,
  blockedTerms: { term: string; reason: string }[],
  draftIds: Set<string> = new Set(),
): KbImportPlan {
  const byKey = new Map(existing.map((e) => [e.entryKey, e]));
  const seen = new Set<string>();
  const created: KbPlanRow[] = [];
  const updated: KbPlanRow[] = [];
  const skipped: KbPlanRow[] = [];

  for (const row of incoming) {
    if (seen.has(row.entry_key)) {
      skipped.push({
        ...row,
        action: "skip",
        reason: "duplicate entry_key in this file",
      });
      continue;
    }
    seen.add(row.entry_key);

    const hits = findBlockedTerms(
      `${row.title}\n${row.body}\n${row.block_deflect ?? ""}`,
      blockedTerms,
    );
    if (hits.length > 0) {
      skipped.push({
        ...row,
        action: "skip",
        reason: `blocked term: ${hits.map((h) => h.term).join(", ")}`,
      });
      continue;
    }

    if (row.offer_id && !offerIds.has(row.offer_id)) {
      skipped.push({
        ...row,
        action: "skip",
        reason: "offer_id is not an offer for this clinic",
      });
      continue;
    }

    if (row.source_draft_id && !draftIds.has(row.source_draft_id)) {
      skipped.push({
        ...row,
        action: "skip",
        reason: "source_draft_id is not a draft for this clinic",
      });
      continue;
    }

    const current = byKey.get(row.entry_key);
    if (!current) {
      created.push({ ...row, action: "create" });
      continue;
    }
    if (transferEquals(row, current)) {
      skipped.push({
        ...row,
        action: "skip",
        reason: "unchanged",
        entryId: current.id,
      });
      continue;
    }
    updated.push({ ...row, action: "update", entryId: current.id });
  }

  return { created, updated, skipped };
}
