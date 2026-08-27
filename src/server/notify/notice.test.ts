import { describe, expect, it } from "vitest";

import {
  buildQueueEmail,
  queueNotice,
  renderQueueEmail,
  renderQueueSms,
} from "./notice";

/**
 * A realistic queued draft, used only as poison. If any of this lands in the
 * email or SMS, personal data has left Sydney.
 */
const POISON = {
  contactName: "Priya Sharma",
  contactMobile: "+61405333444",
  formattedMobile: "0405 333 444",
  question: "how much are the feather touch brows and who does them?",
  draftBody:
    "Hey! Yes, the HIFU Lower Face, Jaw & Neck Lift is $499. Lisa does the brows.",
  failureCode: "SEGMENTS_EXCEEDED",
  failureDetail: "4 segments, cap is 3",
};

const CLINIC_NAME = "Beauty Soiree (Beauty Soiree Medispa, Brisbane)";
const APP_URL = "https://reply.clinicboost.com.au";

const notice = queueNotice({ name: CLINIC_NAME }, APP_URL);
const email = renderQueueEmail(notice);
const sms = renderQueueSms(notice);
const payload = buildQueueEmail({
  notice,
  from: "notify@notify.clinicboost.com.au",
  to: "ted@clinicboost.com.au",
  idempotencyKey: "queue-notice/not-a-draft-id",
});
const rendered = [
  email.subject,
  email.text,
  email.html,
  sms,
  payload.subject,
  payload.text,
  payload.html,
];

describe("queueNotice", () => {
  it("is clinic name and a dashboard link, and nothing else", () => {
    expect(notice).toEqual({
      clinicName: CLINIC_NAME,
      dashboardUrl: "https://reply.clinicboost.com.au/queue",
    });
    expect(Object.keys(notice).sort()).toEqual(["clinicName", "dashboardUrl"]);
  });

  it("does not copy extra fields even if a caller holds them on the same object", () => {
    const clinic = { name: CLINIC_NAME, ...POISON };
    const built = queueNotice(clinic, APP_URL);
    expect(built).toEqual(notice);
  });
});

describe("the rendered email and SMS carry no personal data", () => {
  it("names the clinic and points at the queue", () => {
    for (const body of rendered) {
      expect(body).toContain(CLINIC_NAME);
    }
    for (const body of [email.text, email.html, sms, payload.text, payload.html]) {
      expect(body).toContain("https://reply.clinicboost.com.au/queue");
    }
  });

  it("the Resend payload is the same two fields, plus an envelope", () => {
    expect(payload.from).toBe("notify@notify.clinicboost.com.au");
    expect(payload.to).toBe("ted@clinicboost.com.au");
    expect(Object.keys(payload).sort()).toEqual(
      ["from", "html", "idempotencyKey", "subject", "text", "to"].sort(),
    );
  });

  it("does not contain the question, the mobile, the name, the draft, or a failure code", () => {
    const forbidden = [
      POISON.contactName,
      POISON.contactMobile,
      POISON.formattedMobile,
      POISON.question,
      POISON.draftBody,
      POISON.failureCode,
      POISON.failureDetail,
      "Sharma",
      "feather touch",
      "$499",
    ];

    for (const body of rendered) {
      for (const leak of forbidden) {
        expect(body, leaked(leak, body)).not.toContain(leak);
      }
    }
  });

  it("does not use an em dash, an emoji, or a smart quote", () => {
    for (const body of rendered) {
      expect(body).not.toMatch(/[\u2014\u2018\u2019\u201C\u201D\u2026]/);
      expect(body).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});

function leaked(needle: string, haystack: string): string {
  return `notification contained ${JSON.stringify(needle)}: ${haystack}`;
}
