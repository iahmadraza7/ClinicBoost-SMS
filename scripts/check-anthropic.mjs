/**
 * Confirms the Anthropic key works and that ANTHROPIC_MODEL is a model the
 * account can actually use. Run it after rotating either. Prints no secrets.
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

const response = await fetch("https://api.anthropic.com/v1/models?limit=100", {
  headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
});

if (!response.ok) {
  console.error(`models list failed: ${response.status} ${await response.text()}`);
  process.exit(1);
}

const { data } = await response.json();
const ids = data.map((m) => m.id);

console.log("available models:");
for (const id of ids) console.log(`  ${id}`);

const configured = env.ANTHROPIC_MODEL;
console.log(`\nANTHROPIC_MODEL=${configured}`);
console.log(ids.includes(configured) ? "  OK, available" : "  NOT in the list");
