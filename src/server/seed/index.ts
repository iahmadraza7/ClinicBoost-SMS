import "../bootstrap-env";

import * as repo from "../repo";
import { ALL_CLINIC_PACKS } from "./all-clinics";
import {
  printSeedSummary,
  seedClinicPack,
  writeImportReport,
} from "./run-seed";

async function main() {
  const results = await repo.withTransaction(async (tx) => {
    const out = [];
    for (const pack of ALL_CLINIC_PACKS) {
      out.push(await seedClinicPack(pack, tx));
    }
    return out;
  });

  printSeedSummary(results);
  writeImportReport(results);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("seed failed:", error);
    process.exit(1);
  });
