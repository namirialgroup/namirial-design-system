#!/usr/bin/env node
/**
 * Riceve un singolo payload MCP da stdin (JSON) e lo scrive in mcp-exports con il nome dato.
 * Uso: echo '{"fileKey":...}' | node pipe-mcp-to-exports.mjs primitives-p1
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const MCP_EXPORTS = join(ROOT, "packages/figma-sync/snapshots/mcp-exports");

const name = process.argv[2] || "export";
let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (buf += c));
process.stdin.on("end", () => {
  const payload = JSON.parse(buf);
  mkdirSync(MCP_EXPORTS, { recursive: true });
  const out = join(MCP_EXPORTS, `${name}.json`);
  writeFileSync(out, JSON.stringify(payload, null, 2), "utf-8");
  console.log(out, "→", payload.data?.variables?.length ?? 0, "variables");
});
