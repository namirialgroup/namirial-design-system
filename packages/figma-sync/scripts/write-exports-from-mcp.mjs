#!/usr/bin/env node
/**
 * Riceve i path di 12 file JSON (uno per pagina/collection) e li copia in mcp-exports/
 * con i nomi richiesti, poi esegue il merge.
 *
 * Uso: node write-exports-from-mcp.mjs primitives-p1.json primitives-p2.json ... component-no-modes-p2.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const MCP_EXPORTS = join(ROOT, "packages/figma-sync/snapshots/mcp-exports");
const MERGE_SCRIPT = join(ROOT, "packages/figma-sync/dist/src/merge-mcp-exports.js");

const FILE_NAMES = [
  "primitives-p1",
  "primitives-p2",
  "primitives-p3",
  "primitives-p4",
  "theme-p1",
  "theme-p2",
  "semantic-p1",
  "semantic-p2",
  "component-dimension",
  "component-color",
  "component-no-modes-p1",
  "component-no-modes-p2",
];

function main() {
  const args = process.argv.slice(2);
  if (args.length < 12) {
    console.error("Fornire 12 file JSON in ordine");
    process.exit(1);
  }

  mkdirSync(MCP_EXPORTS, { recursive: true });

  for (let i = 0; i < 12; i++) {
    const srcPath = args[i];
    const payload = JSON.parse(readFileSync(srcPath, "utf-8"));
    const name = FILE_NAMES[i];
    const outPath = join(MCP_EXPORTS, `${name}.json`);
    writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
    const count = payload.data?.variables?.length ?? 0;
    console.log(outPath, "→", count, "variables");
  }

  const r = spawnSync("node", [MERGE_SCRIPT, MCP_EXPORTS], {
    stdio: "inherit",
    cwd: ROOT,
  });
  process.exit(r.status ?? 1);
}

main();
