export const AUDIT_ACTIONS = [
  "clinic.created",
  "clinic.updated",
  "clinic.archived",
  "clinic.restored",
  "clinic.voice_reviewed",
  "clinic.seeded",
  "kb.created",
  "kb.updated",
  "kb.reviewed",
  "kb.archived",
  "kb.restored",
  "kb.csv_imported",
  "kb.imported",
  "kb.discarded",
  "draft.created",
  "draft.ai_unavailable",
  "draft.revalidated",
  "draft.approved",
  "draft.edited",
  "draft.rejected",
  "draft.dismissed",
  "draft.redrafted",
  "draft.reverted",
  "enquiry.received",
  "enquiry.enqueue_failed",
  "contact.opted_out",
  "sms.sent",
  "sms.failed",
  "sms.rejected",
  "sms.gave_up",
  "sms.enqueue_failed",
  "sms.queued",
  "sms.delivered",
  "notify.emailed",
  "notify.email_skipped",
  "notify.email_failed",
  "notify.email_gave_up",
  "notify.sms_skipped",
  "notify.sms_enqueued",
  "inbound.routed_by_fallback",
] as const;

export function auditDetail(action: string, after: unknown): string {
  if (!after || typeof after !== "object") return "";
  const row = after as Record<string, unknown>;

  if (action === "kb.csv_imported" || action === "kb.imported") {
    return `created ${row.created ?? 0}, updated ${row.updated ?? 0}, skipped ${row.skipped ?? 0}`;
  }

  if (action === "draft.redrafted" && typeof row.note === "string") {
    return row.note;
  }

  if (action === "draft.reverted" && typeof row.restored === "string") {
    return `restored ${row.restored}`;
  }

  if (Array.isArray(row.failures) && row.failures.length > 0) {
    const codes = row.failures.filter((f) => typeof f === "string");
    if (codes.length > 0) return codes.join(", ");
  }

  if (typeof row.passed === "boolean") {
    return row.passed ? "passed" : "queued";
  }

  if (typeof row.via === "string") {
    return row.via;
  }

  return "";
}
