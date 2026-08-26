import { uuidv7 } from "uuidv7";

/**
 * Postgres 16 has no native uuidv7(), so ids are generated in the application.
 * v7 is time-ordered, which keeps index inserts sequential and makes "newest
 * first" queue listings cheap.
 */
export function newId(): string {
  return uuidv7();
}
