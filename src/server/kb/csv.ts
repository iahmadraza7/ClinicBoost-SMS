/**
 * Per-treatment booking URLs arrive as a CSV: treatment name, booking URL,
 * price display. Parse fails on a malformed URL so a bad link never sits in a
 * preview that looks ready to import.
 */

export type CsvBookingRow = {
  line: number;
  name: string;
  bookingUrl: string;
  priceDisplay: string;
};

export type BookingCsvPlanRow = {
  action: "create" | "update" | "skip";
  name: string;
  bookingUrl: string;
  priceDisplay: string;
  entryKey: string;
  offerId: string | null;
  entryId: string | null;
};

export type BookingCsvPlan = {
  created: BookingCsvPlanRow[];
  updated: BookingCsvPlanRow[];
  skipped: BookingCsvPlanRow[];
};

type OfferSnap = {
  id: string;
  name: string;
  bookingUrl: string;
  priceDisplay: string;
};

type EntrySnap = {
  id: string;
  entryKey: string;
  category: string;
  offerId: string | null;
  body: string;
  status: string;
};

const NAME_HEADERS = new Set([
  "name",
  "treatment",
  "treatment name",
  "treatment_name",
]);
const URL_HEADERS = new Set([
  "url",
  "booking url",
  "booking_url",
  "bookingurl",
  "link",
]);
const PRICE_HEADERS = new Set([
  "price",
  "price display",
  "price_display",
  "pricedisplay",
]);

export function parseCsv(text: string): string[][] {
  const src = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += c;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "") || rows.length === 0) {
    rows.push(row);
  }
  return rows;
}

function headerKey(raw: string): string {
  return raw.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
}

export function parseBookingUrl(raw: string): string | { error: string } {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { error: `"${trimmed}" is not a URL` };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      error: `"${trimmed}" must start with http:// or https://`,
    };
  }
  if (url.username || url.password) {
    return { error: `"${trimmed}" cannot include a username or password` };
  }
  return trimmed;
}

/**
 * Rejects the file if any booking URL is malformed. Callers never see a
 * preview that contains a row they cannot safely import.
 */
export function parseBookingCsv(
  text: string,
): { rows: CsvBookingRow[] } | { error: string } {
  const table = parseCsv(text);
  if (table.length === 0) return { error: "The CSV is empty" };

  const header = table[0].map(headerKey);
  const nameIdx = header.findIndex((h) => NAME_HEADERS.has(h));
  const urlIdx = header.findIndex((h) => URL_HEADERS.has(h));
  const priceIdx = header.findIndex((h) => PRICE_HEADERS.has(h));

  if (nameIdx < 0 || urlIdx < 0 || priceIdx < 0) {
    return {
      error:
        "The CSV needs columns for treatment name, booking URL and price display",
    };
  }

  const rows: CsvBookingRow[] = [];
  const urlErrors: string[] = [];
  const seenNames = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const cells = table[i];
    const line = i + 1;
    const name = (cells[nameIdx] ?? "").trim();
    const bookingUrlRaw = (cells[urlIdx] ?? "").trim();
    const priceDisplay = (cells[priceIdx] ?? "").trim();

    if (!name && !bookingUrlRaw && !priceDisplay) continue;

    if (!name) {
      return { error: `Line ${line}: treatment name is required` };
    }
    if (!priceDisplay) {
      return { error: `Line ${line}: price display is required` };
    }
    if (!bookingUrlRaw) {
      urlErrors.push(`Line ${line}: booking URL is required`);
      continue;
    }

    const parsedUrl = parseBookingUrl(bookingUrlRaw);
    if (typeof parsedUrl !== "string") {
      urlErrors.push(`Line ${line}: ${parsedUrl.error}`);
      continue;
    }

    const nameKey = normaliseName(name);
    if (seenNames.has(nameKey)) {
      return {
        error: `Line ${line}: "${name}" appears more than once in the file`,
      };
    }
    seenNames.add(nameKey);

    rows.push({ line, name, bookingUrl: parsedUrl, priceDisplay });
  }

  if (urlErrors.length > 0) {
    return { error: urlErrors.join(". ") };
  }
  if (rows.length === 0) {
    return { error: "The CSV has a header but no treatment rows" };
  }

  return { rows };
}

export function normaliseName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function bookingEntryKey(clinicSlug: string, treatmentName: string): string {
  const slug = treatmentName
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clinicSlug}.${slug}.booking-url`;
}

export function priceCentsFromDisplay(display: string): number | null {
  const m = display.replace(/,/g, "").match(/\$?\s*(\d+)(?:\.(\d{1,2}))?/);
  if (!m) return null;
  const dollars = Number(m[1]);
  const cents = m[2] ? Number(m[2].padEnd(2, "0")) : 0;
  return dollars * 100 + cents;
}

export function planBookingCsv(
  clinicSlug: string,
  rows: CsvBookingRow[],
  offers: OfferSnap[],
  entries: EntrySnap[],
): BookingCsvPlan | { error: string } {
  const offersByName = new Map(
    offers.map((o) => [normaliseName(o.name), o] as const),
  );
  const usedEntryIds = new Set<string>();

  const created: BookingCsvPlanRow[] = [];
  const updated: BookingCsvPlanRow[] = [];
  const skipped: BookingCsvPlanRow[] = [];

  for (const row of rows) {
    const offer = offersByName.get(normaliseName(row.name)) ?? null;
    const generatedKey = bookingEntryKey(clinicSlug, row.name);
    const linked = offer
      ? entries.find(
          (e) =>
            e.offerId === offer.id &&
            e.category === "booking" &&
            !usedEntryIds.has(e.id),
        )
      : undefined;
    const byKey = entries.find(
      (e) => e.entryKey === generatedKey && !usedEntryIds.has(e.id),
    );

    if (byKey && byKey.category !== "booking") {
      return {
        error: `Key "${generatedKey}" already exists as a ${byKey.category} entry. Rename the treatment or that entry before importing.`,
      };
    }

    const existingEntry = linked ?? byKey ?? null;
    if (existingEntry) usedEntryIds.add(existingEntry.id);

    const sameOffer =
      offer &&
      offer.bookingUrl === row.bookingUrl &&
      offer.priceDisplay === row.priceDisplay;
    const sameEntry =
      existingEntry && existingEntry.body.trim() === row.bookingUrl;

    const planned: BookingCsvPlanRow = {
      action: "create",
      name: row.name,
      bookingUrl: row.bookingUrl,
      priceDisplay: row.priceDisplay,
      entryKey: existingEntry?.entryKey ?? generatedKey,
      offerId: offer?.id ?? null,
      entryId: existingEntry?.id ?? null,
    };

    if (offer && existingEntry && sameOffer && sameEntry) {
      planned.action = "skip";
      skipped.push(planned);
      continue;
    }

    if (offer || existingEntry) {
      planned.action = "update";
      updated.push(planned);
      continue;
    }

    created.push(planned);
  }

  return { created, updated, skipped };
}

export function planCounts(plan: BookingCsvPlan): {
  created: number;
  updated: number;
  skipped: number;
} {
  return {
    created: plan.created.length,
    updated: plan.updated.length,
    skipped: plan.skipped.length,
  };
}
