import { describe, expect, it } from "vitest";

import { extractJsonObject } from "./json";

const OBJECT = '{"draft":"hi","self_confidence":90}';

describe("extractJsonObject", () => {
  it("leaves a bare object alone", () => {
    expect(extractJsonObject(OBJECT)).toBe(OBJECT);
  });

  it("unwraps a fence with a language tag", () => {
    expect(extractJsonObject("```json\n" + OBJECT + "\n```")).toBe(OBJECT);
  });

  it("unwraps a fence with no language tag", () => {
    expect(extractJsonObject("```\n" + OBJECT + "\n```")).toBe(OBJECT);
  });

  /**
   * Taken verbatim from a live response: the model wrote the SMS as prose and
   * then repeated it inside a fenced object.
   */
  it("finds the object after a prose preamble and a fence", () => {
    const response = [
      "$399, it's 50% off for new clients. Want to lock in a time?",
      "",
      "```json",
      OBJECT,
      "```",
    ].join("\n");

    expect(extractJsonObject(response)).toBe(OBJECT);
  });

  it("finds a bare object after a preamble", () => {
    expect(extractJsonObject("Here is the reply: " + OBJECT)).toBe(OBJECT);
  });

  it("takes the last block when the model corrects itself", () => {
    const response = [
      "```json",
      '{"draft":"first attempt"}',
      "```",
      "Actually, better:",
      "```json",
      OBJECT,
      "```",
    ].join("\n");

    expect(extractJsonObject(response)).toBe(OBJECT);
  });

  it("does not turn an unterminated fence into something that parses", () => {
    expect(extractJsonObject("```json")).toBe("```json");
  });

  it("leaves prose with no object in it alone, so it fails the schema check", () => {
    expect(extractJsonObject("I cannot answer that.")).toBe(
      "I cannot answer that.",
    );
  });
});
