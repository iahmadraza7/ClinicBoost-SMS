import "../bootstrap-env";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { env } from "../env";

/**
 * Applies everything in ./drizzle. Safe to run repeatedly; Drizzle records
 * which migrations have run in __drizzle_migrations.
 */
async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.log("migrations applied");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("migration failed:", error);
  process.exit(1);
});
