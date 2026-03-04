#!/usr/bin/env node
/**
 * Riorganizza figma-variables-export.json in mcp-exports con la struttura e naming concordati:
 * - collection con 0/1 mode → file in root: nome-collection.json
 * - collection con più mode → sottocartella nome-collection/ e file nome-mode_nome-collection.json
 *
 * Uso: node dist/src/reorganize-mcp-exports.js
 * (Legge snapshots/figma-variables-export.json, sovrascrive snapshots/mcp-exports/*.json)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAP = join(ROOT, "packages/figma-sync/snapshots");
const MERGED_PATH = join(SNAP, "figma-variables-export.json");
const MCP_EXPORTS_DIR = join(SNAP, "mcp-exports");

interface McpVariable {
  id: string;
  name: string;
  resolvedType?: string;
  variableCollectionId: string;
  resolvedValuesByMode?: Record<string, { value: string | number }>;
  [k: string]: unknown;
}

interface McpMode {
  modeId: string;
  name: string;
}

interface McpCollection {
  id: string;
  name: string;
  modes?: McpMode[];
  defaultModeId?: string;
  variableIds?: string[];
  [k: string]: unknown;
}

interface MergedPayload {
  fileKey?: string;
  data?: {
    variables?: McpVariable[];
    variableCollections?: McpCollection[];
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function clearJsonFiles(dir: string): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isFile() && e.name.endsWith(".json")) {
      unlinkSync(full);
    }
    if (e.isDirectory() && !e.name.startsWith("_")) {
      const sub = readdirSync(full, { withFileTypes: true });
      for (const s of sub) {
        if (s.isFile() && s.name.endsWith(".json")) {
          unlinkSync(join(full, s.name));
        }
      }
    }
  }
}

function main(): void {
  if (!existsSync(MERGED_PATH)) {
    console.error("File non trovato:", MERGED_PATH);
    process.exit(1);
  }

  const raw = readFileSync(MERGED_PATH, "utf-8");
  const payload = JSON.parse(raw) as MergedPayload;
  const variables = payload.data?.variables ?? [];
  const collections = payload.data?.variableCollections ?? [];

  const fileKey = payload.fileKey ?? "onY6xoWkmPGv6Zp4b1jEzn";

  mkdirSync(MCP_EXPORTS_DIR, { recursive: true });
  clearJsonFiles(MCP_EXPORTS_DIR);

  for (const coll of collections) {
    const collVars = variables.filter((v) => v.variableCollectionId === coll.id);
    const collSlug = toSlug(coll.name);
    const modes = coll.modes ?? [];

    if (modes.length <= 1) {
      const out = {
        fileKey,
        source: "reorganize",
        format: "filtered",
        timestamp: Date.now(),
        data: { variables: collVars, variableCollections: [coll] },
      };
      const path = join(MCP_EXPORTS_DIR, `${collSlug}.json`);
      writeFileSync(path, JSON.stringify(out, null, 2), "utf-8");
      console.log("Scritto", path, `(${collVars.length} variables)`);
    } else {
      const subDir = join(MCP_EXPORTS_DIR, collSlug);
      mkdirSync(subDir, { recursive: true });
      for (const mode of modes) {
        const modeSlug = toSlug(mode.name);
        const modeVars = collVars.map((v) => {
          const resolved = v.resolvedValuesByMode?.[mode.name];
          return resolved
            ? { ...v, resolvedValuesByMode: { [mode.name]: resolved } }
            : v;
        });
        const out = {
          fileKey,
          source: "reorganize",
          format: "filtered",
          timestamp: Date.now(),
          data: { variables: modeVars, variableCollections: [coll] },
        };
        const fileName = `${modeSlug}_${collSlug}.json`;
        const path = join(subDir, fileName);
        writeFileSync(path, JSON.stringify(out, null, 2), "utf-8");
        console.log("Scritto", path, `(${modeVars.length} variables, mode: ${mode.name})`);
      }
    }
  }

  console.log("\nCompleto. Esegui 'pnpm merge:mcp-exports' per rigenerare figma-variables-export.json.");
}

main();
