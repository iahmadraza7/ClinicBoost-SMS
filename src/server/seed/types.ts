import type {
  AnswerMode,
  BookingPlatform,
  CloseType,
  KbCategory,
  KbEntryKind,
} from "../db/schema";

export type SeedOffer = {
  key: string;
  name: string;
  priceCents: number | null;
  priceDisplay: string | null;
  rrpDisplay: string | null;
  bookingUrl: string | null;
  notes: string | null;
};

export type SeedEntry = {
  entryKey: string;
  category: KbCategory;
  offerKey?: string;
  title: string;
  body: string;
  answerMode?: AnswerMode;
  entryKind?: KbEntryKind;
  blockDeflect?: string;
  triggerTerms?: string[];
};

export type SeedClinic = {
  slug: string;
  name: string;
  location: string;
  hours: string | null;
  phone: string | null;
  paymentNotes: string | null;
  bookingPlatform: BookingPlatform | null;
  closeType: CloseType | null;
  confidenceThreshold: number;
  widgetOrigins: string[];
};

/** Gaps surfaced in the import report and on the clinic settings page. */
export type ImportGap =
  | "do_not_answer_list"
  | "compliance_block"
  | "booking_platform"
  | "close_type"
  | "widget_origins"
  | "hours"
  | "phone";

export type ClinicSeedPack = {
  sourceFile: string;
  clinic: SeedClinic;
  offers: SeedOffer[];
  entries: SeedEntry[];
  /** Strings that must appear in the converted source file. */
  sourceAssertions: string[];
  /** What the skill file does not contain. Shown after seed runs. */
  importGaps: ImportGap[];
  /** Free-text notes for the import report. */
  importNotes: string[];
};

/**
 * Policy is behaviour. price-contrast is stored under an offer but is an
 * instruction for how to talk about competitors, not a fact the customer
 * may be told.
 */
export function seedEntryKind(entry: SeedEntry): KbEntryKind {
  if (entry.entryKind) return entry.entryKind;
  if (entry.category === "policy") return "instruction";
  if (entry.entryKey.endsWith(".price-contrast")) return "instruction";
  return "fact";
}

export const IMPORT_GAP_LABELS: Record<ImportGap, string> = {
  do_not_answer_list: "No explicit do-not-answer / unconfirmed list",
  compliance_block: "No compliance rules block",
  booking_platform: "Booking platform not set (operator must choose)",
  close_type: "Close type not set (operator must choose)",
  widget_origins: "No widget origins configured",
  hours: "Opening hours not in skill file",
  phone: "Phone number not in skill file",
};
