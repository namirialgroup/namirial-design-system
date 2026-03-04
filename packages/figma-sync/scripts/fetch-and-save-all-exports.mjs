#!/usr/bin/env node
/**
 * Legge le risposte MCP da un file JSON (array di payload) e scrive ciascuna
 * in mcp-exports/, poi esegue il merge.
 *
 * Uso: node fetch-and-save-all-exports.mjs payloads.json
 *
 * Il file payloads.json deve essere un array di oggetti con data.variables e
 * data.variableCollections (risposte figma_get_variables).
 *
 * Per generare payloads.json: chiedi all'agent di chiamare figma_get_variables
 * per ogni collection/pagina e concatenare le risposte in un array.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const MCP_EXPORTS = join(ROOT, "packages/figma-sync/snapshots/mcp-exports");
const MERGE_SCRIPT = join(ROOT, "packages/figma-sync/dist/src/merge-mcp-exports.js");

const NAMES = [
  "primitives-p1", "primitives-p2", "primitives-p3", "primitives-p4",
  "theme-p1", "theme-p2",
  "semantic-p1", "semantic-p2",
  "component-dimension", "component-color",
  "component-no-modes",
];

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Uso: node fetch-and-save-all-exports.mjs payloads.json");
    process.exit(1);
  }
  const raw = readFileSync(path, "utf-8");
  const payloads = JSON.parse(raw);
  if (!Array.isArray(payloads)) {
    console.error("payloads.json deve essere un array di payload MCP");
    process.exit(1);
  }
  mkdirSync(MCP_EXPORTS, { recursive: true });
  for (let i = 0; i < payloads.length; i++) {
    const p = payloads[i];
    const name = NAMES[i] ?? `export-${i}`;
    const out = join(MCP_EXPORTS, `${name}.json`);
    writeFileSync(out, JSON.stringify(p, null, 2), "utf-8");
    const n = p.data?.variables?.length ?? 0;
    console.log(out, "→", n, "variables");
  }
  const r = spawnSync("node", [MERGE_SCRIPT, MCP_EXPORTS], { stdio: "inherit", cwd: ROOT });
  process.exit(r.status ?? 1);
}
main();
