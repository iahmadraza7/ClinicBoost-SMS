import type {
  BlockedTerm,
  Clinic,
  Contact,
  Conversation,
  KbEntry,
  Message,
  Offer,
} from "./db/schema";
import * as repo from "./repo";

/**
 * Everything needed to draft and then validate one reply, loaded once.
 *
 * The AI layer and the validator both work from this. Loading it twice would be
 * two sets of the same queries per enquiry, and worse, would let the model be
 * given a knowledge base that the validator then checks against a different
 * one.
 */
export type ReplyContext = {
  clinic: Clinic;
  kbEntries: KbEntry[];
  offers: Offer[];
  blockedTerms: BlockedTerm[];
  contact: Contact;
  conversation: Conversation;
  /** Oldest first, ending with the inbound message being replied to. */
  history: Message[];
  inbound: Message;
};

/** Older messages live in conversation.summary; these stay verbatim. */
const VERBATIM_MESSAGE_LIMIT = 20;

export async function loadReplyContext(
  clinicId: string,
  args: { conversationId: string; inboundMessageId: string },
): Promise<ReplyContext | null> {
  const [clinic, conversation, inbound] = await Promise.all([
    repo.clinics.getClinic(clinicId),
    repo.conversations.getConversation(clinicId, args.conversationId),
    repo.messages.getMessage(clinicId, args.inboundMessageId),
  ]);

  if (!clinic || !conversation || !inbound) return null;

  const [kbEntries, offers, blockedTerms, contact, recent] = await Promise.all([
    repo.kb.listKbEntries(clinicId, { activeOnly: true }),
    repo.offers.listOffers(clinicId, { activeOnly: true }),
    repo.blockedTerms.listBlockedTerms(clinicId),
    repo.contacts.getContact(clinicId, conversation.contactId),
    repo.messages.listRecentMessages(
      clinicId,
      conversation.id,
      VERBATIM_MESSAGE_LIMIT,
    ),
  ]);

  if (!contact) return null;

  const history = [...recent].reverse();
  if (!history.some((m) => m.id === inbound.id)) history.push(inbound);

  return {
    clinic,
    kbEntries,
    offers,
    blockedTerms,
    contact,
    conversation,
    history,
    inbound,
  };
}
