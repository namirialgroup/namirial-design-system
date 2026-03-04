#!/usr/bin/env node
/**
 * Scrive gli snapshot (current-tokens.json, manifest aggiornato) a partire da
 * un export JSON di figma_get_variables (Figma Console MCP).
 *
 * Uso:
 *   MCP_VARIABLES_JSON=path/to/export.json node write-mcp-snapshot.js
 *   node write-mcp-snapshot.js path/to/export.json
 *
 * Prima esegui in Cursor: chiedi all'agent di chiamare figma_get_variables
 * per il file Design System (tutte le pagine se paginato), salva l’output
 * in un file JSON, poi lancia questo script.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { mcpVariablesToFigmaTokens } from "./mcp-to-snapshot.js";
import type { McpVariablesResponse } from "./mcp-to-snapshot.js";
import type { FigmaSyncManifest } from "./types.js";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAP_DIR = join(ROOT, "packages/figma-sync/snapshots");
const MANIFEST_PATH = join(SNAP_DIR, "manifest.json");
const DOCS_PUBLIC = resolve(SNAP_DIR, "..", "..", "..", "apps", "docs", "public");

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

function main(): void {
  const jsonPath =
    process.env.MCP_VARIABLES_JSON ?? process.argv[2];
  if (!jsonPath) {
    console.error("Uso: MCP_VARIABLES_JSON=file.json node write-mcp-snapshot.js");
    console.error("  oppure: node write-mcp-snapshot.js file.json");
    process.exit(1);
  }
  if (!existsSync(jsonPath)) {
    console.error("File non trovato:", jsonPath);
    process.exit(1);
  }

  const raw = readFileSync(jsonPath, "utf-8");
  let payload: McpVariablesResponse;
  try {
    payload = JSON.parse(raw) as McpVariablesResponse;
  } catch (e) {
    console.error("JSON non valido:", (e as Error).message);
    process.exit(1);
  }

  // Supporta risposta MCP con data annidato (data.variables) o root (variables)
  const tokens = mcpVariablesToFigmaTokens(payload);

  if (tokens.length === 0) {
    console.warn("Nessun token trovato nell'export. Verifica il formato (variables + variableCollections).");
  }

  mkdirSync(SNAP_DIR, { recursive: true });

  const tokenHash = simpleHash(JSON.stringify(tokens.map((t) => [t.name, t.value])));

  let fileKey = "onY6xoWkmPGv6Zp4b1jEzn";
  const configPath = join(ROOT, "design-system.config.json");
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf-8")) as { figma?: { tokenLibraryId?: string } };
    fileKey = config.figma?.tokenLibraryId ?? fileKey;
  }

  let manifest: FigmaSyncManifest;
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as FigmaSyncManifest;
    manifest.timestamp = new Date().toISOString();
    manifest.tokenLibrary = { id: fileKey, hash: tokenHash };
    manifest.tokenCount = tokens.length;
  } else {
    manifest = {
      timestamp: new Date().toISOString(),
      tokenLibrary: { id: fileKey, hash: tokenHash },
      componentLibrary: { id: fileKey, hash: "" },
      scope: (process.env.DS_SCOPE as "stable" | "experimental") ?? "stable",
      stableComponents: [],
      experimentalComponents: [],
      tokenCount: tokens.length,
      componentCount: 0,
    };
  }

  writeFileSync(join(SNAP_DIR, "current-tokens.json"), JSON.stringify(tokens, null, 2));
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  if (existsSync(DOCS_PUBLIC)) {
    writeFileSync(join(DOCS_PUBLIC, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log("  Manifest copiato in apps/docs/public");
  }

  console.log("Snapshot MCP scritto.");
  console.log("  Tokens:", tokens.length);
  console.log("  File:", join(SNAP_DIR, "current-tokens.json"));
  console.log("  Esegui il build dei token (pnpm build o nx run tokens:build) per aggiornare tokens.json e tokens.css.");
}

main();
