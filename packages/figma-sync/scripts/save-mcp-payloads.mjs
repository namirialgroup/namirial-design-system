#!/usr/bin/env node
/**
 * Salva i 6 payload MCP in mcp-exports/.
 * Esegui: node scripts/save-mcp-payloads.mjs
 * I payload vanno passati come argomento o da file - per ora usato manualmente.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../snapshots/mcp-exports');
mkdirSync(outDir, { recursive: true });

// I payload verranno passati come argomento JSON
const payloadsArg = process.argv[2];
if (!payloadsArg) {
  console.error('Usage: node save-mcp-payloads.mjs \'[{name,payload},...]\'');
  process.exit(1);
}

const payloads = JSON.parse(payloadsArg);
for (const { name, payload } of payloads) {
  const path = join(outDir, `${name}.json`);
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf-8');
  const v = payload.data?.variables?.length ?? 0;
  const c = payload.data?.variableCollections?.length ?? 0;
  console.log(`Saved ${name}.json: ${v} variables, ${c} collections`);
}
