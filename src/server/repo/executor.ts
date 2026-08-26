import { db, type Db } from "../db/client";

/**
 * A transaction handle. Every repository function accepts one so a caller can
 * compose several writes atomically — persist first, then enqueue.
 */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type Executor = Db | Tx;

export function exec(tx?: Executor): Executor {
  return tx ?? db;
}

export function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(fn);
}
