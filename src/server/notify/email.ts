import { Resend } from "resend";

import { env } from "../env";
import type { QueueEmail } from "./notice";

export type OutboundEmail = QueueEmail;

export interface EmailAdapter {
  readonly name: string;
  send(email: OutboundEmail): Promise<{ id: string }>;
}

export class EmailError extends Error {
  readonly retryable: boolean;

  constructor(
    message: string,
    options: { retryable: boolean; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "EmailError";
    this.retryable = options.retryable;
  }
}

export class ResendAdapter implements EmailAdapter {
  readonly name = "resend";
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(email: OutboundEmail): Promise<{ id: string }> {
    const { data, error } = await this.client.emails.send(
      {
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      },
      { idempotencyKey: email.idempotencyKey },
    );

    if (error) {
      throw new EmailError(`Resend refused the email: ${error.message}`, {
        retryable: isRetryableResend(error.name),
      });
    }

    if (!data?.id) {
      throw new EmailError("Resend accepted the email but returned no id", {
        retryable: false,
      });
    }

    return { id: data.id };
  }
}

/**
 * Writes the email to the log. Used when the API key is not set, so local
 * drafts still exercise the notify path without sending anything to the US.
 */
export class ConsoleEmailAdapter implements EmailAdapter {
  readonly name = "console";

  async send(email: OutboundEmail): Promise<{ id: string }> {
    console.log(
      `[email:console] to ${email.to}\n${email.subject}\n${email.text}`,
    );
    return { id: `console:${email.idempotencyKey}` };
  }
}

let adapter: EmailAdapter | null = null;

export function getEmailAdapter(): EmailAdapter {
  if (adapter) return adapter;
  adapter = env.RESEND_API_KEY
    ? new ResendAdapter(env.RESEND_API_KEY)
    : new ConsoleEmailAdapter();
  return adapter;
}

/** Test seam. */
export function setEmailAdapter(next: EmailAdapter | null): void {
  adapter = next;
}

function isRetryableResend(name: string | undefined): boolean {
  if (!name) return true;
  const lower = name.toLowerCase();
  // Client mistakes will fail identically forever. Everything else, including
  // an unknown name, is worth another try.
  if (lower.includes("validation")) return false;
  if (lower.includes("not_found")) return false;
  if (lower.includes("invalid_idempotent_request")) return false;
  if (lower.includes("invalid_idempotency_key")) return false;
  return true;
}
