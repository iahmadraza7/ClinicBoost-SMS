import { readFileSync, writeFileSync } from "node:fs";

const manifestPath = ".next/server/server-reference-manifest.json";
const outPath = "server-action-ids.json";

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const ids = Object.keys(manifest.node ?? {});

writeFileSync(outPath, `${JSON.stringify(ids, null, 2)}\n`, "utf8");
console.log(`wrote ${ids.length} server action ids to ${outPath}`);
