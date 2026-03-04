#!/usr/bin/env node
/**
 * Legge JSON da stdin e lo salva nel file specificato.
 * Usage: cat payload.json | node save-payload-from-stdin.mjs output.json
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const name = process.argv[2]; // e.g. theme-p2
if (!name) {
  console.error('Usage: node save-payload-from-stdin.mjs <name>');
  process.exit(1);
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const payload = JSON.parse(Buffer.concat(chunks).toString());

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../snapshots/mcp-exports', `${name}.json`);
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`Saved ${name}.json (${payload.data?.variables?.length ?? 0} variables)`);
