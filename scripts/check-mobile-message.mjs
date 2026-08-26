/**
 * Confirms the Mobile Message credentials work, shows the credit balance and
 * lists the registered sender IDs. Read-only: sends nothing and costs nothing.
 * Run it after rotating credentials, or when SMS stops going out.
 */
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

const user = env.MOBILE_MESSAGE_API_USER;
const password = env.MOBILE_MESSAGE_API_PASSWORD;

if (!user || !password) {
  console.error("MOBILE_MESSAGE_API_USER / _PASSWORD are not set in .env");
  process.exit(1);
}

const authorization = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

async function get(path) {
  const response = await fetch(`https://api.mobilemessage.com.au${path}`, {
    headers: { Authorization: authorization, Accept: "application/json" },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`GET ${path} failed: ${response.status} ${text}`);
    process.exit(1);
  }
  return JSON.parse(text);
}

const account = await get("/v1/account");
console.log(`credit balance: ${account.credit_balance}`);

const senders = await get("/v1/senders");
const list = senders.results ?? senders.senders ?? [];
console.log(`\nregistered senders (${list.length}):`);
for (const sender of list) {
  console.log(`  ${JSON.stringify(sender)}`);
}

console.log(`\nSMS_PROVIDER=${env.SMS_PROVIDER ?? "console"}`);
console.log(
  env.SMS_PROVIDER === "mobile_message"
    ? "  LIVE. Approving a draft will send a real SMS and spend a credit."
    : "  Replies are written to the log. Nothing is sent and nothing is spent.",
);
