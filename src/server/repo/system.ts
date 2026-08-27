import { sql } from "drizzle-orm";

import { exec, type Executor } from "./executor";

const SWEEP_QUEUE = "unattended-sweep";

function isMissingRelation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "42P01" || code === "3F000";
}

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && "rows" in result) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** Throws if Postgres is not answering. */
export async function pingDatabase(tx?: Executor): Promise<void> {
  await exec(tx).execute(sql`select 1`);
}

/**
 * When the worker last finished the every-minute sweep. Null if the queue
 * schema is missing or the sweep has never completed.
 */
export async function lastSweepCompletedAt(
  tx?: Executor,
): Promise<Date | null> {
  try {
    const result = await exec(tx).execute(sql`
      select max(completed_on) as last_at
      from pgboss.job
      where name = ${SWEEP_QUEUE}
    `);
    return asDate(rowsOf<{ last_at: unknown }>(result)[0]?.last_at);
  } catch (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
}

/** True once the worker has registered its schedule at least once. */
export async function sweepIsScheduled(tx?: Executor): Promise<boolean> {
  try {
    const result = await exec(tx).execute(sql`
      select 1 as ok
      from pgboss.schedule
      where name = ${SWEEP_QUEUE}
      limit 1
    `);
    return rowsOf(result).length > 0;
  } catch (error) {
    if (isMissingRelation(error)) return false;
    throw error;
  }
}
