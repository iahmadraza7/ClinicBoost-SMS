import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "../env";
import * as schema from "./schema";

/**
 * The only Drizzle client in the application.
 *
 * Import it from `src/server/repo/` and nowhere else. Route handlers, server
 * actions and worker jobs go through the repository layer so that every query
 * is scoped by clinic_id. See .cursor/rules/010-tenancy.mdc.
 */

declare global {
  var __clinicboostPool: Pool | undefined;
}

// Next.js dev server reloads modules on every edit. Reuse one pool so we do not
// leak connections on the 4GB box.
const pool =
  globalThis.__clinicboostPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
  });

if (env.NODE_ENV !== "production") {
  globalThis.__clinicboostPool = pool;
}

export const db = drizzle(pool, { schema });

export type Db = typeof db;
