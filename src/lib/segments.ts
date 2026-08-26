/**
 * GSM 03.38 segment counting.
 *
 * Segments cost money, so the operator sees a live count while editing and the
 * validator caps drafts before they send. One character outside the GSM
 * alphabet drops the whole message to UCS-2 and more than halves the capacity,
 * which is the real reason the formatting rules ban emojis and smart quotes.
 */

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

// These are encoded as an escape plus the character, so they cost two septets.
const GSM_EXTENDED = "^{}\\[~]|€";

const BASIC = new Set(GSM_BASIC.split(""));
const EXTENDED = new Set(GSM_EXTENDED.split(""));

export type SegmentInfo = {
  encoding: "gsm7" | "ucs2";
  /** Septets for gsm7, UTF-16 code units for ucs2. */
  units: number;
  segments: number;
  /** Units left before another segment is needed. */
  remaining: number;
  /** Characters that forced UCS-2. Empty when the text is clean GSM-7. */
  offendingChars: string[];
};

export function countSegments(text: string): SegmentInfo {
  const offending: string[] = [];
  let septets = 0;

  for (const char of text) {
    if (BASIC.has(char)) {
      septets += 1;
    } else if (EXTENDED.has(char)) {
      septets += 2;
    } else if (!offending.includes(char)) {
      offending.push(char);
    }
  }

  if (offending.length > 0) {
    // UCS-2 counts UTF-16 code units, so an emoji outside the BMP costs two.
    const units = [...text].reduce((n, c) => n + (c.codePointAt(0)! > 0xffff ? 2 : 1), 0);
    const segments = units <= 70 ? Math.max(1, Math.ceil(units / 70)) : Math.ceil(units / 67);
    const capacity = units <= 70 ? 70 : segments * 67;
    return {
      encoding: "ucs2",
      units,
      segments,
      remaining: capacity - units,
      offendingChars: offending,
    };
  }

  const segments = septets <= 160 ? 1 : Math.ceil(septets / 153);
  const capacity = septets <= 160 ? 160 : segments * 153;
  return {
    encoding: "gsm7",
    units: septets,
    segments,
    remaining: capacity - septets,
    offendingChars: [],
  };
}

export function segmentCount(text: string): number {
  return countSegments(text).segments;
}
