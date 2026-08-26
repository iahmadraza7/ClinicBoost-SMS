import { and, eq, sql } from "drizzle-orm";

import { usageCounters, type UsageCounter } from "../db/schema";
import { exec, type Executor } from "./executor";

/** Australian months. The operator reads these against the SMS credit balance. */
export function currentPeriodMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

/** Always the current month. Reading a past month is what getUsage is for. */
export async function incrementUsage(
  clinicId: string,
  delta: { segmentsOut?: number; segmentsIn?: number; aiCalls?: number },
  tx?: Executor,
): Promise<void> {
  const out = delta.segmentsOut ?? 0;
  const inbound = delta.segmentsIn ?? 0;
  const calls = delta.aiCalls ?? 0;

  await exec(tx)
    .insert(usageCounters)
    .values({
      clinicId,
      periodMonth: currentPeriodMonth(),
      segmentsOut: out,
      segmentsIn: inbound,
      aiCalls: calls,
    })
    .onConflictDoUpdate({
      target: [usageCounters.clinicId, usageCounters.periodMonth],
      set: {
        segmentsOut: sql`${usageCounters.segmentsOut} + ${out}`,
        segmentsIn: sql`${usageCounters.segmentsIn} + ${inbound}`,
        aiCalls: sql`${usageCounters.aiCalls} + ${calls}`,
        updatedAt: new Date(),
      },
    });
}

export async function getUsage(
  clinicId: string,
  periodMonth = currentPeriodMonth(),
  tx?: Executor,
): Promise<UsageCounter | null> {
  const [row] = await exec(tx)
    .select()
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.clinicId, clinicId),
        eq(usageCounters.periodMonth, periodMonth),
      ),
    )
    .limit(1);
  return row ?? null;
}
