import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  isExternalInboundPost,
  isKnownServerActionId,
  mightBeServerActionId,
  resetKnownServerActionIdsForTests,
  staleServerActionResponse,
} from "./stale-action";

const SAMPLE_ID = "6096da5294fccac4e85e0b3b47d668c63f186a7c59";

describe("mightBeServerActionId", () => {
  it("accepts hex ids from the build manifest shape", () => {
    expect(mightBeServerActionId(SAMPLE_ID)).toBe(true);
  });

  it("rejects ids from an older build format", () => {
    expect(mightBeServerActionId("4a68-action-from-old-bundle")).toBe(false);
    expect(mightBeServerActionId("")).toBe(false);
    expect(mightBeServerActionId("zzzz")).toBe(false);
  });
});

describe("isKnownServerActionId", () => {
  beforeEach(() => {
    resetKnownServerActionIdsForTests();
    process.env.SERVER_ACTION_IDS = JSON.stringify([SAMPLE_ID]);
  });

  it("matches ids inlined from the build env", () => {
    expect(isKnownServerActionId(SAMPLE_ID)).toBe(true);
    expect(isKnownServerActionId("deadbeef")).toBe(false);
  });
});

describe("isExternalInboundPost", () => {
  it("covers widget and webhook POST paths", () => {
    expect(
      isExternalInboundPost(
        new NextRequest("https://example.com/api/widget/beauty-soiree", {
          method: "POST",
        }),
      ),
    ).toBe(true);
    expect(
      isExternalInboundPost(
        new NextRequest(
          "https://example.com/api/webhooks/mobile-message/inbound",
          { method: "POST" },
        ),
      ),
    ).toBe(true);
  });

  it("does not cover dashboard server action pages", () => {
    expect(
      isExternalInboundPost(
        new NextRequest("https://example.com/queue", { method: "POST" }),
      ),
    ).toBe(false);
  });
});

describe("staleServerActionResponse", () => {
  beforeEach(() => {
    resetKnownServerActionIdsForTests();
    vi.stubEnv("NODE_ENV", "production");
    process.env.SERVER_ACTION_IDS = JSON.stringify([SAMPLE_ID]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips widget POSTs even when Next-Action is present", () => {
    const response = staleServerActionResponse(
      new NextRequest("https://example.com/api/widget/beauty-soiree", {
        method: "POST",
        headers: { "Next-Action": "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef" },
      }),
    );
    expect(response).toBeNull();
  });

  it("skips webhook POSTs even when Next-Action is present", () => {
    const response = staleServerActionResponse(
      new NextRequest(
        "https://example.com/api/webhooks/mobile-message/inbound",
        {
          method: "POST",
          headers: {
            "Next-Action": "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
          },
        },
      ),
    );
    expect(response).toBeNull();
  });
});
