import type { ReplyContext } from "../reply-context";
import type { BlockedTerm, CloseType, KbEntry, Offer } from "../db/schema";

/**
 * The clinic half of the system prompt.
 *
 * The whole knowledge base goes in. A full clinic file is roughly 2,000 tokens,
 * so there is no chunking, no embeddings and no retrieval: retrieval would only
 * add a way to silently miss the one entry that mattered.
 */

const CLOSE_BEHAVIOUR: Record<CloseType, string> = {
  link_only: `This clinic books through a self-serve link that confirms instantly the moment the customer picks a time. The link is the whole close.

- Never say anyone will confirm the booking, get back to them, or hold a spot. Nobody will. The booking is done the second they pick a time.
- Give the link with a direct instruction, not a bare drop.
- Minimise the perceived effort. It takes a minute and they pick their own time.`,

  manual: `This clinic confirms bookings by hand. A person has to come back to the customer.

- Never tell the customer their booking is confirmed. It is not, until a human confirms it.
- Never imply a time is held or secured.
- Say that someone will come back to them to lock in a time.`,
};

export function buildClinicPrompt(ctx: ReplyContext): string {
  const { clinic } = ctx;

  const sections = [
    `# CLINIC: ${clinic.name}`,
    [
      `Location: ${clinic.location}`,
      clinic.phone ? `Phone: ${clinic.phone}` : null,
      clinic.hours
        ? `Hours: ${clinic.hours}`
        : "Hours: NOT CONFIRMED. Do not state opening hours.",
      clinic.paymentNotes ? `Payment: ${clinic.paymentNotes}` : null,
      `Booking platform: ${clinic.bookingPlatform}`,
    ]
      .filter(Boolean)
      .join("\n"),

    `# CLOSE BEHAVIOUR\n\n${CLOSE_BEHAVIOUR[clinic.closeType]}`,
    offersSection(ctx.offers),
    doNotAnswerSection(ctx.kbEntries),
    behaviourSection(ctx.kbEntries),
    knowledgeBaseSection(ctx.kbEntries),
    blockedTermsSection(ctx.blockedTerms),
    ctx.conversation.summary
      ? `# EARLIER IN THIS CONVERSATION\n\n${ctx.conversation.summary}`
      : null,
  ].filter(Boolean);

  return sections.join("\n\n");
}

function offersSection(offers: Offer[]): string {
  if (offers.length === 0) {
    return "# OFFERS\n\nNone active. Set matched_offer_id to null.";
  }

  const lines = offers.map((offer) =>
    [
      `- id: ${offer.id}`,
      `  name: ${offer.name}`,
      `  price: ${offer.priceDisplay}${offer.rrpDisplay ? ` (normally ${offer.rrpDisplay})` : ""}`,
      `  booking link: ${offer.bookingUrl}`,
      offer.notes ? `  note: ${offer.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return `# OFFERS\n\nCopy "id" exactly into matched_offer_id. Copy the price and the booking link exactly, character for character.\n\n${lines.join("\n\n")}`;
}

/**
 * Listed before the knowledge base so the model reads the prohibitions before
 * it reads anything it might be tempted to answer from.
 */
function doNotAnswerSection(entries: KbEntry[]): string {
  const blocked = entries.filter((e) => e.answerMode === "blocked");
  if (blocked.length === 0) {
    return `# DO NOT ANSWER\n\nNothing is listed for this clinic yet. Be correspondingly careful: if a question is not covered by the knowledge base, set "unanswered": true rather than reaching for an answer.`;
  }

  const lines = blocked.map((entry) =>
    [
      `- topic: ${entry.title}`,
      `  id: ${entry.entryKey}`,
      entry.blockDeflect ? `  say instead: ${entry.blockDeflect}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return `# DO NOT ANSWER

These have not been confirmed by the clinic. Never answer one, never soften it into a guess, never work around it. If the customer asks, reply with the deflect text given and nothing more on that topic.

${lines.join("\n\n")}`;
}

/**
 * Behaviour rules for this clinic. Shown without citable ids so the model
 * cannot treat them as claim sources. Blocked instructions already appear
 * under DO NOT ANSWER.
 */
function behaviourSection(entries: KbEntry[]): string {
  const instructions = entries.filter(
    (e) => e.entryKind === "instruction" && e.answerMode !== "blocked",
  );
  if (instructions.length === 0) return "";

  const lines = instructions.map(
    (entry) => `- ${entry.title}: ${entry.body}`,
  );

  return `# CLINIC BEHAVIOUR

These govern how you write. They are not facts you may state to the customer. Do not cite them as source_id. Do not copy competitor prices, intervals or claims from them into the draft unless a knowledge base fact also states that value.

${lines.join("\n\n")}`;
}

function knowledgeBaseSection(entries: KbEntry[]): string {
  const facts = entries.filter(
    (e) => e.answerMode === "answerable" && e.entryKind === "fact",
  );

  const lines = facts.map(
    (entry) => `- id: ${entry.entryKey}\n  ${entry.title}: ${entry.body}`,
  );

  return `# CLINIC KNOWLEDGE BASE

This is everything the clinic has confirmed as fact. It is the only source you may state as fact. Cite the "id" of whatever you use. Never cite an item from CLINIC BEHAVIOUR.

${lines.join("\n\n")}`;
}

function blockedTermsSection(terms: BlockedTerm[]): string {
  if (terms.length === 0) return "";
  return `# BLOCKED TERMS

Never write any of these, in any form, for any reason:

${terms.map((t) => t.term).join(", ")}`;
}

export type PromptMessage = { role: "user" | "assistant"; content: string };

/**
 * Inbound messages are the customer, outbound are the clinic. Consecutive
 * messages from the same side are merged, because the API expects turns to
 * alternate.
 */
export function buildMessages(ctx: ReplyContext): PromptMessage[] {
  const turns: PromptMessage[] = [];

  for (const message of ctx.history) {
    const role = message.direction === "inbound" ? "user" : "assistant";
    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${message.body}`;
    } else {
      turns.push({ role, content: message.body });
    }
  }

  // The API requires the exchange to start and end with the customer. It always
  // does in practice, since a thread can only be opened by an inbound message
  // and we are replying to one, but a malformed thread must not fail the job.
  if (turns.length === 0 || turns[0].role !== "user") {
    turns.unshift({ role: "user", content: ctx.inbound.body });
  }
  if (turns[turns.length - 1].role !== "user") {
    turns.push({ role: "user", content: ctx.inbound.body });
  }

  return turns;
}
