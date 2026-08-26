import { describe, expect, it } from "vitest";

import {
  inboundPayloadSchema,
  isFinalPart,
  isStopKeyword,
  mapProviderStatus,
  statusPayloadSchema,
} from "./webhook-payloads";

/** Copied from the vendor's webhook documentation. */
const INBOUND = {
  to: "61400000010",
  sender: "61412345678",
  message: "Yes, I'd like to confirm my appointment",
  received_at: "2026-03-08 14:35:00",
  type: "inbound",
  original_message_id: "abcd1234-efgh-5678-ijkl-9876543210mn",
  original_custom_ref: "tracking001",
};

const STATUS = {
  to: "61412345678",
  sender: "MyBrand",
  message: "Your appointment is confirmed for tomorrow at 3pm",
  custom_ref: "tracking001",
  status: "delivered",
  message_id: "abcd1234-efgh-5678-ijkl-9876543210mn",
  received_at: "2026-03-08 14:35:00",
  part_number: 1,
  total_parts: 1,
};

function omit<T extends object, K extends keyof T>(
  source: T,
  ...keys: K[]
): Omit<T, K> {
  const copy = { ...source };
  for (const key of keys) delete copy[key];
  return copy;
}

describe("payload parsing", () => {
  it("accepts the documented inbound body", () => {
    expect(inboundPayloadSchema.parse(INBOUND).type).toBe("inbound");
  });

  it("accepts an unsubscribe event", () => {
    const parsed = inboundPayloadSchema.parse({ ...INBOUND, type: "unsubscribe" });
    expect(parsed.type).toBe("unsubscribe");
  });

  it("rejects an event type we do not handle", () => {
    expect(
      inboundPayloadSchema.safeParse({ ...INBOUND, type: "something_new" }).success,
    ).toBe(false);
  });

  it("rejects a body with no sender to reply to", () => {
    expect(inboundPayloadSchema.safeParse(omit(INBOUND, "sender")).success).toBe(
      false,
    );
  });

  it("accepts the documented status body", () => {
    expect(statusPayloadSchema.parse(STATUS).message_id).toBe(STATUS.message_id);
  });

  it("rejects rubbish posted at the endpoint", () => {
    expect(statusPayloadSchema.safeParse({ hello: "world" }).success).toBe(false);
    expect(inboundPayloadSchema.safeParse(null).success).toBe(false);
  });
});

describe("provider status mapping", () => {
  it.each([
    ["pending", "queued"],
    ["scheduled", "queued"],
    ["sent", "sent"],
    ["delivered", "delivered"],
    ["failed", "failed"],
    ["cancelled", "rejected"],
  ])("maps %s to %s", (provider, ours) => {
    expect(mapProviderStatus(provider)).toBe(ours);
  });

  it("is not case sensitive", () => {
    expect(mapProviderStatus("Delivered")).toBe("delivered");
  });

  it("returns null for a status it does not know, rather than guessing", () => {
    expect(mapProviderStatus("teleported")).toBeNull();
  });
});

describe("multi-part receipts", () => {
  it("waits for the last part before settling the message", () => {
    expect(isFinalPart({ ...STATUS, part_number: 1, total_parts: 3 })).toBe(false);
    expect(isFinalPart({ ...STATUS, part_number: 3, total_parts: 3 })).toBe(true);
  });

  it("treats a receipt with no part information as final", () => {
    expect(isFinalPart(omit(STATUS, "part_number", "total_parts"))).toBe(true);
  });
});

describe("opt-out keywords", () => {
  it.each(["STOP", "stop", "Stop.", " unsubscribe ", "opt out", "QUIT", "remove me"])(
    "treats %j as an opt-out",
    (body) => {
      expect(isStopKeyword(body)).toBe(true);
    },
  );

  it.each([
    "stop by on tuesday",
    "can I stop the treatment early",
    "do you have a stop smoking service",
    "how much is the hifu",
  ])("does not treat %j as an opt-out", (body) => {
    expect(isStopKeyword(body)).toBe(false);
  });
});
