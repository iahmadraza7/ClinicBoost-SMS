import { PACK as beautySoiree } from "./beauty-soiree";
import { PACK as contourHaus } from "./contour-haus";
import { PACK as definedCosmetics } from "./defined-cosmetics";
import { PACK as gemEsthetics } from "./gem-esthetics";
import { PACK as glamAndGlow } from "./glam-and-glow";
import { PACK as loveYourSkin } from "./love-your-skin";
import { PACK as luxuryBrowsPerth } from "./luxury-brows-perth";
import { PACK as nhbEndermologie } from "./nhb-endermologie";
import { PACK as rickysAesthetics } from "./rickys-aesthetics";
import { PACK as skinSculptStudio } from "./skin-sculpt-studio";
import { PACK as threeSistersBeauty } from "./three-sisters-beauty";
import { IMPORT_GAP_LABELS, type ClinicSeedPack, type ImportGap } from "./types";

/** All eleven clinics, in slug order. Beauty Soiree first (e2e test clinic). */
export const ALL_CLINIC_PACKS: ClinicSeedPack[] = [
  beautySoiree,
  contourHaus,
  definedCosmetics,
  gemEsthetics,
  glamAndGlow,
  loveYourSkin,
  luxuryBrowsPerth,
  nhbEndermologie,
  rickysAesthetics,
  skinSculptStudio,
  threeSistersBeauty,
];

/** Import gaps from the seed pack, for the settings page after seed runs. */
export function importGapsForSlug(slug: string): ImportGap[] {
  const pack = ALL_CLINIC_PACKS.find((p) => p.clinic.slug === slug);
  return pack?.importGaps ?? [];
}

export { IMPORT_GAP_LABELS };
