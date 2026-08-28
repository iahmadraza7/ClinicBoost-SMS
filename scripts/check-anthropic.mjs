/**
 * Confirms the Anthropic key can actually draft with ANTHROPIC_MODEL.
 * GET /v1/models is not enough: a placeholder key can still look fine there.
 * Prints no secrets.
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

const key = env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

if (!key.trim().startsWith("sk-ant-")) {
  console.error("Anthropic rejected the key.");
  process.exit(1);
}

const model = env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const ping = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model,
    max_tokens: 1,
    messages: [{ role: "user", content: "." }],
  }),
});

if (!ping.ok) {
  console.error(`messages ping failed: ${ping.status} ${await ping.text()}`);
  process.exit(1);
}

console.log(`Key is valid. ${model} answered.`);
