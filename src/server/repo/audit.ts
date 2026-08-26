import { desc, eq } from "drizzle-orm";

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
  limit = 200,
  tx?: Executor,
): Promise<AuditLogRow[]> {
  return exec(tx)
    .select()
    .from(auditLog)
    .where(eq(auditLog.clinicId, clinicId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
