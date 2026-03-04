#!/usr/bin/env node
/**
 * Legge da stdin due blob JSON separati da una riga che inizia con "---PAGE2---"
 * e scrive il primo in _mcp-page-1.json e il secondo in _mcp-page-2.json.
 * Uso: incolla il JSON di page 1, poi una riga "---PAGE2---", poi il JSON di page 2, poi Ctrl+D
 * Oppure: cat page1.json && echo "---PAGE2---" && cat page2.json | node write-mcp-pages-from-stdin.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.GITHUB_WORKSPACE ?? join(__dirname, "../..");
const SNAP = join(ROOT, "packages/figma-sync/snapshots");

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = chunks.join("");
  const sep = "\n---PAGE2---\n";
  const i = raw.indexOf(sep);
  if (i < 0) {
    console.error("Input deve contenere una riga ---PAGE2--- tra il JSON di page 1 e page 2");
    process.exit(1);
  }
  const page1Str = raw.slice(0, i).trim();
  const page2Str = raw.slice(i + sep.length).trim();
  const page1 = JSON.parse(page1Str);
  const page2 = JSON.parse(page2Str);
  mkdirSync(SNAP, { recursive: true });
  writeFileSync(join(SNAP, "_mcp-page-1.json"), JSON.stringify(page1, null, 2), "utf-8");
  writeFileSync(join(SNAP, "_mcp-page-2.json"), JSON.stringify(page2, null, 2), "utf-8");
  console.log("_mcp-page-1.json:", page1.data?.variables?.length ?? 0, "variables");
  console.log("_mcp-page-2.json:", page2.data?.variables?.length ?? 0, "variables");
  console.log("Fatto. Esegui: pnpm merge:mcp-pages");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
