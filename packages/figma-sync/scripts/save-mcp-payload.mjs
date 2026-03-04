#!/usr/bin/env node
/**
 * Salva un payload MCP in mcp-exports/{name}.json
 * Uso: node save-mcp-payload.mjs <name> <path-to-json-file>
 * Oppure: node save-mcp-payload.mjs <name>  (legge da stdin)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const MCP_EXPORTS = join(ROOT, "packages/figma-sync/snapshots/mcp-exports");

const name = process.argv[2];
const fileArg = process.argv[3];
if (!name) {
  console.error("Uso: node save-mcp-payload.mjs <name> [file.json]");
  process.exit(1);
}

let payload;
if (fileArg) {
  payload = JSON.parse(readFileSync(fileArg, "utf-8"));
} else {
  let buf = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) buf += chunk;
  payload = JSON.parse(buf);
}

mkdirSync(MCP_EXPORTS, { recursive: true });
const out = join(MCP_EXPORTS, `${name}.json`);
writeFileSync(out, JSON.stringify(payload, null, 2), "utf-8");
const n = payload.data?.variables?.length ?? 0;
console.log(out, "→", n, "variables");
