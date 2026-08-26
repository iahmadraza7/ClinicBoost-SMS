/**
 * Posts a correctly signed webhook at a running instance, the way Mobile
 * Message would. For local testing and for reproducing a reported problem
 * without waiting for a real message.
 *
 *   node scripts/post-test-webhook.mjs inbound "--message=how long do results last"
 *   node scripts/post-test-webhook.mjs inbound --message=STOP
 *   node scripts/post-test-webhook.mjs status "--message-id=abc" --status=delivered
 *
 * Flags: --message, --from, --to, --type, --status, --message-id.
 * Pass --unsigned or --tamper to check that the endpoint rejects them.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1)];
    }),
);

const [kind, ...flags] = process.argv.slice(2);

if (kind !== "inbound" && kind !== "status") {
  console.error(
    "usage: post-test-webhook.mjs <inbound|status> [--message=..] [--from=..] [--status=..] [--message-id=..] [--unsigned|--tamper]",
  );
  process.exit(1);
}

const flag = (name) => {
  const match = flags.find((f) => f.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : undefined;
};

const base = env.APP_URL ?? "http://127.0.0.1:3000";
const secret = env.MOBILE_MESSAGE_WEBHOOK_SECRET ?? "";
const sharedNumber = (env.MOBILE_MESSAGE_TEST_SENDER ?? "+61485900170").replace(/^\+/, "");

const defaults =
  kind === "inbound"
    ? {
        to: sharedNumber,
        sender: "61405222111",
        message: "how long do the results last?",
        received_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        type: "inbound",
        original_message_id: null,
        original_custom_ref: null,
      }
    : {
        to: "61405222111",
        sender: sharedNumber,
        message: "",
        custom_ref: null,
        status: "delivered",
        message_id: "",
        received_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        part_number: 1,
        total_parts: 1,
      };

const overrides = {
  ...(flag("message") !== undefined && { message: flag("message") }),
  ...(flag("from") !== undefined && { sender: flag("from") }),
  ...(flag("to") !== undefined && { to: flag("to") }),
  ...(flag("type") !== undefined && { type: flag("type") }),
  ...(flag("status") !== undefined && { status: flag("status") }),
  ...(flag("message-id") !== undefined && { message_id: flag("message-id") }),
};

const payload = { ...defaults, ...overrides };
const body = JSON.stringify(payload);

const timestamp = String(Math.floor(Date.now() / 1000));
const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

const headers = { "Content-Type": "application/json" };
if (!flags.includes("--unsigned")) {
  headers["X-MM-Timestamp"] = timestamp;
  headers["X-MM-Signature"] = flags.includes("--tamper")
    ? signature.replace(/^./, (c) => (c === "a" ? "b" : "a"))
    : signature;
}

const response = await fetch(`${base}/api/webhooks/mobile-message/${kind}`, {
  method: "POST",
  headers,
  body,
});

console.log(`POST /api/webhooks/mobile-message/${kind} -> ${response.status}`);
const text = await response.text();
if (text) console.log(text);
