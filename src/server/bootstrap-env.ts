import { existsSync } from "node:fs";
import { config } from "dotenv";

/**
 * Next.js loads .env files itself. Standalone processes (the worker, the
 * migrate script) do not, so import this first in those entrypoints.
 */
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    config({ path: file, override: false, quiet: true });
  }
}
