import { z } from "zod";

import type { MessageStatus } from "../db/schema";

/**
 * Mobile Message webhook bodies. Parsed defensively: these arrive from the
 * public internet and a shape we did not expect must be a clean rejection, not
 * an exception in a route handler.
 */

export const inboundPayloadSchema = z.object({
  /** The number the customer texted, which is how we find the clinic. */
  to: z.string().min(1),
  /** The customer's number. */
  sender: z.string().min(1),
  message: z.string().default(""),
  received_at: z.string().optional(),
  type: z.enum(["inbound", "unsubscribe"]),
  original_message_id: z.string().nullish(),
  original_custom_ref: z.string().nullish(),
});

export type InboundPayload = z.infer<typeof inboundPayloadSchema>;

export const statusPayloadSchema = z.object({
  to: z.string().min(1),
  /** The sender ID the message went out from, which is how we find the clinic. */
  sender: z.string().min(1),
  message: z.string().optional(),
  custom_ref: z.string().nullish(),
  status: z.string().min(1),
  message_id: z.string().min(1),
  received_at: z.string().optional(),
  part_number: z.number().optional(),
  total_parts: z.number().optional(),
});

export type StatusPayload = z.infer<typeof statusPayloadSchema>;

/**
 * Provider vocabulary to ours. `cancelled` maps to rejected because in both
 * cases the message was stopped rather than lost.
 */
const STATUS_MAP: Record<string, MessageStatus> = {
  pending: "queued",
  scheduled: "queued",
  sent: "sent",
  delivered: "delivered",
  failed: "failed",
  cancelled: "rejected",
};

export function mapProviderStatus(status: string): MessageStatus | null {
  return STATUS_MAP[status.trim().toLowerCase()] ?? null;
}

/**
 * A delivery receipt for one part of a multi-part message says nothing about
 * the message as a whole until the last part arrives.
 */
export function isFinalPart(payload: StatusPayload): boolean {
  if (payload.part_number === undefined || payload.total_parts === undefined) {
    return true;
  }
  return payload.part_number >= payload.total_parts;
}

/**
 * The provider turns "Reply Stop" into a type=unsubscribe event on its own
 * numbers. This is the safety net for the wording it does not catch, and for
 * any future provider that does not do it at all.
 */
const STOP_WORDS = new Set([
  "stop",
  "stopall",
  "unsubscribe",
  "unsub",
  "quit",
  "cancel",
  "end",
  "optout",
  "opt out",
  "remove me",
]);

export function isStopKeyword(body: string): boolean {
  const normalised = body
    .trim()
    .toLowerCase()
    .replace(/[.!,]+$/g, "")
    .replace(/\s+/g, " ");
  return STOP_WORDS.has(normalised);
}
