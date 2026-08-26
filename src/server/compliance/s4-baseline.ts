/**
 * Baseline blocked terms, seeded into every clinic on creation.
 *
 * Botulinum toxins and dermal fillers are Schedule 4 prescription medicines in
 * Australia. The Therapeutic Goods Act prohibits referring to them in
 * advertising directed at the public, including brand names, category terms and
 * nicknames. The practitioner exemption covers a clinician advising their own
 * patient, not an automated SMS sent by an agency.
 *
 * blocked_terms carries a clinic_id, so there is no global row. This list is
 * copied into each clinic and the operator can add to it per clinic.
 *
 * STATUS: starting point, not legal advice. docs/DECISIONS.md records that the
 * client is confirming this list with whoever handles their clinic ad
 * compliance before auto-send is switched on.
 */

type Term = { term: string; reason: string };

const BRAND = "Schedule 4 botulinum toxin or dermal filler brand name";
const CATEGORY = "Schedule 4 category term or nickname";

export const S4_BASELINE_TERMS: Term[] = [
  // Botulinum toxin brands available in Australia
  { term: "botox", reason: BRAND },
  { term: "dysport", reason: BRAND },
  { term: "xeomin", reason: BRAND },
  { term: "azzalure", reason: BRAND },
  { term: "bocouture", reason: BRAND },
  { term: "letybo", reason: BRAND },

  // Dermal filler brands
  { term: "juvederm", reason: BRAND },
  { term: "juvéderm", reason: BRAND },
  { term: "restylane", reason: BRAND },
  { term: "radiesse", reason: BRAND },
  { term: "sculptra", reason: BRAND },
  { term: "teosyal", reason: BRAND },
  { term: "belotero", reason: BRAND },
  { term: "stylage", reason: BRAND },
  { term: "profhilo", reason: BRAND },

  // Category terms and nicknames
  { term: "botulinum", reason: CATEGORY },
  { term: "botulinum toxin", reason: CATEGORY },
  { term: "neurotoxin", reason: CATEGORY },
  { term: "anti wrinkle injection", reason: CATEGORY },
  { term: "anti-wrinkle injection", reason: CATEGORY },
  { term: "antiwrinkle injection", reason: CATEGORY },
  { term: "wrinkle relaxer", reason: CATEGORY },
  { term: "muscle relaxant injection", reason: CATEGORY },
  { term: "dermal filler", reason: CATEGORY },
  { term: "lip filler", reason: CATEGORY },
  { term: "cheek filler", reason: CATEGORY },
  { term: "jaw filler", reason: CATEGORY },
  { term: "tear trough filler", reason: CATEGORY },
  { term: "cosmetic injectable", reason: CATEGORY },
  { term: "injectables", reason: CATEGORY },
  { term: "baby botox", reason: CATEGORY },
  { term: "brotox", reason: CATEGORY },
  { term: "tox", reason: CATEGORY },
  { term: "filler", reason: CATEGORY },
];
