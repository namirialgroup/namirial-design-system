#!/usr/bin/env node
/**
 * Legge le pagine MCP salvate (snapshots/_mcp-page-1.json … _mcp-page-N.json),
 * unisce variables e variableCollections, e scrive mcp-exports con la struttura
 * concordata (root per single-mode, sottocartella per multi-mode).
 *
 * Usato dal flusso "sync variabili solo via MCP": l'agent salva ogni risposta
 * figma_get_variables (page 1..N) in _mcp-page-{i}.json, poi lancia questo script.
 *
 * Uso: node merge-mcp-pages-and-write-exports.js
 *      oppure: pnpm merge:mcp-pages
 * File letti: packages/figma-sync/snapshots/_mcp-page-*.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAP = join(ROOT, "packages/figma-sync/snapshots");
const MCP_EXPORTS_DIR = join(SNAP, "mcp-exports");
const PAGE_GLOB_PREFIX = "_mcp-page-";

interface McpVariable {
  id: string;
  name: string;
  resolvedType?: string;
  variableCollectionId: string;
  resolvedValuesByMode?: Record<string, { value: string | number }>;
  [k: string]: unknown;
}

interface McpMode {
  modeId?: string;
  name: string;
}

interface McpCollection {
  id: string;
  name: string;
  modes?: McpMode[];
  defaultModeId?: string;
  [k: string]: unknown;
}

interface PagePayload {
  fileKey?: string;
  data?: {
    variables?: McpVariable[];
    variableCollections?: McpCollection[];
  };
  variables?: McpVariable[];
  variableCollections?: McpCollection[];
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function extractFromPayload(raw: PagePayload): { variables: McpVariable[]; collections: McpCollection[] } {
  const d = raw.data ?? raw;
  const variables = (d.variables ?? raw.variables ?? []) as McpVariable[];
  const collections = (d.variableCollections ?? raw.variableCollections ?? []) as McpCollection[];
  return { variables, collections };
}

function clearJsonFiles(dir: string): void {
  if (!existsSync(dir)) return;
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
  const entries = readdirSync(SNAP, { withFileTypes: true }).filter(
    (e) => e.isFile() && e.name.startsWith(PAGE_GLOB_PREFIX) && e.name.endsWith(".json")
  );
  if (entries.length === 0) {
    console.error("Nessun file", PAGE_GLOB_PREFIX + "*.json", "in", SNAP);
    console.error("Salva le risposte figma_get_variables (page 1..N) in _mcp-page-1.json, _mcp-page-2.json, ...");
    process.exit(1);
  }

  entries.sort((a, b) => {
    const na = parseInt(a.name.replace(PAGE_GLOB_PREFIX, "").replace(".json", ""), 10);
    const nb = parseInt(b.name.replace(PAGE_GLOB_PREFIX, "").replace(".json", ""), 10);
    return na - nb;
  });

  const variablesById = new Map<string, McpVariable>();
  const collectionsById = new Map<string, McpCollection>();

  for (const e of entries) {
    const path = join(SNAP, e.name);
    const raw = JSON.parse(readFileSync(path, "utf-8")) as PagePayload;
    const { variables, collections } = extractFromPayload(raw);
    for (const v of variables) {
      if (!v.id) continue;
      const existing = variablesById.get(v.id);
      if (!existing) {
        variablesById.set(v.id, { ...v });
      } else if (v.resolvedValuesByMode && typeof v.resolvedValuesByMode === "object") {
        const merged = { ...(existing.resolvedValuesByMode ?? {}), ...v.resolvedValuesByMode };
        existing.resolvedValuesByMode = merged;
      }
    }
    for (const c of collections) {
      if (!c.id) continue;
      const existing = collectionsById.get(c.id);
      if (!existing) {
        collectionsById.set(c.id, { ...c });
      } else if (c.modes && c.modes.length > (existing.modes?.length ?? 0)) {
        collectionsById.set(c.id, { ...c });
      }
    }
  }

  const variables = Array.from(variablesById.values());
  const collections = Array.from(collectionsById.values());
  const fileKey = "onY6xoWkmPGv6Zp4b1jEzn";

  console.log("Pagine lette:", entries.length, "→", variables.length, "variables,", collections.length, "collections");

  mkdirSync(MCP_EXPORTS_DIR, { recursive: true });
  clearJsonFiles(MCP_EXPORTS_DIR);

  for (const coll of collections) {
    const collVars = variables.filter((v) => v.variableCollectionId === coll.id);
    if (collVars.length === 0) continue;
    const collSlug = toSlug(coll.name);
    const modes = coll.modes ?? [];

    if (modes.length <= 1) {
      const out = {
        fileKey,
        source: "mcp-pages",
        format: "filtered",
        timestamp: Date.now(),
        data: { variables: collVars, variableCollections: [coll] },
      };
      const outPath = join(MCP_EXPORTS_DIR, `${collSlug}.json`);
      writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");
      console.log("Scritto", outPath, `(${collVars.length} variables)`);
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
          source: "mcp-pages",
          format: "filtered",
          timestamp: Date.now(),
          data: { variables: modeVars, variableCollections: [coll] },
        };
        const fileName = `${modeSlug}_${collSlug}.json`;
        const outPath = join(subDir, fileName);
        writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");
        console.log("Scritto", outPath, `(${modeVars.length} variables, mode: ${mode.name})`);
      }
    }
  }

  console.log("\nCompleto. Esegui 'pnpm merge:mcp-exports' e poi 'pnpm sync:figma'.");
}

main();
