import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";
import * as repo from "../repo";
import {
  IMPORT_GAP_LABELS,
  seedEntryKind,
  type ClinicSeedPack,
  type ImportGap,
} from "./types";

const ACTOR = "seed";
const REPORT_PATH = "docs/CLINIC_IMPORT_REPORT.md";

export type SeedResult = {
  slug: string;
  offers: number;
  kbEntries: number;
  blocked: number;
  instructions: number;
  gaps: ImportGap[];
  notes: string[];
  skipped: boolean;
  skipReason?: string;
};

function assertSource(pack: ClinicSeedPack) {
  if (!existsSync(pack.sourceFile)) {
    throw new Error(`${pack.sourceFile} not found`);
  }
  const source = readFileSync(pack.sourceFile, "utf8");
  const missing = pack.sourceAssertions.filter((s) => !source.includes(s));
  if (missing.length > 0) {
    throw new Error(
      `Seed and ${pack.sourceFile} have drifted. Not found:\n  ${missing.join("\n  ")}`,
    );
  }
}

export async function seedClinicPack(
  pack: ClinicSeedPack,
  tx: Parameters<Parameters<typeof repo.withTransaction>[0]>[0],
): Promise<SeedResult> {
  if (!existsSync(pack.sourceFile)) {
    return {
      slug: pack.clinic.slug,
      offers: 0,
      kbEntries: 0,
      blocked: 0,
      instructions: 0,
      gaps: pack.importGaps,
      notes: pack.importNotes,
      skipped: true,
      skipReason: `${pack.sourceFile} not found`,
    };
  }

  assertSource(pack);

  const existing = await repo.clinics.getClinicBySlug(pack.clinic.slug, tx);
  const clinic = existing
    ? ((await repo.clinics.updateClinic(existing.id, pack.clinic, tx)) ??
      existing)
    : await repo.clinics.createClinic(pack.clinic, tx);

  const clinicId = clinic.id;

  await repo.blockedTerms.addBlockedTerms(clinicId, S4_BASELINE_TERMS, tx);

  const existingOffers = await repo.offers.listOffers(clinicId, {}, tx);
  const offerIdByKey = new Map<string, string>();

  for (const offer of pack.offers) {
    const values = {
      name: offer.name,
      priceCents: offer.priceCents,
      priceDisplay: offer.priceDisplay ?? "",
      rrpDisplay: offer.rrpDisplay ?? undefined,
      bookingUrl: offer.bookingUrl ?? "",
      active: true,
      notes: offer.notes ?? "",
    };
    const match = existingOffers.find((o) => o.name === offer.name);
    const saved = match
      ? ((await repo.offers.updateOffer(clinicId, match.id, values, tx)) ??
        match)
      : await repo.offers.createOffer(clinicId, values, tx);
    offerIdByKey.set(offer.key, saved.id);
  }

  for (const entry of pack.entries) {
    await repo.kb.upsertKbEntry(
      clinicId,
      {
        entryKey: entry.entryKey,
        category: entry.category,
        offerId: entry.offerKey
          ? (offerIdByKey.get(entry.offerKey) ?? null)
          : null,
        title: entry.title,
        body: entry.body,
        status: "active",
        answerMode: entry.answerMode ?? "answerable",
        entryKind: seedEntryKind(entry),
        blockDeflect: entry.blockDeflect ?? null,
        triggerTerms: entry.triggerTerms ?? [],
        source: "imported",
        createdBy: ACTOR,
      },
      tx,
    );
  }

  const blocked = pack.entries.filter((e) => e.answerMode === "blocked").length;
  const instructions = pack.entries.filter(
    (e) => seedEntryKind(e) === "instruction",
  ).length;

  await repo.audit.recordAudit(
    clinicId,
    {
      actor: ACTOR,
      action: "clinic.seeded",
      entityType: "clinic",
      entityId: clinicId,
      after: {
        source: pack.sourceFile,
        offers: pack.offers.length,
        kbEntries: pack.entries.length,
        blockedTerms: S4_BASELINE_TERMS.length,
        importGaps: pack.importGaps,
      },
    },
    tx,
  );

  return {
    slug: pack.clinic.slug,
    offers: pack.offers.length,
    kbEntries: pack.entries.length,
    blocked,
    instructions,
    gaps: pack.importGaps,
    notes: pack.importNotes,
    skipped: false,
  };
}

export function formatImportReport(results: SeedResult[]): string {
  const lines: string[] = [
    "# Clinic import report",
    "",
    "Generated when `npm run db:seed` or `docker compose exec app node dist/seed.cjs` runs.",
    "Lists what was imported from each converted skill file and what is still missing.",
    "",
    "Voice is empty for every clinic until the client writes it.",
    "",
  ];

  for (const row of results) {
    lines.push(`## ${row.slug}`);
    lines.push("");
    if (row.skipped) {
      lines.push(`**Skipped:** ${row.skipReason}`);
      lines.push("");
      continue;
    }
    lines.push(
      `Imported: ${row.offers} offers, ${row.kbEntries} knowledge base entries (${row.blocked} blocked, ${row.instructions} instructions).`,
    );
    lines.push("");
    if (row.gaps.length > 0) {
      lines.push("**Missing from skill file (gaps):**");
      for (const gap of row.gaps) {
        lines.push(`- ${IMPORT_GAP_LABELS[gap]}`);
      }
      lines.push("");
    } else {
      lines.push("**Missing from skill file:** none flagged.");
      lines.push("");
    }
    if (row.notes.length > 0) {
      lines.push("**Notes:**");
      for (const note of row.notes) {
        lines.push(`- ${note}`);
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Always prints the report. Writes docs/CLINIC_IMPORT_REPORT.md only when
 * that directory already exists (local checkout). The production image has
 * no docs/, so a write there must never fail the seed.
 */
export function writeImportReport(results: SeedResult[]): void {
  const body = formatImportReport(results);
  console.log(body);

  const dir = dirname(REPORT_PATH);
  if (!existsSync(dir)) {
    console.log(
      `import report not written to ${REPORT_PATH}: ${dir}/ is not in this environment`,
    );
    return;
  }

  try {
    writeFileSync(REPORT_PATH, body, "utf8");
    console.log(`import report written to ${REPORT_PATH}`);
  } catch (error) {
    console.warn(
      `import report not written to ${REPORT_PATH}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

export function printSeedSummary(results: SeedResult[]) {
  for (const row of results) {
    if (row.skipped) {
      console.log(`skip  ${row.slug}: ${row.skipReason}`);
      continue;
    }
    console.log(
      [
        `seeded ${row.slug}`,
        `  offers:        ${row.offers}`,
        `  kb entries:    ${row.kbEntries} (${row.blocked} blocked, ${row.instructions} instructions)`,
        row.gaps.length > 0
          ? `  gaps:          ${row.gaps.map((g) => IMPORT_GAP_LABELS[g]).join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}
