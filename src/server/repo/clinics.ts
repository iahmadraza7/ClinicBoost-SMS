import { asc, eq } from "drizzle-orm";

import { clinics, type Clinic, type NewClinic } from "../db/schema";
import { exec, type Executor } from "./executor";

/**
 * `clinics` is the tenancy root, not a tenant-scoped domain table, so these are
 * the only functions in the repository layer that do not take a clinicId first.
 * Everything downstream of a clinic lookup does.
 */

export async function listClinics(tx?: Executor): Promise<Clinic[]> {
  return exec(tx).select().from(clinics).orderBy(asc(clinics.name));
}

export async function getClinicBySlug(
  slug: string,
  tx?: Executor,
): Promise<Clinic | null> {
  const [row] = await exec(tx)
    .select()
    .from(clinics)
    .where(eq(clinics.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getClinic(
  clinicId: string,
  tx?: Executor,
): Promise<Clinic | null> {
  const [row] = await exec(tx)
    .select()
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);
  return row ?? null;
}

/**
 * Which clinics answer on a given number. Returns a list rather than one row
 * because the test number is shared across clinics; the caller decides what an
 * ambiguous or empty result means.
 */
export async function listClinicsBySmsNumber(
  smsNumber: string,
  tx?: Executor,
): Promise<Clinic[]> {
  return exec(tx).select().from(clinics).where(eq(clinics.smsNumber, smsNumber));
}

export async function createClinic(
  values: NewClinic,
  tx?: Executor,
): Promise<Clinic> {
  const [row] = await exec(tx).insert(clinics).values(values).returning();
  return row;
}

export async function updateClinic(
  clinicId: string,
  values: Partial<Omit<NewClinic, "id" | "slug">>,
  tx?: Executor,
): Promise<Clinic | null> {
  const [row] = await exec(tx)
    .update(clinics)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(clinics.id, clinicId))
    .returning();
  return row ?? null;
}

export async function setKillSwitch(
  clinicId: string,
  on: boolean,
  tx?: Executor,
): Promise<void> {
  await exec(tx)
    .update(clinics)
    .set({ killSwitch: on, updatedAt: new Date() })
    .where(eq(clinics.id, clinicId));
}
