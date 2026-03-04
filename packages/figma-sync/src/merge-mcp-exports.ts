#!/usr/bin/env node
/**
 * Unisce più export MCP (figma_get_variables per collection) in un unico
 * figma-variables-export.json.
 *
 * Uso:
 *   node merge-mcp-exports.js [dir|file1.json file2.json ...]
 *
 * Se viene passata una directory (default: packages/figma-sync/snapshots/mcp-exports),
 * legge tutti i file .json in quella directory.
 * Se vengono passati file path, unisce quei file.
 *
 * Output: packages/figma-sync/snapshots/figma-variables-export.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAP_DIR = join(ROOT, "packages/figma-sync/snapshots");
const DEFAULT_EXPORTS_DIR = join(SNAP_DIR, "mcp-exports");
const OUTPUT_PATH = join(SNAP_DIR, "figma-variables-export.json");

interface McpVariable {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface McpCollection {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface McpPayload {
  fileKey?: string;
  source?: string;
  format?: string;
  data?: {
    variables?: McpVariable[];
    variableCollections?: McpCollection[];
  };
  variables?: McpVariable[];
  variableCollections?: McpCollection[];
}

function loadPayload(path: string): McpPayload {
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as McpPayload;
}

function extractData(payload: McpPayload): { variables: McpVariable[]; variableCollections: McpCollection[] } {
  const d = payload.data ?? payload;
  const variables = d.variables ?? payload.variables ?? [];
  const variableCollections = d.variableCollections ?? payload.variableCollections ?? [];
  return { variables, variableCollections };
}

function main(): void {
  const args = process.argv.slice(2);
  let files: string[];

  /** Raccoglie tutti i .json in una dir, incluso un livello di sotto-cartelle (es. mcp-exports/Primitives/*.json). */
  function collectJsonFiles(dir: string): string[] {
    const out: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isFile() && e.name.endsWith(".json") && !e.name.includes(".raw") && !e.name.startsWith("_")) {
        out.push(full);
      }
      if (e.isDirectory() && !e.name.startsWith("_")) {
        const sub = readdirSync(full, { withFileTypes: true });
        for (const s of sub) {
          if (s.isFile() && s.name.endsWith(".json") && !s.name.includes(".raw") && !s.name.startsWith("_")) {
            out.push(join(full, s.name));
          }
        }
      }
    }
    return out;
  }

  if (args.length === 0) {
    if (existsSync(DEFAULT_EXPORTS_DIR)) {
      files = collectJsonFiles(DEFAULT_EXPORTS_DIR);
    } else {
      console.error("Uso: node merge-mcp-exports.js [dir|file1.json file2.json ...]");
      console.error("  Esempio: node merge-mcp-exports.js packages/figma-sync/snapshots/mcp-exports");
      console.error("  Oppure: node merge-mcp-exports.js primitives.json theme.json semantic.json");
      console.error("Directory default:", DEFAULT_EXPORTS_DIR);
      process.exit(1);
    }
  } else if (args.length === 1 && existsSync(args[0])) {
    const stat = statSync(args[0]);
    if (stat.isDirectory()) {
      files = collectJsonFiles(resolve(args[0]));
    } else {
      files = [resolve(args[0])];
    }
  } else {
    files = args.map((p) => resolve(p)).filter((p) => existsSync(p));
    if (files.length === 0) {
      console.error("Nessun file trovato.");
      process.exit(1);
    }
  }

  const variablesById = new Map<string, McpVariable>();
  const collectionsById = new Map<string, McpCollection>();
  /** Ordine di prima apparizione (ordine Figma nei file MCP) — niente sort alfabetico */
  const variableOrder: string[] = [];

  for (const path of files) {
    try {
      const payload = loadPayload(path);
      const { variables, variableCollections } = extractData(payload);
      for (const v of variables) {
        if (v.id) {
          const existing = variablesById.get(v.id);
          if (!existing) {
            variablesById.set(v.id, v);
            variableOrder.push(v.id);
          } else if (v.resolvedValuesByMode && typeof v.resolvedValuesByMode === "object") {
            // Stesso variable ID in più file (es. dark-theme.json + light-theme.json): unisci le mode
            const existingModes = (existing.resolvedValuesByMode as Record<string, unknown>) ?? {};
            const newModes = v.resolvedValuesByMode as Record<string, unknown>;
            existing.resolvedValuesByMode = { ...existingModes, ...newModes };
          }
        }
      }
      for (const c of variableCollections) {
        if (c.id) collectionsById.set(c.id, c);
      }
      console.log(path, "→", variables.length, "variables,", variableCollections.length, "collections");
    } catch (e) {
      console.warn("Skip", path, ":", (e as Error).message);
    }
  }

  /** Ordine collection come in Figma: Primitives → Semantic → Theme → Component color → Component intent → Component dimension → Component no-modes */
  const COLLECTION_ORDER = [
    "Primitives",
    "Semantic",
    "Theme",
    "Component color",
    "Component intent",
    "Component dimension",
    "Component no-modes",
  ];

  const collectionOrderMap = new Map(COLLECTION_ORDER.map((name, i) => [name, i]));
  const sortedCollections = Array.from(collectionsById.values()).sort(
    (a, b) =>
      (collectionOrderMap.get(a.name) ?? 999) - (collectionOrderMap.get(b.name) ?? 999)
  );

  /** Variabili in ordine: prima per collection (Figma), poi per ordine di prima apparizione (Figma) — nessun sort alfabetico */
  const variables: McpVariable[] = [];
  for (const coll of sortedCollections) {
    for (const id of variableOrder) {
      const v = variablesById.get(id);
      if (v && (v.variableCollectionId as string) === coll.id) {
        variables.push(v);
      }
    }
  }

  mkdirSync(SNAP_DIR, { recursive: true });
  const output: McpPayload = {
    fileKey: "onY6xoWkmPGv6Zp4b1jEzn",
    source: "merge-mcp-exports",
    format: "merged",
    data: { variables, variableCollections: sortedCollections },
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log("Output:", OUTPUT_PATH);
  console.log("Totale:", variables.length, "variables,", sortedCollections.length, "collections");

  // Copia mcp-variable-modes.json in docs
  const modesPath = join(SNAP_DIR, "mcp-variable-modes.json");
  if (existsSync(modesPath)) {
    const docsPublic = join(ROOT, "apps", "docs", "public");
    const content = readFileSync(modesPath, "utf-8");
    mkdirSync(docsPublic, { recursive: true });
    writeFileSync(join(docsPublic, "mcp-variable-modes.json"), content);
    console.log("  mcp-variable-modes.json copiato in docs");
  }
}

main();
