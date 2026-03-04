/**
 * Trasforma il payload di Figma Console MCP (figma_get_variables) nel formato
 * degli snapshot usati dal pipeline: current-tokens.json (array FigmaToken).
 * Usare quando il sync avviene via MCP invece che REST API.
 */
import type { FigmaToken } from "./types.js";

/** Risposta tipica di figma_get_variables (porzione rilevante) */
export interface McpVariable {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode?: Record<string, unknown>;
  resolvedValuesByMode?: Record<string, { value: string | number }>;
  variableCollectionId: string;
}

export interface McpVariableCollection {
  id: string;
  name: string;
  modes?: { name: string; modeId: string }[];
  defaultModeId?: string;
}

export interface McpVariablesPayload {
  variables?: McpVariable[];
  variableCollections?: McpVariableCollection[];
}

/** Tipo per la risposta MCP (data annidato sotto data) */
export interface McpVariablesResponse {
  data?: McpVariablesPayload;
  variables?: McpVariable[];
  variableCollections?: McpVariableCollection[];
}

const RESOLVED_TYPE_MAP: Record<string, FigmaToken["type"]> = {
  COLOR: "color",
  FLOAT: "number",
  STRING: "string",
  BOOLEAN: "string",
};

/**
 * Normalizza il nome del token: slash → dot per coerenza con nestKeys nel build token.
 */
function tokenName(name: string): string {
  return name.replace(/\//g, ".");
}

/**
 * Estrae il valore per la prima modalità (numero o stringa hex).
 */
function firstModeValue(v: McpVariable): string | number {
  const resolved = v.resolvedValuesByMode;
  if (resolved) {
    const firstMode = Object.keys(resolved)[0];
    if (firstMode != null) {
      const val = resolved[firstMode]?.value;
      if (val !== undefined) return val;
    }
  }
  const raw = v.valuesByMode;
  if (raw) {
    const firstKey = Object.keys(raw)[0];
    if (firstKey != null) {
      const val = raw[firstKey];
      if (typeof val === "object" && val !== null && "r" in val && "g" in val && "b" in val) {
        const { r, g, b } = val as { r: number; g: number; b: number };
        const R = Math.round(Math.min(1, Math.max(0, r)) * 255);
        const G = Math.round(Math.min(1, Math.max(0, g)) * 255);
        const B = Math.round(Math.min(1, Math.max(0, b)) * 255);
        return `#${[R, G, B].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
      }
      if (typeof val === "number" || typeof val === "string") return val;
    }
  }
  return "";
}

/**
 * Trasforma la risposta di figma_get_variables (Figma Console MCP) nell’array
 * di token usato da current-tokens.json e dal build @namirial/design-system.
 */
export function mcpVariablesToFigmaTokens(response: McpVariablesResponse): FigmaToken[] {
  const data = response.data ?? response;
  const variables = data.variables ?? [];
  const collections = data.variableCollections ?? [];
  const collectionByName = new Map<string, string>();
  for (const c of collections) {
    collectionByName.set(c.id, c.name);
  }

  const tokens: FigmaToken[] = [];
  for (const v of variables) {
    const value = firstModeValue(v);
    const type = RESOLVED_TYPE_MAP[v.resolvedType] ?? "string";
    const collectionName = v.variableCollectionId
      ? collectionByName.get(v.variableCollectionId)
      : undefined;
    tokens.push({
      name: tokenName(v.name),
      value,
      type,
      collectionName: collectionName ?? "Tokens",
      experimental: v.name.startsWith("exp.") || v.name.startsWith("exp/"),
    });
  }
  return tokens;
}
