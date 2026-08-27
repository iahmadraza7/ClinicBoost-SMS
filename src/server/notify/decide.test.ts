import { describe, expect, it } from "vitest";

import { decideEscalation, decideQueueEmail } from "./decide";

describe("decideQueueEmail", () => {
  it("sends when the clinic wants email and an address is configured", () => {
    expect(
      decideQueueEmail({
        notifyEmail: true,
        operatorEmail: "ted@clinicboost.com.au",
      }),
    ).toBe("send");
  });

  it("claims without sending when email is off, so a later toggle does not dump the backlog", () => {
    expect(
      decideQueueEmail({
        notifyEmail: false,
        operatorEmail: "ted@clinicboost.com.au",
      }),
    ).toBe("claim_without_sending");
  });

  it("claims without sending when no operator address is configured", () => {
    expect(
      decideQueueEmail({ notifyEmail: true, operatorEmail: undefined }),
    ).toBe("claim_without_sending");
  });
});

describe("decideEscalation", () => {
  it("sends when SMS alerts are on and a mobile is configured", () => {
    expect(
      decideEscalation({
        globalKillSwitch: false,
        notifySms: true,
        operatorMobile: "+61400000000",
      }),
    ).toBe("send");
  });

  it("defers when the global kill switch is on, so the next sweep can retry", () => {
    expect(
      decideEscalation({
        globalKillSwitch: true,
        notifySms: true,
        operatorMobile: "+61400000000",
      }),
    ).toBe("defer");
  });

  it("still claims without sending when SMS is off, even if the kill switch is on", () => {
    expect(
      decideEscalation({
        globalKillSwitch: true,
        notifySms: false,
        operatorMobile: "+61400000000",
      }),
    ).toBe("claim_without_sending");
  });

  it("claims without sending when SMS alerts are off", () => {
    expect(
      decideEscalation({
        globalKillSwitch: false,
        notifySms: false,
        operatorMobile: "+61400000000",
      }),
    ).toBe("claim_without_sending");
  });

  it("claims without sending when no operator mobile is configured", () => {
    expect(
      decideEscalation({
        globalKillSwitch: false,
        notifySms: true,
        operatorMobile: undefined,
      }),
    ).toBe("claim_without_sending");
  });
});
