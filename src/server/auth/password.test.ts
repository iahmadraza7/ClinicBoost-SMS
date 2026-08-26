import { describe, expect, it } from "vitest";

import { authenticate, normaliseEmail, operatorFromEnv } from "./credentials";
import { hashPassword, verifyPassword } from "./password";

const password = "a-reasonably-long-passphrase";
const passwordHash = hashPassword(password);

const operator = {
  email: "ted@clinicboost.com.au",
  passwordHash,
};

describe("verifyPassword", () => {
  it("accepts the password that produced the hash", () => {
    expect(verifyPassword(password, passwordHash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyPassword("not-the-password", passwordHash)).toBe(false);
  });

  it("rejects a truncated hash rather than throwing", () => {
    expect(verifyPassword(password, "scrypt:aaa")).toBe(false);
    expect(verifyPassword(password, "bcrypt:not-this-scheme")).toBe(false);
    expect(verifyPassword(password, "")).toBe(false);
  });

  it("does not treat two hashes of the same password as interchangeable", () => {
    expect(hashPassword(password)).not.toBe(hashPassword(password));
  });
});

describe("authenticate", () => {
  it("accepts the configured operator", () => {
    expect(authenticate("ted@clinicboost.com.au", password, operator)).toBe(
      true,
    );
  });

  it("is case-insensitive on the email", () => {
    expect(authenticate("Ted@ClinicBoost.com.au", password, operator)).toBe(
      true,
    );
  });

  it("rejects a wrong email with the right password", () => {
    expect(
      authenticate("someone-else@clinicboost.com.au", password, operator),
    ).toBe(false);
  });

  it("rejects the right email with a wrong password", () => {
    expect(authenticate("ted@clinicboost.com.au", "nope", operator)).toBe(false);
  });

  it("rejects everything when the operator is not configured", () => {
    expect(authenticate("ted@clinicboost.com.au", password, null)).toBe(false);
  });
});

describe("operatorFromEnv", () => {
  it("returns null when either value is missing", () => {
    expect(operatorFromEnv({})).toBeNull();
    expect(operatorFromEnv({ OPERATOR_EMAIL: "a@b.c" })).toBeNull();
    expect(operatorFromEnv({ OPERATOR_PASSWORD_HASH: passwordHash })).toBeNull();
  });

  it("normalises the stored email", () => {
    const fromEnv = operatorFromEnv({
      OPERATOR_EMAIL: "Ted@ClinicBoost.com.au",
      OPERATOR_PASSWORD_HASH: passwordHash,
    });
    expect(fromEnv?.email).toBe("ted@clinicboost.com.au");
  });
});

describe("normaliseEmail", () => {
  it("trims and lowercases", () => {
    expect(normaliseEmail("  Ted@Example.COM ")).toBe("ted@example.com");
  });
});
