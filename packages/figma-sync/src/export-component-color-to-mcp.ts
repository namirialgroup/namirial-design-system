#!/usr/bin/env node
/**
 * Export dedicato alla sola collection "Component color" (Figma id 1814:42211).
 * Scarica le variabili via REST API, filtra per questa collection e scrive
 * mcp-exports/component-color/index-1_component-color.json … index-10_component-color.json
 *
 * Richiede FIGMA_ACCESS_TOKEN con scope file_variables:read.
 * Uso: FIGMA_ACCESS_TOKEN=xxx pnpm export:component-color
 *      oppure: node dist/src/export-component-color-to-mcp.js
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const FIGMA_API = "https://api.figma.com/v1";
const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const MCP_EXPORTS_DIR = join(ROOT, "packages/figma-sync/snapshots/mcp-exports");
const COMPONENT_COLOR_DIR = join(MCP_EXPORTS_DIR, "component-color");
const CONFIG_PATH = join(ROOT, "design-system.config.json");

const COMPONENT_COLOR_COLLECTION_ID = "VariableCollectionId:1814:42211";

interface RestVariable {
  id: string;
  name: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode?: Record<string, unknown>;
  remote?: boolean;
}

interface RestCollection {
  id: string;
  name: string;
  defaultModeId?: string;
  modes?: { modeId: string; name: string }[];
  remote?: boolean;
}

interface RestVariablesResponse {
  meta?: {
    variables?: Record<string, RestVariable> | RestVariable[];
    variableCollections?: Record<string, RestCollection> | RestCollection[];
  };
}

interface McpVariable {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  resolvedValuesByMode?: Record<string, { value: string | number }>;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

function isVariableAlias(value: unknown): value is { type: string; id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: string }).type === "VARIABLE_ALIAS" &&
    "id" in value
  );
}

function isColor(value: unknown): value is { r: number; g: number; b: number; a?: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    "g" in value &&
    "b" in value
  );
}

function colorToHex(color: { r: number; g: number; b: number }): string {
  let r = color.r ?? 0;
  let g = color.g ?? 0;
  let b = color.b ?? 0;
  if (r > 1 || g > 1 || b > 1) {
    r /= 255;
    g /= 255;
    b /= 255;
  }
  const R = Math.round(Math.max(0, Math.min(1, r)) * 255);
  const G = Math.round(Math.max(0, Math.min(1, g)) * 255);
  const B = Math.round(Math.max(0, Math.min(1, b)) * 255);
  return `#${[R, G, B].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function resolveValueForMode(
  variableId: string,
  modeId: string,
  variables: Record<string, RestVariable>,
  collections: Record<string, RestCollection>,
  visited: Set<string>
): unknown {
  if (visited.has(variableId)) return undefined;
  const variable = variables[variableId];
  if (!variable?.valuesByMode) return undefined;
  let value = variable.valuesByMode[modeId];
  if (value === undefined) {
    const coll = collections[variable.variableCollectionId];
    const fallbackMode = coll?.defaultModeId ?? coll?.modes?.[0]?.modeId ?? Object.keys(variable.valuesByMode)[0];
    value = fallbackMode != null ? variable.valuesByMode[fallbackMode] : undefined;
  }
  if (value === undefined) return undefined;
  if (isVariableAlias(value)) {
    visited.add(variableId);
    return resolveValueForMode(
      String(value.id),
      modeId,
      variables,
      collections,
      visited
    );
  }
  return value;
}

function toMcpValue(value: unknown, resolvedType: RestVariable["resolvedType"]): string | number {
  if (resolvedType === "COLOR") {
    if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
    if (isColor(value)) return colorToHex(value);
    return "#000000";
  }
  if (resolvedType === "FLOAT") return typeof value === "number" ? value : Number(String(value)) || 0;
  if (resolvedType === "BOOLEAN") return value ? "true" : "false";
  return String(value ?? "");
}

function restToMcpVariables(
  variables: Record<string, RestVariable>,
  collections: Record<string, RestCollection>,
  collectionId: string
): McpVariable[] {
  const out: McpVariable[] = [];
  const modeNameById = new Map<string, string>();
  const coll = collections[collectionId];
  if (!coll?.modes) return out;
  for (const m of coll.modes) {
    modeNameById.set(m.modeId, m.name);
  }
  const modeIds: string[] = coll.modes.map((m) => m.modeId);
  for (const v of Object.values(variables)) {
    if (v.remote === true || v.variableCollectionId !== collectionId) continue;
    const resolvedValuesByMode: Record<string, { value: string | number }> = {};
    for (const modeId of modeIds) {
      const raw = resolveValueForMode(v.id, modeId, variables, collections, new Set());
      const modeName = modeNameById.get(modeId) ?? modeId;
      resolvedValuesByMode[modeName] = {
        value: toMcpValue(raw, v.resolvedType),
      };
    }
    out.push({
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType,
      variableCollectionId: v.variableCollectionId,
      ...(Object.keys(resolvedValuesByMode).length > 0 ? { resolvedValuesByMode } : {}),
    });
  }
  return out;
}

function normalizeMeta(
  meta: RestVariablesResponse["meta"]
): { variables: Record<string, RestVariable>; collections: Record<string, RestCollection> } {
  const rawV = meta?.variables ?? {};
  const rawC = meta?.variableCollections ?? {};
  const variables: Record<string, RestVariable> = Array.isArray(rawV)
    ? Object.fromEntries((rawV as RestVariable[]).map((v) => [v.id, v]))
    : (rawV as Record<string, RestVariable>) ?? {};
  const collections: Record<string, RestCollection> = Array.isArray(rawC)
    ? Object.fromEntries((rawC as RestCollection[]).map((c) => [c.id, c]))
    : (rawC as Record<string, RestCollection>) ?? {};
  return { variables, collections };
}

async function main(): Promise<void> {
  const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
  if (!token) {
    console.error("Imposta FIGMA_ACCESS_TOKEN (con scope file_variables:read) per l'export Component color.");
    process.exit(1);
  }

  let fileKey = process.env.FIGMA_FILE_KEY?.trim();
  if (!fileKey && existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      fileKey = config?.figma?.tokenLibraryId ?? config?.figma?.componentLibraryId;
    } catch {
      // ignore
    }
  }
  if (!fileKey) {
    console.error("Imposta FIGMA_FILE_KEY oppure tokenLibraryId in design-system.config.json.");
    process.exit(1);
  }

  const url = `${FIGMA_API}/files/${fileKey}/variables/local`;
  console.log("Fetch", url, "...");
  const res = await fetch(url, {
    headers: { "X-Figma-Token": token, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Figma API:", res.status, text.slice(0, 400));
    if (res.status === 403) {
      console.error("\nIl token deve avere scope file_variables:read. Crealo da Figma → Settings → Personal access tokens.");
    }
    process.exit(1);
  }

  const data = (await res.json()) as RestVariablesResponse;
  const { variables, collections } = normalizeMeta(data.meta);

  const coll = collections[COMPONENT_COLOR_COLLECTION_ID];
  if (!coll) {
    console.error("Collection 'Component color' (id", COMPONENT_COLOR_COLLECTION_ID + ") non trovata nel file Figma.");
    process.exit(1);
  }

  const collVars = restToMcpVariables(variables, collections, COMPONENT_COLOR_COLLECTION_ID);
  if (collVars.length === 0) {
    console.log("Nessuna variabile nella collection Component color.");
    process.exit(0);
  }

  const modes = coll.modes ?? [];
  if (modes.length === 0) {
    console.error("La collection Component color non ha mode definite.");
    process.exit(1);
  }

  mkdirSync(COMPONENT_COLOR_DIR, { recursive: true });

  const collSlug = toSlug(coll.name);
  for (const mode of modes) {
    const modeSlug = toSlug(mode.name);
    const modeVars = collVars.map((v) => {
      const resolved = v.resolvedValuesByMode?.[mode.name];
      return resolved
        ? { ...v, resolvedValuesByMode: { [mode.name]: resolved } }
        : v;
    });
    const payload = {
      fileKey,
      source: "rest-api",
      format: "filtered",
      collection: "Component color",
      timestamp: Date.now(),
      data: {
        variables: modeVars,
        variableCollections: [{ ...coll, modes: coll.modes }],
      },
    };
    const fileName = `${modeSlug}_${collSlug}.json`;
    const path = join(COMPONENT_COLOR_DIR, fileName);
    writeFileSync(path, JSON.stringify(payload, null, 2), "utf-8");
    console.log("Scritto", path, `(${modeVars.length} variables, mode: ${mode.name})`);
  }

  console.log("\nExport Component color completato. Esegui 'pnpm merge:mcp-exports' per includerla in figma-variables-export.json.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
