import { describe, expect, it } from "vitest";

import { isPublicPath, safeReturnTo } from "./paths";

describe("isPublicPath", () => {
  it("lets the operator reach the login page and POST handler", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/")).toBe(true);
    expect(isPublicPath("/api/login")).toBe(true);
  });

  it("lets the widget through, including OPTIONS on the clinic slug", () => {
    expect(isPublicPath("/api/widget/beauty-soiree")).toBe(true);
    expect(isPublicPath("/api/widget")).toBe(true);
    expect(isPublicPath("/widget.js")).toBe(true);
  });

  it("lets both Mobile Message webhooks through", () => {
    expect(isPublicPath("/api/webhooks/mobile-message/inbound")).toBe(true);
    expect(isPublicPath("/api/webhooks/mobile-message/status")).toBe(true);
  });

  it("does not treat a lookalike path as public", () => {
    expect(isPublicPath("/login-please")).toBe(false);
    expect(isPublicPath("/api/widget-admin")).toBe(false);
    expect(isPublicPath("/api/webhooks-debug")).toBe(false);
  });

  it("protects the dashboard, the health ping, and everything else", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/queue")).toBe(false);
    expect(isPublicPath("/audit")).toBe(false);
    expect(isPublicPath("/api/health")).toBe(false);
  });
});

describe("safeReturnTo", () => {
  it("returns the operator to a same-origin path they were trying to open", () => {
    expect(safeReturnTo("/queue")).toBe("/queue");
    expect(safeReturnTo("/queue?clinic=beauty-soiree")).toBe(
      "/queue?clinic=beauty-soiree",
    );
  });

  it("defaults to home when the value is missing or unsafe", () => {
    expect(safeReturnTo(undefined)).toBe("/");
    expect(safeReturnTo("")).toBe("/");
    expect(safeReturnTo("https://evil.example/phish")).toBe("/");
    expect(safeReturnTo("//evil.example")).toBe("/");
    expect(safeReturnTo("/\\evil.example")).toBe("/");
    expect(safeReturnTo("/login")).toBe("/");
    expect(safeReturnTo("/login?from=/queue")).toBe("/");
  });
});
