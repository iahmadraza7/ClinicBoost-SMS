import { describe, expect, it } from "vitest";

import { anthropicFromHttp, anthropicKeyFailure } from "./anthropic";

describe("anthropicKeyFailure", () => {
  it("fails when the key is missing", () => {
    expect(anthropicKeyFailure(undefined)?.detail).toBe(
      "ANTHROPIC_API_KEY is not set.",
    );
    expect(anthropicKeyFailure("")?.detail).toBe("ANTHROPIC_API_KEY is not set.");
    expect(anthropicKeyFailure("   ")?.detail).toBe(
      "ANTHROPIC_API_KEY is not set.",
    );
    expect(anthropicKeyFailure(undefined)?.tone).toBe("fail");
  });

  it("fails a placeholder the same way a rejected key fails", () => {
    const check = anthropicKeyFailure("REPLACE");
    expect(check?.tone).toBe("fail");
    expect(check?.detail).toBe("Anthropic rejected the key.");
  });

  it("lets a real-looking key through to the API call", () => {
    expect(anthropicKeyFailure("sk-ant-api03-not-a-real-secret")).toBeNull();
  });
});

describe("anthropicFromHttp", () => {
  it("maps 401 and 403 to the same sentence Resend uses", () => {
    expect(anthropicFromHttp(401, "claude-sonnet-4-6").detail).toBe(
      "Anthropic rejected the key.",
    );
    expect(anthropicFromHttp(403, "claude-sonnet-4-6").tone).toBe("fail");
  });

  it("is green only after a successful messages call", () => {
    const check = anthropicFromHttp(200, "claude-sonnet-4-6");
    expect(check.tone).toBe("ok");
    expect(check.detail).toBe("Key is valid.");
  });

  it("fails when the configured model is not on the account", () => {
    const check = anthropicFromHttp(404, "claude-sonnet-4-6");
    expect(check.tone).toBe("fail");
    expect(check.detail).toMatch(/claude-sonnet-4-6/);
    expect(check.detail).toMatch(/not available/i);
  });

  it("reports the status Anthropic actually returned", () => {
    expect(anthropicFromHttp(529, "claude-sonnet-4-6").detail).toBe(
      "Anthropic returned 529.",
    );
  });
});
