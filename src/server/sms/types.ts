/**
 * The seam between this product and whoever carries the SMS. Mobile Message is
 * the provider today; the brief requires Twilio to be droppable in, so nothing
 * above this interface may know which one is in use.
 */

export type OutboundSms = {
  /** E.164, e.g. +61405111222. */
  to: string;
  /** A registered sender ID: a number or an approved business name. */
  from: string;
  body: string;
  /**
   * Our own message id. Sent as the provider's idempotency key so a retry
   * cannot bill twice, and as the reference that delivery receipts come back
   * with.
   */
  reference: string;
  /** Refuse at the provider rather than pay for an over-long message. */
  maxSegments: number;
};

export type SendReceipt = {
  providerMessageId: string;
  /** Segments the provider billed, which is the number that costs money. */
  segments: number;
};

export interface SmsAdapter {
  readonly name: string;
  send(sms: OutboundSms): Promise<SendReceipt>;
  /** Credits left, or null if the provider does not report a balance. */
  balance(): Promise<number | null>;
}

/**
 * `retryable` is the only thing the worker needs to decide from a failure.
 * A rejected credential or a malformed number will fail identically forever, so
 * retrying it just delays the operator finding out.
 */
export class SmsError extends Error {
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { retryable: boolean; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "SmsError";
    this.retryable = options.retryable;
  }
}

/**
 * The provider refused because the recipient is on its own unsubscribe list.
 * Distinct from our per-clinic opt-out, and worth recording against the contact
 * so we stop trying.
 */
export class RecipientOptedOutError extends SmsError {
  constructor(message: string) {
    super(message, { retryable: false });
    this.name = "RecipientOptedOutError";
  }
}
