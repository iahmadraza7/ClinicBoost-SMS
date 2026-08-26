import {
  RecipientOptedOutError,
  SmsError,
  type OutboundSms,
  type SendReceipt,
  type SmsAdapter,
} from "./types";

/**
 * Mobile Message REST API v1.
 *
 * Basic auth, one message per request. Batching up to 10,000 is available but
 * this product replies to one person at a time, and a batch would blur which
 * message failed.
 */

const DEFAULT_BASE_URL = "https://api.mobilemessage.com.au";
const TIMEOUT_MS = 20_000;

type MessageResult = {
  status?: string;
  cost?: number;
  message_id?: string;
  error?: string;
};

export type MobileMessageOptions = {
  apiUser: string;
  apiPassword: string;
  baseUrl?: string;
};

export class MobileMessageAdapter implements SmsAdapter {
  readonly name = "mobile_message";

  private readonly baseUrl: string;
  private readonly authorization: string;

  constructor(options: MobileMessageOptions) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const raw = `${options.apiUser}:${options.apiPassword}`;
    this.authorization = `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
  }

  async send(sms: OutboundSms): Promise<SendReceipt> {
    const body = {
      messages: [
        {
          to: providerNumber(sms.to),
          message: sms.body,
          sender: providerNumber(sms.from),
          custom_ref: sms.reference,
        },
      ],
      // The provider skips anything longer rather than silently billing for it.
      max_parts: sms.maxSegments,
    };

    const response = await this.request("POST", "/v1/messages", {
      body,
      // Reusing our message id means a retried job returns the original
      // response instead of sending a second SMS.
      idempotencyKey: sms.reference,
    });

    const result: MessageResult = Array.isArray(response.results)
      ? (response.results[0] ?? {})
      : {};

    return readReceipt(result);
  }

  async balance(): Promise<number | null> {
    const response = await this.request("GET", "/v1/account");
    return typeof response.credit_balance === "number"
      ? response.credit_balance
      : null;
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    options: { body?: unknown; idempotencyKey?: string } = {},
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      Authorization: this.authorization,
      Accept: "application/json",
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new SmsError(
        `could not reach Mobile Message: ${describe(error)}`,
        { retryable: true, cause: error },
      );
    }

    const text = await response.text();

    if (!response.ok) {
      throw new SmsError(
        `Mobile Message returned ${response.status}: ${text.slice(0, 500)}`,
        { retryable: isRetryableStatus(response.status) },
      );
    }

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new SmsError(
        `Mobile Message returned unparseable JSON: ${text.slice(0, 200)}`,
        { retryable: false },
      );
    }
  }
}

/**
 * Mobile Message registers sender IDs without a leading plus, e.g.
 * `61485900170`, and rejects a sender that does not match one exactly. We hold
 * numbers in E.164 everywhere else, so the plus is dropped here, at the
 * boundary, rather than storing a provider-shaped number in the database.
 *
 * An alphanumeric sender ID such as a business name passes through untouched.
 */
function providerNumber(value: string): string {
  return value.startsWith("+") ? value.slice(1) : value;
}

/**
 * A 200 does not mean the message went. Each entry carries its own status, and
 * "blocked" means the provider's own unsubscribe list refused it.
 */
function readReceipt(result: MessageResult): SendReceipt {
  if (result.status === "blocked") {
    throw new RecipientOptedOutError(
      "Mobile Message blocked this recipient: they are on the account unsubscribe list",
    );
  }

  if (result.status !== "success") {
    throw new SmsError(
      `Mobile Message rejected the message: ${result.error ?? result.status ?? "no status returned"}`,
      { retryable: false },
    );
  }

  if (!result.message_id) {
    throw new SmsError("Mobile Message accepted the message but returned no id", {
      retryable: false,
    });
  }

  return {
    providerMessageId: result.message_id,
    segments: typeof result.cost === "number" ? result.cost : 1,
  };
}

/**
 * Rate limits and provider-side faults are worth retrying. A 4xx means the
 * request itself is wrong and will be just as wrong in thirty seconds.
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
