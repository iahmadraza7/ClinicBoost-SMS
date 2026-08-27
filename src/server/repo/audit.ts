import { and, desc, eq } from "drizzle-orm";

import { auditLog, type AuditLogRow } from "../db/schema";
import { exec, type Executor } from "./executor";

/**
 * Every approve, edit, reject, send, knowledge base change, threshold change,
 * kill switch toggle and clinic create goes through here. Pass the same
 * transaction as the write it describes.
 */
export async function recordAudit(
  clinicId: string,
  entry: {
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  },
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .insert(auditLog)
    .values({
      clinicId,
      actor: entry.actor,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
}

export async function listAudit(
  clinicId: string,
  options: { limit?: number; action?: string } = {},
  tx?: Executor,
): Promise<AuditLogRow[]> {
  const limit = options.limit ?? 200;
  const action = options.action?.trim();
  const scope = action
    ? and(eq(auditLog.clinicId, clinicId), eq(auditLog.action, action))
    : eq(auditLog.clinicId, clinicId);

  return exec(tx)
    .select()
    .from(auditLog)
    .where(scope)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
