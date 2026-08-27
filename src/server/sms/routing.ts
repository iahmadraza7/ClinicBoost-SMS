import { normaliseAuMobile } from "@/lib/mobile";
import type { Clinic } from "../db/schema";
import { env } from "../env";
import * as repo from "../repo";

/**
 * Which clinic owns traffic arriving on a given number.
 *
 * Every webhook resolves the clinic this way before touching anything, which is
 * what keeps the repository layer's clinic scoping intact: nothing is ever
 * looked up across clinics, not even a delivery receipt.
 *
 * The Mobile Message test number is shared, so per-clinic inbound routing
 * cannot be proven until the first dedicated number is bought. Until then
 * SHARED_NUMBER_CLINIC_SLUG says where unclaimed traffic goes. Moving to real
 * per-clinic numbers is then setting clinics.sms_number and dropping the
 * fallback, not a rewrite.
 */

export type Routing =
  | { clinic: Clinic; shared: boolean }
  | { clinic: null; reason: string };

export async function resolveClinicForNumber(
  rawNumber: string,
): Promise<Routing> {
  const number = normaliseAuMobile(rawNumber) ?? rawNumber.trim();

  const claimed = number ? await repo.clinics.listClinicsBySmsNumber(number) : [];

  if (claimed.length === 1) {
    return { clinic: claimed[0], shared: false };
  }

  const fallbackSlug = env.SHARED_NUMBER_CLINIC_SLUG;
  if (!fallbackSlug) {
    return {
      clinic: null,
      reason:
        claimed.length > 1
          ? `${claimed.length} clinics claim ${number} and SHARED_NUMBER_CLINIC_SLUG is not set`
          : `no clinic claims ${number} and SHARED_NUMBER_CLINIC_SLUG is not set`,
    };
  }

  const fallback = await repo.clinics.getClinicBySlug(fallbackSlug);
  if (!fallback || fallback.archivedAt) {
    return {
      clinic: null,
      reason: fallback?.archivedAt
        ? `SHARED_NUMBER_CLINIC_SLUG is "${fallbackSlug}" but that clinic is archived`
        : `SHARED_NUMBER_CLINIC_SLUG is "${fallbackSlug}" but no such clinic exists`,
    };
  }

  return { clinic: fallback, shared: true };
}
