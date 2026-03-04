#!/usr/bin/env node
/**
 * Scrive i 5 payload MCP mancanti in mcp-exports/.
 * I payload sono ottenuti da figma_get_variables e vanno salvati.
 * Esegui dopo aver popolato PAYLOADS (es. da stdin o da file).
 */
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../snapshots/mcp-exports');
mkdirSync(outDir, { recursive: true });

// Legge i payload da file (path come argomento)
const payloadsPath = process.argv[2];
if (!payloadsPath) {
  console.error('Usage: node write-mcp-exports.mjs /path/to/payloads.json');
  process.exit(1);
}

const { exports: payloads } = JSON.parse(readFileSync(payloadsPath, 'utf-8'));
for (const { name, payload } of payloads) {
  const path = join(outDir, `${name}.json`);
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf-8');
  const v = payload.data?.variables?.length ?? 0;
  const c = payload.data?.variableCollections?.length ?? 0;
  console.log(`Saved ${name}.json: ${v} variables, ${c} collections`);
}
