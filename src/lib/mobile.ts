/**
 * Australian mobile numbers, normalised to E.164.
 *
 * Contact identity is (clinic_id, mobile), so the same person typing
 * "0405 087 121" on the widget and texting in from +61405087121 has to land on
 * one contact and one conversation. Everything is stored in E.164.
 */

const AU_MOBILE = /^\+614\d{8}$/;

export function normaliseAuMobile(input: string): string | null {
  const digits = input.replace(/[\s()\-.]/g, "");

  let candidate: string;
  if (digits.startsWith("+61")) {
    candidate = digits;
  } else if (digits.startsWith("61") && digits.length === 11) {
    candidate = `+${digits}`;
  } else if (digits.startsWith("0") && digits.length === 10) {
    candidate = `+61${digits.slice(1)}`;
  } else if (digits.startsWith("4") && digits.length === 9) {
    candidate = `+61${digits}`;
  } else {
    return null;
  }

  return AU_MOBILE.test(candidate) ? candidate : null;
}

export function isAuMobile(input: string): boolean {
  return normaliseAuMobile(input) !== null;
}

/** 0405 087 121, for showing back to the operator. */
export function formatAuMobile(e164: string): string {
  if (!AU_MOBILE.test(e164)) return e164;
  const national = `0${e164.slice(3)}`;
  return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
}
