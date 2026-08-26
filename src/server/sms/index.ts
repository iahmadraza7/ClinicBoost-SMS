import { env } from "../env";
import { ConsoleSmsAdapter } from "./console";
import { MobileMessageAdapter } from "./mobile-message";
import { SmsError, type SmsAdapter } from "./types";

export { ConsoleSmsAdapter } from "./console";
export { MobileMessageAdapter } from "./mobile-message";
export {
  RecipientOptedOutError,
  SmsError,
  type OutboundSms,
  type SendReceipt,
  type SmsAdapter,
} from "./types";
export {
  MAX_AGE_SECONDS,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  sign,
  verifyWebhook,
} from "./signature";

let adapter: SmsAdapter | null = null;

export function getSmsAdapter(): SmsAdapter {
  if (adapter) return adapter;

  if (env.SMS_PROVIDER === "mobile_message") {
    if (!env.MOBILE_MESSAGE_API_USER || !env.MOBILE_MESSAGE_API_PASSWORD) {
      throw new SmsError(
        "SMS_PROVIDER is mobile_message but the API credentials are not set",
        { retryable: false },
      );
    }
    adapter = new MobileMessageAdapter({
      apiUser: env.MOBILE_MESSAGE_API_USER,
      apiPassword: env.MOBILE_MESSAGE_API_PASSWORD,
    });
  } else {
    adapter = new ConsoleSmsAdapter();
  }

  return adapter;
}

/** Test seam. Never called in the running product. */
export function setSmsAdapter(next: SmsAdapter | null): void {
  adapter = next;
}
