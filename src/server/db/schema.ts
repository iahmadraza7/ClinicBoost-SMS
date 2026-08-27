import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { newId } from "./ids";

// Column vocabularies. Stored as text rather than pg enums so that adding a
// value later is a code change, not a migration on a live table.

export type BookingPlatform = "fresha" | "timely" | "wix" | "other";
export type CloseType = "link_only" | "manual";
export type KbCategory = "config" | "offer" | "policy" | "faq" | "booking";
export type KbStatus = "active" | "pending_review" | "archived";
export type AnswerMode = "answerable" | "blocked" | "missing";
export type KbSource = "imported" | "operator_edit" | "operator_answer";
export type ConsentSource = "widget" | "sms_inbound" | "operator";
export type SourceType = "widget" | "sms_inbound" | "missed_call" | "operator";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "rejected";
export type DraftState =
  | "auto_sent"
  | "pending"
  | "approved"
  | "edited"
  | "rejected";

export type Claim = { text: string; source_id: string };
export type ValidationFailure = { code: string; detail: string };
export type ValidationResult = {
  passed: boolean;
  failures: ValidationFailure[];
};
export type WidgetTheme = {
  accent?: string;
  heading?: string;
  buttonLabel?: string;
};

const id = () =>
  uuid("id")
    .primaryKey()
    .$defaultFn(() => newId());

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const clinics = pgTable("clinics", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  hours: text("hours"),
  phone: text("phone"),
  paymentNotes: text("payment_notes"),
  bookingPlatform: text("booking_platform").$type<BookingPlatform>().notNull(),
  // A `manual` clinic must never be told the booking is confirmed. A
  // `link_only` clinic must never be told someone will get back to them.
  closeType: text("close_type").$type<CloseType>().notNull(),
  smsNumber: text("sms_number"),
  confidenceThreshold: integer("confidence_threshold").notNull().default(90),
  killSwitch: boolean("kill_switch").notNull().default(false),
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifySms: boolean("notify_sms").notNull().default(false),
  unattendedMinutes: integer("unattended_minutes").notNull().default(15),
  widgetTheme: jsonb("widget_theme").$type<WidgetTheme>(),
  // Origins the widget endpoint will answer CORS for. Empty means no
  // cross-origin browser submissions are accepted for this clinic.
  widgetOrigins: text("widget_origins")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  // Live voice, used in the STYLE section of the system prompt. Null means
  // the default Australian SMS tone. Edits land in voicePending until review.
  voice: text("voice"),
  voicePending: text("voice_pending"),
  voiceReviewedBy: text("voice_reviewed_by"),
  voiceReviewedAt: timestamp("voice_reviewed_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const offers = pgTable(
  "offers",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents"),
    // Exactly as it may appear in a draft. The validator string-matches this.
    // Never format a price from price_cents into a draft.
    priceDisplay: text("price_display").notNull(),
    rrpDisplay: text("rrp_display"),
    bookingUrl: text("booking_url").notNull(),
    active: boolean("active").notNull().default(true),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("offers_clinic_idx").on(t.clinicId, t.active)],
);

export const kbEntries = pgTable(
  "kb_entries",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    // What the model cites in claims[].source_id, e.g.
    // beauty-soiree.hifu-499.duration
    entryKey: text("entry_key").notNull(),
    category: text("category").$type<KbCategory>().notNull(),
    offerId: uuid("offer_id").references(() => offers.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").$type<KbStatus>().notNull().default("active"),
    answerMode: text("answer_mode")
      .$type<AnswerMode>()
      .notNull()
      .default("answerable"),
    blockDeflect: text("block_deflect"),
    // Words that mean an enquiry or a draft has touched this entry's topic.
    // A `blocked` entry needs these: "do not answer whether HIFU hurts" is only
    // enforceable if "hurts" is written down somewhere the validator can read.
    triggerTerms: text("trigger_terms")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    source: text("source").$type<KbSource>().notNull(),
    createdBy: text("created_by").notNull(),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("kb_entries_clinic_key_uq").on(t.clinicId, t.entryKey),
    index("kb_entries_clinic_mode_idx").on(t.clinicId, t.answerMode, t.status),
  ],
);

export const blockedTerms = pgTable(
  "blocked_terms",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    reason: text("reason").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("blocked_terms_clinic_term_uq").on(t.clinicId, t.term)],
);

export const contacts = pgTable(
  "contacts",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    mobile: text("mobile").notNull(),
    name: text("name"),
    // Opt-out is per contact per clinic, never global.
    optedOut: boolean("opted_out").notNull().default(false),
    optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
    consentSource: text("consent_source").$type<ConsentSource>().notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("contacts_clinic_mobile_uq").on(t.clinicId, t.mobile)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    sourceType: text("source_type").$type<SourceType>().notNull(),
    // Rolling summary of older messages. Recent ones stay verbatim.
    summary: text("summary"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    // One conversation per contact per clinic, never restarted.
    uniqueIndex("conversations_clinic_contact_uq").on(t.clinicId, t.contactId),
    index("conversations_clinic_recent_idx").on(t.clinicId, t.lastMessageAt),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: text("direction").$type<MessageDirection>().notNull(),
    body: text("body").notNull(),
    segments: integer("segments").notNull().default(1),
    status: text("status").$type<MessageStatus>().notNull(),
    providerMessageId: text("provider_message_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_conversation_idx").on(t.conversationId, t.createdAt),
    index("messages_clinic_idx").on(t.clinicId, t.createdAt),
  ],
);

export const drafts = pgTable(
  "drafts",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    inboundMessageId: uuid("inbound_message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    draftBody: text("draft_body").notNull(),
    claims: jsonb("claims").$type<Claim[]>().notNull().default([]),
    matchedOfferId: uuid("matched_offer_id").references(() => offers.id, {
      onDelete: "set null",
    }),
    selfConfidence: integer("self_confidence").notNull().default(0),
    // failures[].code is machine-readable so the queue can group by it and the
    // runbook can reference it.
    validationResult: jsonb("validation_result").$type<ValidationResult>(),
    state: text("state").$type<DraftState>().notNull().default("pending"),
    editedBody: text("edited_body"),
    decidedBy: text("decided_by"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("drafts_clinic_state_idx").on(t.clinicId, t.state, t.createdAt),
    index("drafts_state_recent_idx").on(t.state, t.createdAt),
    index("drafts_conversation_idx").on(t.conversationId, t.createdAt),
  ],
);

export const usageCounters = pgTable(
  "usage_counters",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    periodMonth: text("period_month").notNull(), // YYYY-MM
    segmentsOut: integer("segments_out").notNull().default(0),
    segmentsIn: integer("segments_in").notNull().default(0),
    aiCalls: integer("ai_calls").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("usage_counters_clinic_period_uq").on(
      t.clinicId,
      t.periodMonth,
    ),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_clinic_idx").on(t.clinicId, t.createdAt)],
);

export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
export type KbEntry = typeof kbEntries.$inferSelect;
export type NewKbEntry = typeof kbEntries.$inferInsert;
export type BlockedTerm = typeof blockedTerms.$inferSelect;
export type NewBlockedTerm = typeof blockedTerms.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type UsageCounter = typeof usageCounters.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;
