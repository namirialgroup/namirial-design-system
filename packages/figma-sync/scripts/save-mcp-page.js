#!/usr/bin/env node
/**
 * Salva le risposte MCP figma_get_variables (page 1 e 2) nei file snapshot.
 * Uso: node scripts/save-mcp-page.js <path-to-page1.json> <path-to-page2.json>
 *
 * Legge i due file e scrive il contenuto in:
 *   packages/figma-sync/snapshots/_mcp-page-1.json
 *   packages/figma-sync/snapshots/_mcp-page-2.json
 *
 * Eseguire dalla root del repo o da packages/figma-sync. Poi: pnpm merge:mcp-pages
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.GITHUB_WORKSPACE ?? join(__dirname, "..");
const SNAP = join(ROOT, "snapshots");

const pathPage1 = process.argv[2];
const pathPage2 = process.argv[3];

if (!pathPage1 || !pathPage2) {
  console.error("Uso: node scripts/save-mcp-page.js <path-to-page1.json> <path-to-page2.json>");
  process.exit(1);
}

function savePage(sourcePath, pageNum) {
  const payload = JSON.parse(readFileSync(sourcePath, "utf-8"));
  const outPath = join(SNAP, `_mcp-page-${pageNum}.json`);
  mkdirSync(SNAP, { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
  const n = payload.data?.variables?.length ?? 0;
  console.log(outPath, "←", sourcePath, "→", n, "variables");
  return n;
}

const n1 = savePage(pathPage1, 1);
const n2 = savePage(pathPage2, 2);
console.log("Salvate pagine 1 e 2. Totale variabili:", n1 + n2);
console.log("Esegui: pnpm merge:mcp-pages");
