import * as repo from "../repo";
import type { Executor } from "../repo/executor";

/**
 * Operator alerts must not land on a customer thread. The AI reads that
 * thread, and a sentence like "Beauty Soiree has a draft waiting" would then
 * be sitting next to the customer's question.
 *
 * Identity is a sentinel mobile that is not an E.164 number, so it cannot
 * collide with a real contact even if Ted uses his own phone as the test
 * lead. The actual destination is OPERATOR_NOTIFY_MOBILE, passed at send time.
 */
export const OPERATOR_CONTACT_MOBILE = "operator";

export async function getOrCreateOperatorThread(
  clinicId: string,
  tx?: Executor,
) {
  const contact = await repo.contacts.upsertContact(
    clinicId,
    { mobile: OPERATOR_CONTACT_MOBILE, consentSource: "operator" },
    tx,
  );

  return repo.conversations.getOrCreateConversation(
    clinicId,
    contact.id,
    "operator",
    tx,
  );
}
