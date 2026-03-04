#!/usr/bin/env node
/**
 * Legge gli export MCP da un file JSON (array di payload) e li scrive in mcp-exports/
 * con i nomi richiesti. Poi esegue il merge.
 *
 * Uso: node save-mcp-exports.mjs < payloads.json
 *   oppure: node save-mcp-exports.mjs payloads.json
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

async function main() {
  const path = process.argv[2];
  const raw = path
    ? readFileSync(path, "utf-8")
    : await new Promise((resolve) => {
        let buf = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (c) => (buf += c));
        process.stdin.on("end", () => resolve(buf));
      });

  const payloads = JSON.parse(raw);
  if (!Array.isArray(payloads)) {
    throw new Error("Expected JSON array of MCP payloads");
  }

  mkdirSync(MCP_EXPORTS, { recursive: true });

  for (let i = 0; i < payloads.length && i < FILE_NAMES.length; i++) {
    const payload = payloads[i];
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
