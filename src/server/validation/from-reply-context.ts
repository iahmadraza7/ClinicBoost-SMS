import { env } from "../env";
import type { ReplyContext } from "../reply-context";
import type { ValidationContext } from "./types";

/**
 * Narrows the loaded reply context down to what the validator needs. Pure, so
 * the validator stays testable without a database.
 */
export function toValidationContext(ctx: ReplyContext): ValidationContext {
  return {
    clinic: {
      id: ctx.clinic.id,
      slug: ctx.clinic.slug,
      confidenceThreshold: ctx.clinic.confidenceThreshold,
      killSwitch: ctx.clinic.killSwitch,
      closeType: ctx.clinic.closeType,
    },
    kbEntries: ctx.kbEntries.map((e) => ({
      entryKey: e.entryKey,
      title: e.title,
      body: e.body,
      answerMode: e.answerMode,
      blockDeflect: e.blockDeflect,
      triggerTerms: e.triggerTerms,
    })),
    offers: ctx.offers.map((o) => ({
      id: o.id,
      name: o.name,
      priceDisplay: o.priceDisplay,
      rrpDisplay: o.rrpDisplay,
      bookingUrl: o.bookingUrl,
    })),
    blockedTerms: ctx.blockedTerms.map((t) => ({
      term: t.term,
      reason: t.reason,
    })),
    contactOptedOut: ctx.contact.optedOut,
    inboundQuestion: ctx.inbound.body,
    maxSegments: env.MAX_SEGMENTS_PER_DRAFT,
    globalKillSwitch: env.GLOBAL_KILL_SWITCH,
  };
}
