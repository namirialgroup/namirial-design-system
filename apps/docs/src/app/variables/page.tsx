import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { VariablesViewer } from "./VariablesViewer";

type Mode = { name: string; modeId: string };
type Collection = { id: string; name: string; modes: Mode[] };
type RawVariable = {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  valuesByMode?: Record<string, unknown>;
};
type ResolvedVal = { value?: string | number; aliasTo?: string };
type NormalizedVar = {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  resolvedValuesByMode?: Record<string, ResolvedVal & { __aliasId?: string }>;
};

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toByte = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255);
  const hex = [toByte(r), toByte(g), toByte(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  return a < 1 ? `#${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}` : `#${hex}`;
}

function isVariableAlias(raw: unknown): raw is { type: string; id: string } {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "type" in (raw as object) &&
    (raw as { type: string }).type === "VARIABLE_ALIAS" &&
    "id" in (raw as object)
  );
}

function toDisplayValue(raw: unknown, resolvedType: string): string | number | undefined {
  if (raw == null) return undefined;
  if (isVariableAlias(raw)) return undefined;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return raw;
  if (resolvedType === "COLOR" && typeof raw === "object" && raw !== null && "r" in raw) {
    const o = raw as { r?: number; g?: number; b?: number; a?: number };
    return rgbaToHex(Number(o.r ?? 0), Number(o.g ?? 0), Number(o.b ?? 0), Number(o.a ?? 1));
  }
  if (typeof raw === "object") return undefined;
  return String(raw);
}

/** Mappa modeId -> mode name per collection */
function getModeIdToName(collections: Collection[]): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  for (const c of collections) {
    const byId = new Map<string, string>();
    for (const m of c.modes ?? []) byId.set(m.modeId, m.name);
    out.set(c.id, byId);
  }
  return out;
}

/** Prima passata: valori primitivi in display, alias salvati come __aliasId */
function normalizeVariables(
  variables: RawVariable[],
  collections: Collection[]
): NormalizedVar[] {
  const modeIdToNameByColl = getModeIdToName(collections);
  return variables.map((v) => {
    const byModeId = v.valuesByMode ?? {};
    const modeNames = modeIdToNameByColl.get(v.variableCollectionId);
    const resolvedValuesByMode: Record<string, ResolvedVal & { __aliasId?: string }> = {};
    for (const [modeId, raw] of Object.entries(byModeId)) {
      const modeName = modeNames?.get(modeId) ?? modeId;
      if (isVariableAlias(raw)) {
        resolvedValuesByMode[modeName] = { __aliasId: raw.id };
      } else {
        const value = toDisplayValue(raw, v.resolvedType ?? "");
        if (value !== undefined) resolvedValuesByMode[modeName] = { value };
      }
    }
    return {
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType ?? "",
      variableCollectionId: v.variableCollectionId,
      ...(Object.keys(resolvedValuesByMode).length > 0 ? { resolvedValuesByMode } : {}),
    };
  });
}

/** Risolve un singolo entry seguendo la catena di alias (per collection multi-mode) */
function getResolvedEntry(
  v: NormalizedVar,
  modeName: string,
  byId: Map<string, NormalizedVar>,
  visited: Set<string>
): { value?: string | number; aliasTo?: string } | undefined {
  const rvm = v.resolvedValuesByMode;
  if (!rvm) return undefined;
  const entry = rvm[modeName] ?? Object.values(rvm)[0];
  if (!entry) return undefined;
  const hasValue = "value" in entry && (entry as ResolvedVal).value !== undefined;
  if (hasValue) return { value: (entry as ResolvedVal).value, aliasTo: (entry as ResolvedVal).aliasTo };
  const aliasId = (entry as ResolvedVal & { __aliasId?: string }).__aliasId;
  if (!aliasId) return undefined;
  if (visited.has(aliasId)) return undefined;
  visited.add(aliasId);
  const target = byId.get(aliasId);
  if (!target) return { aliasTo: "?" };
  const next = getResolvedEntry(target, modeName, byId, visited);
  return next ? { value: next.value, aliasTo: target.name } : { aliasTo: target.name };
}

/** Seconda passata: risolve __aliasId (anche a catena) con valore e nome della variabile target */
function resolveAliases(normalized: NormalizedVar[]): { id: string; name: string; resolvedType: string; variableCollectionId: string; resolvedValuesByMode?: Record<string, ResolvedVal> }[] {
  const byId = new Map<string, NormalizedVar>(normalized.map((n) => [n.id, n]));
  return normalized.map((v) => {
    const out: Record<string, ResolvedVal> = {};
    if (!v.resolvedValuesByMode) {
      return { id: v.id, name: v.name, resolvedType: v.resolvedType, variableCollectionId: v.variableCollectionId };
    }
    for (const modeName of Object.keys(v.resolvedValuesByMode)) {
      const resolved = getResolvedEntry(v, modeName, byId, new Set<string>());
      if (resolved && (resolved.value !== undefined || resolved.aliasTo)) {
        out[modeName] = { ...(resolved.value !== undefined ? { value: resolved.value } : {}), ...(resolved.aliasTo ? { aliasTo: resolved.aliasTo } : {}) };
      } else {
        const entry = v.resolvedValuesByMode[modeName];
        const { __aliasId: _, ...rest } = (entry ?? {}) as ResolvedVal & { __aliasId?: string };
        if (Object.keys(rest).length > 0) out[modeName] = rest;
      }
    }
    return {
      id: v.id,
      name: v.name,
      resolvedType: v.resolvedType,
      variableCollectionId: v.variableCollectionId,
      ...(Object.keys(out).length > 0 ? { resolvedValuesByMode: out } : {}),
    };
  });
}

function getVariablesData(): { variables: unknown[]; variableCollections: unknown[] } | null {
  const root = process.cwd();
  const paths = [
    join(root, "packages/figma-sync/snapshots/figma-variables-export.json"),
    join(root, "../packages/figma-sync/snapshots/figma-variables-export.json"),
    join(root, "../../packages/figma-sync/snapshots/figma-variables-export.json"),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        type Payload = { variables?: RawVariable[]; variableCollections?: Collection[] };
        const data = JSON.parse(raw) as { data?: Payload } | Payload;
        const d: Payload = "data" in data && data.data != null ? data.data : (data as Payload);
        const variables = (d.variables ?? []) as RawVariable[];
        const collections = (d.variableCollections ?? []) as Collection[];
        const normalized = resolveAliases(normalizeVariables(variables, collections));
        return {
          variables: normalized,
          variableCollections: collections,
        };
      } catch {
        return null;
      }
    }
  }
  return null;
}

export default function VariablesPage() {
  const data = getVariablesData();

  return (
    <>
      <h1>Variables</h1>
      <p className="nds-lead">
        Tutte le Variables del Design System 2026 (Figma). Scegli una collection, filtra per gruppo e cerca per nome. Ogni colonna è un mode; valori diretti o alias.
      </p>

      {!data || data.variables.length === 0 ? (
        <div className="nds-alert" role="alert">
          <p>
            Nessun dato Variables trovato. Assicurati che <code>packages/figma-sync/snapshots/figma-variables-export.json</code> esista
            (generato con <code>pnpm merge:mcp-exports</code> dalla cartella <code>mcp-exports</code>).
          </p>
        </div>
      ) : (
        <VariablesViewer
          variables={data.variables as Parameters<typeof VariablesViewer>[0]["variables"]}
          variableCollections={data.variableCollections as Parameters<typeof VariablesViewer>[0]["variableCollections"]}
        />
      )}
    </>
  );
}
