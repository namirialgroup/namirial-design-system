/**
 * Fetches published Figma libraries via REST API.
 * In CI: uses FIGMA_ACCESS_TOKEN. Snapshot can also be supplied from MCP export.
 */
import { writeFileSync } from "node:fs";
import { REQUIRED_STATUS } from "./extraction.js";
import { mcpVariablesToFigmaTokens } from "./mcp-to-snapshot.js";
import type { FigmaComponentLibrary, FigmaTokenLibrary } from "./types.js";

/** Esclude componenti nested (nome che inizia con "." o "_"); solo i master sono inclusi. */
function isVisibleComponent(name: string | undefined): boolean {
  if (name == null || typeof name !== "string") return false;
  const n = name.trim();
  return n.length > 0 && n[0] !== "." && n[0] !== "_";
}

const FIGMA_API = "https://api.figma.com/v1";

export interface FetchOptions {
  tokenLibraryId: string;
  componentLibraryId: string;
  accessToken: string;
  /** Se impostato, vengono inclusi solo le variables il cui nome inizia con questo prefisso */
  tokenNamePrefix?: string;
  /** Nomi di variable collection da escludere (es. library collegate non nel file Design System) */
  excludedVariableCollections?: string[];
  /** Se impostato, la risposta raw di variables/local viene scritta qui (debug). */
  debugVariablesPath?: string;
}

function headers(accessToken: string): Record<string, string> {
  return {
    "X-Figma-Token": accessToken,
    Accept: "application/json",
  };
}

function simpleHash(obj: unknown): string {
  const str = JSON.stringify(obj, Object.keys(obj as object).sort());
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h).toString(16);
}

/** Converte colore Figma in esadecimale. Accetta r,g,b in 0–1 (Figma) o 0–255 (alcune API). */
function figmaColorToHex(color: { r: number; g: number; b: number; a?: number }): string {
  let r = color.r ?? 0;
  let g = color.g ?? 0;
  let b = color.b ?? 0;
  if (r > 1 || g > 1 || b > 1) {
    r = r / 255;
    g = g / 255;
    b = b / 255;
  }
  const R = Math.round(Math.max(0, Math.min(1, r)) * 255);
  const G = Math.round(Math.max(0, Math.min(1, g)) * 255);
  const B = Math.round(Math.max(0, Math.min(1, b)) * 255);
  return `#${[R, G, B].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Variable da GET /v1/files/:key/variables/local */
interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode?: Record<string, unknown>;
  description?: string;
  /** true se la variable proviene da una library collegata (non dal file corrente) */
  remote?: boolean;
}

interface FigmaVariableCollection {
  id: string;
  name: string;
  defaultModeId?: string;
  modes?: { modeId: string; name: string }[];
  variableIds?: string[];
  localVariableIds?: string[];
  /** true se la collection proviene da una library collegata (non dal file corrente) */
  remote?: boolean;
}

/** Risposta GET /v1/files/:file_key/variables/local */
interface FigmaVariablesLocalResponse {
  status?: number;
  error?: boolean;
  meta?: {
    variables?: Record<string, FigmaVariable>;
    variableCollections?: Record<string, FigmaVariableCollection>;
  };
}

function isVariableAlias(
  value: unknown
): value is { type: string; id: string } {
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

/** Estrae un colore da value (oggetto r,g,b | { type: "COLOR", r, g, b } | { value: { r, g, b } } | stringa hex). */
function extractColor(value: unknown): { r: number; g: number; b: number } | null {
  if (isColor(value)) return value;
  const obj = value as Record<string, unknown> | null;
  if (obj && typeof obj === "object" && "r" in obj && "g" in obj && "b" in obj) {
    const v = obj as { r: number; g: number; b: number };
    return { r: v.r, g: v.g, b: v.b };
  }
  if (
    obj &&
    typeof obj === "object" &&
    "type" in obj &&
    (obj as { type: string }).type === "COLOR" &&
    "r" in obj &&
    "g" in obj &&
    "b" in obj
  ) {
    const v = obj as { r: number; g: number; b: number };
    return { r: v.r, g: v.g, b: v.b };
  }
  if (obj && typeof obj === "object" && "value" in obj && typeof obj.value === "object" && obj.value !== null) {
    const inner = extractColor((obj as { value: unknown }).value);
    if (inner) return inner;
  }
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    const r = parseInt(value.slice(1, 3), 16) / 255;
    const g = parseInt(value.slice(3, 5), 16) / 255;
    const b = parseInt(value.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  return null;
}

/**
 * Restituisce l'id della modalità da usare per una variable (default della collection).
 * Compatibile con diverse forme della risposta API (defaultModeId, modes[0], chiavi in valuesByMode).
 */
function getEffectiveModeId(
  variable: FigmaVariable,
  collection: FigmaVariableCollection | undefined
): string | undefined {
  const keys = Object.keys(variable.valuesByMode ?? {});
  if (keys.length === 0) return undefined;
  let modeId =
    collection?.defaultModeId ??
    collection?.modes?.[0]?.modeId;
  if (modeId != null && modeId in (variable.valuesByMode ?? {})) return modeId;
  const modeIds = new Set(collection?.modes?.map((m) => m.modeId) ?? []);
  const firstMatch = keys.find((k) => modeIds.has(k) || k === collection?.defaultModeId);
  if (firstMatch) return firstMatch;
  return keys[0];
}

/**
 * Risolve il valore di una variable per la modalità default, seguendo eventuali alias.
 * Usa sempre la modalità effettiva della collection della variable (o della variable alias target).
 */
function resolveVariableValue(
  variableId: string,
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>,
  visited: Set<string>
): unknown {
  if (visited.has(variableId)) return undefined;
  const variable = variables[variableId];
  if (!variable?.valuesByMode) return undefined;
  const collection = collections[variable.variableCollectionId];
  const modeId = getEffectiveModeId(variable, collection);
  if (modeId == null) return undefined;
  let value = variable.valuesByMode[modeId];
  if (value === undefined) {
    const firstKey = Object.keys(variable.valuesByMode).find((k) => variable.valuesByMode![k] != null);
    value = firstKey != null ? variable.valuesByMode[firstKey] : undefined;
  }
  if (value === undefined) return undefined;
  if (isVariableAlias(value)) {
    visited.add(variableId);
    const resolved = resolveVariableValue(
      String((value as { id: string }).id),
      variables,
      collections,
      visited
    );
    return resolved;
  }
  return value;
}

/**
 * Costruisce l'array di token a partire dalla risposta Variables API.
 * Rispetta l'ordine e la gerarchia del pannello Figma: collection → gruppi (nome con / o .) → token.
 * Ogni token include collectionId e collectionName per preservare la struttura.
 */
export function buildTokensFromVariablesResponse(
  variablesData: FigmaVariablesLocalResponse,
  options: Pick<FetchOptions, "tokenNamePrefix" | "excludedVariableCollections">
): FigmaTokenLibrary["tokens"] {
  const rawVariables = variablesData.meta?.variables;
  const rawCollections = variablesData.meta?.variableCollections;
  const variables: Record<string, FigmaVariable> = Array.isArray(rawVariables)
    ? Object.fromEntries((rawVariables as FigmaVariable[]).map((v) => [v.id, v]))
    : (rawVariables ?? {}) as Record<string, FigmaVariable>;
  const collections: Record<string, FigmaVariableCollection> = Array.isArray(rawCollections)
    ? Object.fromEntries((rawCollections as FigmaVariableCollection[]).map((c) => [c.id, c]))
    : (rawCollections ?? {}) as Record<string, FigmaVariableCollection>;

  const tokens: FigmaTokenLibrary["tokens"] = [];
  const collectionIds = Object.keys(collections);

  const excludedCollectionNames = new Set(
    options.excludedVariableCollections ?? ["Grayscale", "Blue Namirial"]
  );

  for (const collectionId of collectionIds) {
    const collection = collections[collectionId];
    const collectionName = collection?.name ?? collectionId;
    if (collection?.remote === true || excludedCollectionNames.has(collectionName)) continue;
    const variableIdsInCollection: string[] =
      collection?.variableIds ??
      collection?.localVariableIds ??
      Object.values(variables)
        .filter((v) => v.variableCollectionId === collectionId)
        .map((v) => v.id);

    for (const variableId of variableIdsInCollection) {
      const variable = variables[variableId];
      if (!variable) continue;
      if (variable.remote === true) continue;
      if (options.tokenNamePrefix != null && options.tokenNamePrefix !== "") {
        const prefix = options.tokenNamePrefix.replace(/\/*$/, "/");
        const prefixAlt = options.tokenNamePrefix.replace(/\/*$/, ".");
        if (
          !variable.name.startsWith(prefix) &&
          !variable.name.startsWith(prefixAlt) &&
          !variable.name.startsWith(options.tokenNamePrefix!)
        ) {
          continue;
        }
      }
      const value = resolveVariableValue(
        variable.id,
        variables,
        collections,
        new Set()
      );
      if (value === undefined) continue;
      const name = variable.name.replace(/\//g, ".");
      let tokenType: FigmaTokenLibrary["tokens"][0]["type"] = "string";
      let tokenValue: string | number;
      switch (variable.resolvedType) {
        case "COLOR": {
          tokenType = "color";
          if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) {
            tokenValue = value;
            break;
          }
          const color = extractColor(value);
          tokenValue = color ? figmaColorToHex(color) : "#000000";
          break;
        }
        case "FLOAT":
          tokenType = "number";
          tokenValue = typeof value === "number" ? value : Number(String(value)) || 0;
          break;
        case "STRING":
          tokenType = "string";
          tokenValue = String(value);
          break;
        case "BOOLEAN":
          tokenType = "string";
          tokenValue = value ? "true" : "false";
          break;
        default:
          tokenValue = String(value);
      }
      tokens.push({
        name,
        value: tokenValue,
        type: tokenType,
        description: variable.description,
        experimental: variable.name.startsWith("exp."),
        collectionId,
        collectionName,
      });
    }
  }

  if (tokens.length === 0) {
    tokens.push({
      name: "color.brand.primary",
      value: "#0066CC",
      type: "color",
    });
  }

  return tokens;
}

/**
 * Recupera i token dalla libreria Variables del file Figma (GET /v1/files/:key/variables/local).
 * I componenti master nel file fanno riferimento a queste variables; i token sono la sola fonte.
 * Richiede scope file_variables:read (e piano Figma che supporti Variables API).
 */
export async function fetchTokenLibrary(
  options: FetchOptions
): Promise<FigmaTokenLibrary> {
  const { tokenLibraryId, accessToken } = options;
  const h = headers(accessToken);

  const variablesRes = await fetch(
    `${FIGMA_API}/files/${tokenLibraryId}/variables/local`,
    { headers: h }
  );
  if (!variablesRes.ok) {
    const text = await variablesRes.text();
    throw new Error(
      `Figma Variables API (token library): ${variablesRes.status} ${text}. ` +
        `Verifica scope file_variables:read e che il file usi Variables.`
    );
  }
  const variablesData = (await variablesRes.json()) as FigmaVariablesLocalResponse;
  if (options.debugVariablesPath) {
    try {
      writeFileSync(
        options.debugVariablesPath,
        JSON.stringify(variablesData, null, 2),
        "utf-8"
      );
      console.warn("  Debug: risposta variables scritta in", options.debugVariablesPath);
    } catch (e) {
      console.warn("  Debug: impossibile scrivere variables raw:", (e as Error).message);
    }
  }
  const tokens = buildTokensFromVariablesResponse(variablesData, options);

  const fileRes = await fetch(`${FIGMA_API}/files/${tokenLibraryId}`, {
    headers: h,
  });
  const fileData = fileRes.ok
    ? ((await fileRes.json()) as { name?: string })
    : { name: "Token Library" };

  return {
    id: tokenLibraryId,
    name: fileData.name ?? "Token Library",
    tokens,
    hash: simpleHash({ id: tokenLibraryId, tokens }),
  };
}

/** Risposta GET /v1/files/:file_key/components (componenti pubblicati nella library) */
interface FigmaFileComponentsResponse {
  status?: number;
  error?: boolean;
  meta?: {
    components?: {
      key: string;
      file_key: string;
      node_id: string;
      name: string;
      description?: string;
    }[];
  };
}

interface FigmaFileResponse {
  name: string;
  document?: { children?: FigmaNode[] };
  components?: Record<string, { name: string; description?: string }>;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

/** Max size (bytes) per il body del file Figma in fallback: oltre questo non caricare (limite stringa Node). */
const MAX_FILE_BODY_BYTES = 80 * 1024 * 1024; // 80 MB

/**
 * Recupera i componenti dalla library: prima prova GET file/components (solo componenti
 * pubblicati); se fallisce (scope/permessi), fallback su GET file + walk del document.
 * Se il file è troppo grande per il fallback, viene restituito errore invece di caricare tutto.
 */
export async function fetchComponentLibrary(
  options: FetchOptions
): Promise<FigmaComponentLibrary> {
  const { componentLibraryId, accessToken } = options;
  const h = headers(accessToken);

  const componentsRes = await fetch(
    `${FIGMA_API}/files/${componentLibraryId}/components`,
    { headers: h }
  );
  const pages: FigmaComponentLibrary["pages"] = [];
  let components: FigmaComponentLibrary["components"] = [];

  if (componentsRes.ok) {
    const compData = (await componentsRes.json()) as FigmaFileComponentsResponse;
    const all = compData.meta?.components ?? [];
    // Solo componenti visibili: esclusi quelli con nome che inizia con "." o "_" (nested dei master).
    const list = all.filter((c) => isVisibleComponent(c.name));
    components = list.map((c) => ({
      id: c.node_id,
      name: c.name,
      key: c.key,
      description: c.description,
      status: REQUIRED_STATUS,
      properties: [],
      variants: [{ name: "default", properties: {} }],
      pageName: undefined,
    }));
  } else {
    const status = componentsRes.status;
    const text = await componentsRes.text().catch(() => "");
    throw new Error(
      `Figma GET /files/.../components: ${status}. ` +
        (status === 403
          ? "Il token potrebbe non avere i permessi per l'endpoint componenti. Verifica gli scope del token (es. file_content:read) e riprova. Per file molto grandi non usare il fallback: usa un token che abiliti questo endpoint."
          : `Risposta: ${text.slice(0, 200)}`)
    );
  }

  if (components.length === 0) {
    const fileRes = await fetch(`${FIGMA_API}/files/${componentLibraryId}`, {
      headers: h,
    });
    if (fileRes.ok) {
      const contentLength = fileRes.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_FILE_BODY_BYTES) {
        throw new Error(
          `Il file Figma è troppo grande (${Math.round(Number(contentLength) / 1024 / 1024)} MB). ` +
            "L'endpoint /files/:key/components ha restituito 0 componenti. Usa un token con permessi per l'endpoint componenti oppure verifica che la library sia pubblicata."
        );
      }
      let data: FigmaFileResponse;
      try {
        data = (await fileRes.json()) as FigmaFileResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Cannot create a string longer than") || msg.includes("0x1fffffe8")) {
          throw new Error(
            "Il file Figma è troppo grande per essere caricato in memoria. " +
              "Assicurati che il token abbia accesso a GET /v1/files/:file_key/components (es. scope file_content:read) così da usare l'elenco componenti invece del file completo."
          );
        }
        throw err;
      }
      const parsed = parseComponentsFromFile(data);
      components = parsed.components;
      parsed.pages.forEach((p) => pages.push(p));
    }
  }

  let libraryName = "Component Library";
  if (components.length > 0) {
    try {
      const fileResForName = await fetch(
        `${FIGMA_API}/files/${componentLibraryId}`,
        { headers: h }
      );
      const cl = fileResForName.headers.get("content-length");
      if (fileResForName.ok && (!cl || parseInt(cl, 10) <= MAX_FILE_BODY_BYTES)) {
        const fileData = (await fileResForName.json()) as { name?: string };
        libraryName = fileData.name ?? libraryName;
      }
    } catch {
      // Nome file non critico: evita di caricare file enormi solo per il nome
    }
  }

  return {
    id: componentLibraryId,
    name: libraryName,
    components,
    pages: pages.length > 0 ? pages : [{ id: "0", name: "Page 1" }],
    hash: simpleHash({ id: componentLibraryId, components, pages }),
  };
}

function parseComponentsFromFile(
  data: FigmaFileResponse
): {
  components: FigmaComponentLibrary["components"];
  pages: FigmaComponentLibrary["pages"];
} {
  const pages: FigmaComponentLibrary["pages"] = [];
  const components: FigmaComponentLibrary["components"] = [];
  const doc = data.document;
  if (!doc?.children) {
    return { components, pages };
  }
  for (const page of doc.children) {
    pages.push({ id: page.id, name: page.name });
    walkNodes(page, page.name, components, data.components ?? {});
  }
  return { components, pages };
}

function walkNodes(
  node: FigmaNode,
  pageName: string,
  out: FigmaComponentLibrary["components"],
  fileComponents: Record<string, { name: string; description?: string }>
): void {
  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
    const meta = fileComponents[node.id];
    const compName = meta?.name ?? node.name;
    if (!isVisibleComponent(compName)) return;
    out.push({
      id: node.id,
      name: compName,
      key: node.id,
      description: meta?.description,
      status: REQUIRED_STATUS,
      properties: [],
      variants: [{ name: "default", properties: {} }],
      pageName,
    });
  }
  for (const child of node.children ?? []) {
    walkNodes(child, pageName, out, fileComponents);
  }
}

/**
 * Costruisce FigmaTokenLibrary a partire da un JSON esportato (stessa forma della risposta
 * Variables API: { meta: { variables, variableCollections } }). Utile per debuggare i
 * valori #000000: esporta la risposta di GET /v1/files/:key/variables/local in un file
 * e usala con FIGMA_VARIABLES_JSON nel CLI.
 */
export function buildTokenLibraryFromVariablesExport(
  data: FigmaVariablesLocalResponse,
  tokenLibraryId: string,
  options: Pick<FetchOptions, "tokenNamePrefix" | "excludedVariableCollections">
): FigmaTokenLibrary {
  const tokens = buildTokensFromVariablesResponse(data, options);
  return {
    id: tokenLibraryId,
    name: "Token Library (export)",
    tokens,
    hash: simpleHash({ id: tokenLibraryId, tokens }),
  };
}

/**
 * Indica se il JSON è nel formato Figma Console MCP (figma_get_variables).
 * Utile quando non si ha scope file_variables:read: si usa l'export MCP come file.
 */
export function isMcpVariablesFormat(data: unknown): data is { data?: { variables?: unknown[] }; variables?: unknown[] } {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const vars = d.data && typeof d.data === "object" && (d.data as Record<string, unknown>).variables;
  const rootVars = d.variables;
  return (Array.isArray(vars) && vars.length > 0) || (Array.isArray(rootVars) && rootVars.length > 0);
}

/**
 * Costruisce FigmaTokenLibrary a partire dall'export di Figma Console MCP (figma_get_variables).
 * Da usare con FIGMA_VARIABLES_JSON quando non si ha scope file_variables:read (es. piano Professional).
 */
export function buildTokenLibraryFromMcpExport(
  mcpResponse: { data?: { variables?: unknown[]; variableCollections?: unknown[] }; variables?: unknown[]; variableCollections?: unknown[] },
  tokenLibraryId: string
): FigmaTokenLibrary {
  const tokens = mcpVariablesToFigmaTokens(mcpResponse as import("./mcp-to-snapshot.js").McpVariablesResponse);
  return {
    id: tokenLibraryId,
    name: "Token Library (MCP export)",
    tokens,
    hash: simpleHash({ id: tokenLibraryId, tokens }),
  };
}

/**
 * Load from pre-built snapshot (e.g. from MCP export). Used when FIGMA_ACCESS_TOKEN
 * is not set or for reproducible builds.
 */
export function loadSnapshot(
  payload: { tokens: FigmaTokenLibrary; components: FigmaComponentLibrary }
): { tokens: FigmaTokenLibrary; components: FigmaComponentLibrary } {
  return payload;
}
