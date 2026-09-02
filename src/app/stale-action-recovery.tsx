"use client";

import { useEffect } from "react";

import { STALE_ACTION_HEADER } from "@/lib/stale-action";

/**
 * Backup when a stale server action slips past middleware (mixed versions
 * during deploy, or a response shape we did not anticipate). Reload once.
 */
export function StaleActionRecovery() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);

      if (!isServerActionFetch(input, init)) {
        return response;
      }

      if (response.headers.get(STALE_ACTION_HEADER) === "1") {
        window.location.reload();
        return hang();
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (response.ok && contentType.includes("text/html")) {
        window.location.reload();
        return hang();
      }

      if (!response.ok) {
        const text = await response.clone().text();
        if (isStaleActionErrorBody(text)) {
          window.location.reload();
          return hang();
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

function isServerActionFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): boolean {
  if (init?.method?.toUpperCase() === "POST") {
    const headers = new Headers(init.headers);
    if (headers.has("Next-Action") || headers.has("next-action")) return true;
  }

  if (input instanceof Request) {
    if (input.method.toUpperCase() !== "POST") return false;
    return input.headers.has("Next-Action") || input.headers.has("next-action");
  }

  return false;
}

function isStaleActionErrorBody(text: string): boolean {
  return (
    text.includes("Server Reference ID did not match the expected format") ||
    text.includes("Failed to find Server Action")
  );
}

function hang(): Promise<Response> {
  return new Promise(() => {});
}
