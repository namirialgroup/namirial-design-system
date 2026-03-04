#!/usr/bin/env node
/**
 * Salva due payload JSON (pagine 1 e 2 MCP) passati come base64 in argv[2] e argv[3].
 * Uso: node save-mcp-pages-from-argv.mjs <base64_page1> <base64_page2>
 * Scrive in packages/figma-sync/snapshots/_mcp-page-1.json e _mcp-page-2.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.GITHUB_WORKSPACE ?? join(__dirname, "../..");
const SNAP = join(ROOT, "packages/figma-sync/snapshots");

const b64_1 = process.argv[2];
const b64_2 = process.argv[3];
if (!b64_1 || !b64_2) {
  console.error("Uso: node save-mcp-pages-from-argv.mjs <base64_page1> <base64_page2>");
  process.exit(1);
}

const page1 = JSON.parse(Buffer.from(b64_1, "base64").toString("utf-8"));
const page2 = JSON.parse(Buffer.from(b64_2, "base64").toString("utf-8"));
mkdirSync(SNAP, { recursive: true });
writeFileSync(join(SNAP, "_mcp-page-1.json"), JSON.stringify(page1, null, 2), "utf-8");
writeFileSync(join(SNAP, "_mcp-page-2.json"), JSON.stringify(page2, null, 2), "utf-8");
console.log("_mcp-page-1.json:", page1.data?.variables?.length ?? 0, "variables");
console.log("_mcp-page-2.json:", page2.data?.variables?.length ?? 0, "variables");
