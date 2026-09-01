import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";
import type {
  BlockedTerm,
  Clinic,
  Contact,
  Conversation,
  KbEntry,
  Message,
  MessageDirection,
  Offer,
} from "../db/schema";
import type { ReplyContext } from "../reply-context";
import { CLINIC, ENTRIES, OFFERS, seedEntryKind } from "../seed/beauty-soiree";

/** Real Beauty Soiree content, shaped as database rows, with no database. */

const now = new Date("2026-08-26T10:00:00Z");
const CLINIC_ID = "00000000-0000-7000-8000-000000000001";

export const clinic: Clinic = {
  id: CLINIC_ID,
  slug: CLINIC.slug,
  name: CLINIC.name,
  location: CLINIC.location,
  hours: CLINIC.hours,
  phone: CLINIC.phone,
  paymentNotes: CLINIC.paymentNotes,
  bookingPlatform: CLINIC.bookingPlatform,
  closeType: CLINIC.closeType,
  smsNumber: null,
  confidenceThreshold: CLINIC.confidenceThreshold,
  killSwitch: false,
  notifyEmail: true,
  notifySms: false,
  unattendedMinutes: 15,
  widgetTheme: null,
  widgetOrigins: CLINIC.widgetOrigins,
  voice: null,
  voicePending: null,
  voiceReviewedBy: null,
  voiceReviewedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};

export const offers: Offer[] = OFFERS.map((offer, i) => ({
  id: `00000000-0000-7000-8000-00000000010${i}`,
  clinicId: CLINIC_ID,
  name: offer.name,
  priceCents: offer.priceCents,
  priceDisplay: offer.priceDisplay,
  rrpDisplay: offer.rrpDisplay,
  bookingUrl: offer.bookingUrl,
  active: true,
  notes: offer.notes,
  createdAt: now,
  updatedAt: now,
}));

export const kbEntries: KbEntry[] = ENTRIES.map((entry, i) => ({
  id: `00000000-0000-7000-8000-00000000020${i}`,
  clinicId: CLINIC_ID,
  entryKey: entry.entryKey,
  category: entry.category,
  offerId: null,
  title: entry.title,
  body: entry.body,
  status: "active",
  answerMode: entry.answerMode ?? "answerable",
  entryKind: seedEntryKind(entry),
  blockDeflect: entry.blockDeflect ?? null,
  triggerTerms: entry.triggerTerms ?? [],
  source: "imported",
  sourceDraftId: null,
  createdBy: "seed",
  reviewedBy: null,
  reviewedAt: null,
  createdAt: now,
  updatedAt: now,
}));

export const blockedTerms: BlockedTerm[] = S4_BASELINE_TERMS.map((t, i) => ({
  id: `00000000-0000-7000-8000-00000000030${i}`,
  clinicId: CLINIC_ID,
  term: t.term,
  reason: t.reason,
  createdAt: now,
}));

const contact: Contact = {
  id: "00000000-0000-7000-8000-000000000401",
  clinicId: CLINIC_ID,
  mobile: "+61405111222",
  name: "Sarah",
  optedOut: false,
  optedOutAt: null,
  consentSource: "widget",
  consentAt: now,
  createdAt: now,
  updatedAt: now,
};

const conversation: Conversation = {
  id: "00000000-0000-7000-8000-000000000501",
  clinicId: CLINIC_ID,
  contactId: contact.id,
  sourceType: "widget",
  summary: null,
  lastMessageAt: now,
  createdAt: now,
};

export function message(
  direction: MessageDirection,
  body: string,
  offsetMinutes = 0,
): Message {
  return {
    id: `msg-${direction}-${offsetMinutes}`,
    clinicId: CLINIC_ID,
    conversationId: conversation.id,
    direction,
    body,
    segments: 1,
    status: direction === "inbound" ? "delivered" : "sent",
    providerMessageId: null,
    createdAt: new Date(now.getTime() + offsetMinutes * 60_000),
  };
}

export function makeReplyContext(
  overrides: Partial<ReplyContext> = {},
): ReplyContext {
  const inbound = message("inbound", "how much is the hifu and how long does it take");

  return {
    clinic,
    kbEntries,
    offers,
    blockedTerms,
    contact,
    conversation,
    history: [inbound],
    inbound,
    ...overrides,
  };
}
