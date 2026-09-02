import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Server action ids for middleware stale-bundle detection.
 *
 * Read at config time so the middleware bundle inlines them via `env`.
 * The manifest only exists after `next build` finishes, so a single pass
 * cannot see this build's ids. The build script runs extract between two
 * passes; pass two picks up the file written at the end of pass one.
 *
 * Missing file (clean checkout): empty list, stale detection off, build ok.
 */
function loadServerActionIdsEnv() {
  const path = join(root, "server-action-ids.json");
  if (!existsSync(path)) return "[]";
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return JSON.stringify(Array.isArray(parsed) ? parsed : []);
  } catch {
    return "[]";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["pg", "pg-boss"],
  env: {
    SERVER_ACTION_IDS: loadServerActionIdsEnv(),
  },
};

export default nextConfig;
