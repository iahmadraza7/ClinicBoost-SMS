/**
 * Fixed-window rate limiting, in process memory.
 *
 * There is one app container, so a shared store would be extra infrastructure
 * for no gain. A restart clears the counters, which is acceptable: this exists
 * to stop a form being hammered, not as a security boundary.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateLimit = { limit: number; windowMs: number };

export const PER_IP: RateLimit = { limit: 5, windowMs: 10 * 60_000 };
export const PER_MOBILE: RateLimit = { limit: 3, windowMs: 60 * 60_000 };

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function hit(
  key: string,
  { limit, windowMs }: RateLimit,
  now = Date.now(),
): RateLimitResult {
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/** Exposed for tests. */
export function reset() {
  windows.clear();
  lastSweep = 0;
}
