import "../bootstrap-env";

import { existsSync, readFileSync } from "node:fs";

import { S4_BASELINE_TERMS } from "../compliance/s4-baseline";
import * as repo from "../repo";
import { CLINIC, ENTRIES, OFFERS, SOURCE_ASSERTIONS } from "./beauty-soiree";

const SOURCE_FILE = "knowledge-source/converted/beauty-soiree.md";
const ACTOR = "seed";

const SOURCE_MISSING = `${SOURCE_FILE} not found. The image does not ship it. On a laptop run: python scripts/convert-skills.py. On the server copy that file onto the host; compose mounts knowledge-source/converted read-only at /app/knowledge-source/converted. Then: docker compose exec app node dist/seed.cjs`;

async function main() {
  if (!existsSync(SOURCE_FILE)) {
    throw new Error(SOURCE_MISSING);
  }

  const source = readFileSync(SOURCE_FILE, "utf8");
  const missing = SOURCE_ASSERTIONS.filter((s) => !source.includes(s));
  if (missing.length > 0) {
    throw new Error(
      `The seed and ${SOURCE_FILE} have drifted apart. Not found in the source file:\n  ${missing.join("\n  ")}`,
    );
  }

  await repo.withTransaction(async (tx) => {
    const existing = await repo.clinics.getClinicBySlug(CLINIC.slug, tx);
    const clinic = existing
      ? ((await repo.clinics.updateClinic(existing.id, CLINIC, tx)) ?? existing)
      : await repo.clinics.createClinic(CLINIC, tx);

    const clinicId = clinic.id;

    await repo.blockedTerms.addBlockedTerms(clinicId, S4_BASELINE_TERMS, tx);

    const existingOffers = await repo.offers.listOffers(clinicId, {}, tx);
    const offerIdByKey = new Map<string, string>();

    for (const offer of OFFERS) {
      const values = {
        name: offer.name,
        priceCents: offer.priceCents,
        priceDisplay: offer.priceDisplay,
        rrpDisplay: offer.rrpDisplay,
        bookingUrl: offer.bookingUrl,
        active: true,
        notes: offer.notes,
      };
      const match = existingOffers.find((o) => o.name === offer.name);
      const saved = match
        ? ((await repo.offers.updateOffer(clinicId, match.id, values, tx)) ??
          match)
        : await repo.offers.createOffer(clinicId, values, tx);
      offerIdByKey.set(offer.key, saved.id);
    }

    for (const entry of ENTRIES) {
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
          blockDeflect: entry.blockDeflect ?? null,
          triggerTerms: entry.triggerTerms ?? [],
          source: "imported",
          createdBy: ACTOR,
        },
        tx,
      );
    }

    await repo.audit.recordAudit(
      clinicId,
      {
        actor: ACTOR,
        action: "clinic.seeded",
        entityType: "clinic",
        entityId: clinicId,
        after: {
          source: SOURCE_FILE,
          offers: OFFERS.length,
          kbEntries: ENTRIES.length,
          blockedTerms: S4_BASELINE_TERMS.length,
        },
      },
      tx,
    );

    const blocked = ENTRIES.filter((e) => e.answerMode === "blocked").length;
    console.log(
      [
        `seeded ${CLINIC.slug}`,
        `  offers:        ${OFFERS.length}`,
        `  kb entries:    ${ENTRIES.length} (${blocked} do-not-answer)`,
        `  blocked terms: ${S4_BASELINE_TERMS.length}`,
      ].join("\n"),
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("seed failed:", error);
    process.exit(1);
  });
