import { describe, expect, it } from "vitest";

import {
  absolutePublicUrl,
  isBindHostname,
  publicOrigin,
} from "./public-url";

const PUBLIC = "https://reply.clinicboost.com.au";

describe("publicOrigin", () => {
  it("uses APP_URL when set", () => {
    expect(publicOrigin({ appUrl: PUBLIC })).toBe(PUBLIC);
  });

  it("keeps localhost APP_URL for local development", () => {
    expect(publicOrigin({ appUrl: "http://localhost:3000" })).toBe(
      "http://localhost:3000",
    );
  });

  it("falls through to forwarded headers when APP_URL is the bind address", () => {
    expect(
      publicOrigin({
        appUrl: "http://0.0.0.0:3000",
        forwardedHost: "reply.clinicboost.com.au",
        forwardedProto: "https",
      }),
    ).toBe(PUBLIC);
  });

  it("uses the first hop of comma-separated forwarded headers", () => {
    expect(
      publicOrigin({
        appUrl: "",
        forwardedHost: "reply.clinicboost.com.au, internal.local",
        forwardedProto: "https, http",
      }),
    ).toBe(PUBLIC);
  });
});

describe("absolutePublicUrl", () => {
  it("builds redirects that never contain 0.0.0.0 or localhost behind Caddy", () => {
    const cases = [
      absolutePublicUrl("/login?error=wrong&from=%2F", { appUrl: PUBLIC }),
      absolutePublicUrl("/queue", {
        appUrl: "http://0.0.0.0:3000",
        forwardedHost: "reply.clinicboost.com.au",
        forwardedProto: "https",
      }),
      absolutePublicUrl("/", {
        appUrl: "",
        forwardedHost: "reply.clinicboost.com.au",
        forwardedProto: "https",
      }),
    ];

    for (const url of cases) {
      expect(url.href).not.toMatch(/0\.0\.0\.0/);
      expect(url.href).not.toMatch(/localhost/i);
      expect(url.href).not.toMatch(/127\.0\.0\.1/);
      expect(url.origin).toBe(PUBLIC);
    }
  });

  it("does not resolve against the request bind URL", () => {
    // What broke login: NextResponse.redirect(new URL(path, request.url)).
    const bindRequestUrl = "http://0.0.0.0:3000/api/login";
    expect(new URL("/login", bindRequestUrl).href).toContain("0.0.0.0");

    const fixed = absolutePublicUrl("/login", { appUrl: PUBLIC });
    expect(fixed.href).toBe(`${PUBLIC}/login`);
    expect(fixed.href).not.toContain("0.0.0.0");
    expect(fixed.href).not.toMatch(/localhost/i);
  });
});

describe("isBindHostname", () => {
  it("flags all-interfaces listen addresses only", () => {
    expect(isBindHostname("0.0.0.0")).toBe(true);
    expect(isBindHostname("::")).toBe(true);
    expect(isBindHostname("localhost")).toBe(false);
    expect(isBindHostname("127.0.0.1")).toBe(false);
    expect(isBindHostname("reply.clinicboost.com.au")).toBe(false);
  });
});
