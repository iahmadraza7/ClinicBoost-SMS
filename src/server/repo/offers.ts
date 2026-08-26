import { and, asc, eq } from "drizzle-orm";

import { offers, type NewOffer, type Offer } from "../db/schema";
import { exec, type Executor } from "./executor";

export async function listOffers(
  clinicId: string,
  opts: { activeOnly?: boolean } = {},
  tx?: Executor,
): Promise<Offer[]> {
  const where = opts.activeOnly
    ? and(eq(offers.clinicId, clinicId), eq(offers.active, true))
    : eq(offers.clinicId, clinicId);

  return exec(tx).select().from(offers).where(where).orderBy(asc(offers.name));
}

export async function getOffer(
  clinicId: string,
  offerId: string,
  tx?: Executor,
): Promise<Offer | null> {
  const [row] = await exec(tx)
    .select()
    .from(offers)
    .where(and(eq(offers.clinicId, clinicId), eq(offers.id, offerId)))
    .limit(1);
  return row ?? null;
}

export async function createOffer(
  clinicId: string,
  values: Omit<NewOffer, "clinicId">,
  tx?: Executor,
): Promise<Offer> {
  const [row] = await exec(tx)
    .insert(offers)
    .values({ ...values, clinicId })
    .returning();
  return row;
}

export async function updateOffer(
  clinicId: string,
  offerId: string,
  values: Partial<Omit<NewOffer, "id" | "clinicId">>,
  tx?: Executor,
): Promise<Offer | null> {
  const [row] = await exec(tx)
    .update(offers)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(offers.clinicId, clinicId), eq(offers.id, offerId)))
    .returning();
  return row ?? null;
}
