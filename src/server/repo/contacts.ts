import { and, eq } from "drizzle-orm";

import {
  contacts,
  type Contact,
  type ConsentSource,
} from "../db/schema";
import { exec, type Executor } from "./executor";

export async function getContactByMobile(
  clinicId: string,
  mobile: string,
  tx?: Executor,
): Promise<Contact | null> {
  const [row] = await exec(tx)
    .select()
    .from(contacts)
    .where(and(eq(contacts.clinicId, clinicId), eq(contacts.mobile, mobile)))
    .limit(1);
  return row ?? null;
}

export async function getContact(
  clinicId: string,
  contactId: string,
  tx?: Executor,
): Promise<Contact | null> {
  const [row] = await exec(tx)
    .select()
    .from(contacts)
    .where(and(eq(contacts.clinicId, clinicId), eq(contacts.id, contactId)))
    .limit(1);
  return row ?? null;
}

/**
 * An inbound enquiry implies consent under the Spam Act, so the consent record
 * is written with the contact. An existing contact keeps its original
 * consent_at and its opt-out state; re-enquiring does not silently opt someone
 * back in.
 */
export async function upsertContact(
  clinicId: string,
  values: { mobile: string; name?: string | null; consentSource: ConsentSource },
  tx?: Executor,
): Promise<Contact> {
  const [row] = await exec(tx)
    .insert(contacts)
    .values({
      clinicId,
      mobile: values.mobile,
      name: values.name ?? null,
      consentSource: values.consentSource,
    })
    .onConflictDoUpdate({
      target: [contacts.clinicId, contacts.mobile],
      set: {
        name: values.name ?? undefined,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function setOptedOut(
  clinicId: string,
  contactId: string,
  optedOut: boolean,
  tx?: Executor,
): Promise<Contact | null> {
  const [row] = await exec(tx)
    .update(contacts)
    .set({
      optedOut,
      optedOutAt: optedOut ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.clinicId, clinicId), eq(contacts.id, contactId)))
    .returning();
  return row ?? null;
}
