/**
 * Hash a password for OPERATOR_PASSWORD_HASH.
 *
 *   node scripts/hash-password.mjs
 *   node scripts/hash-password.mjs "the password"
 *
 * Prints the hash and, if AUTH_SECRET is empty in .env, a value for that too.
 * Prints no secrets that were already set.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const KEYLEN = 32;
const SCRYPT_COST = { N: 16384, r: 8, p: 1 };

function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEYLEN, SCRYPT_COST);
  return `scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

function readEnv() {
  try {
    const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
    return Object.fromEntries(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const at = line.indexOf("=");
          return [line.slice(0, at), line.slice(at + 1)];
        }),
    );
  } catch {
    return {};
  }
}

const given = process.argv.slice(2).join(" ").trim();
let password = given;

if (!password) {
  const rl = readline.createInterface({ input, output });
  password = await rl.question("Password: ");
  rl.close();
}

if (!password) {
  console.error("A password is required.");
  process.exit(1);
}

console.log(`OPERATOR_PASSWORD_HASH=${hashPassword(password)}`);

const env = readEnv();
if (!env.AUTH_SECRET) {
  console.log(`AUTH_SECRET=${randomBytes(32).toString("hex")}`);
}
