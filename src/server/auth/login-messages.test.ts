import { describe, expect, it } from "vitest";

import { loginErrorMessage } from "./login-messages";

describe("loginErrorMessage", () => {
  it("returns plain operator-facing copy", () => {
    expect(loginErrorMessage("wrong")).toContain("Email or password");
    expect(loginErrorMessage("rate")).toContain("Too many attempts");
    expect(loginErrorMessage("config")).toContain("not configured");
  });
});
