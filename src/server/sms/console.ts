import { segmentCount } from "@/lib/segments";
import type { OutboundSms, SendReceipt, SmsAdapter } from "./types";

/**
 * Writes the message to the log instead of sending it.
 *
 * This is the default, so that having credentials in the environment is never
 * on its own enough to spend credits. Going live is one setting:
 * SMS_PROVIDER=mobile_message.
 */
export class ConsoleSmsAdapter implements SmsAdapter {
  readonly name = "console";

  async send(sms: OutboundSms): Promise<SendReceipt> {
    const segments = segmentCount(sms.body);
    console.log(
      `[sms:console] ${sms.from} -> ${sms.to} (${segments} segment${segments === 1 ? "" : "s"})\n${sms.body}`,
    );
    // Prefixed so nothing downstream can mistake this for a real provider id.
    return { providerMessageId: `console:${sms.reference}`, segments };
  }

  async balance(): Promise<number | null> {
    return null;
  }
}
