/**
 * Build step: read Figma sync output and generate W3C tokens.json + CSS custom properties.
 * Rispetta la gerarchia Figma: collection → gruppi (path nel nome) → token.
 * Se esiste figma-variables-export.json con modes (es. Light/Dark), genera CSS con
 * [data-theme="light"] e [data-theme="dark"] per lo switch tema nella webapp docs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAPSHOTS = join(ROOT, "packages/figma-sync/snapshots");
const MANIFEST = join(SNAPSHOTS, "manifest.json");
const VARIABLES_EXPORT = join(SNAPSHOTS, "figma-variables-export.json");
const OUT_DIR = join(ROOT, "packages/tokens/dist");

interface FigmaToken {
  name: string;
  value: string | number;
  type: string;
  experimental?: boolean;
  collectionId?: string;
  collectionName?: string;
}

function nestKeys(flat: Record<string, string | number>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!(p in current) || typeof (current as Record<string, unknown>)[p] !== "object") {
        (current as Record<string, unknown>)[p] = {};
      }
      current = (current as Record<string, unknown>)[p] as Record<string, unknown>;
    }
    (current as Record<string, unknown>)[parts[parts.length - 1]] = value;
  }
  return out;
}

/** Sanitizza una chiave per nome di variabile CSS (solo caratteri sicuri) */
function sanitizeCssVarName(key: string): string {
  return key
    .replace(/\//g, "-")
    .replace(/\./g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Normalizza il nome mode Figma per data-theme (es. "Light" → "light", "Mode 1" → "light") */
function themeSlug(modeName: string): string {
  const lower = modeName.trim().toLowerCase();
  if (lower === "dark") return "dark";
  if (lower === "light") return "light";
  if (lower.startsWith("mode 1") || lower === "default") return "light";
  if (lower.startsWith("mode 2")) return "dark";
  return lower.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "default";
}

interface VariableExportVariable {
  id: string;
  name: string;
  resolvedType?: string;
  variableCollectionId?: string;
  valuesByMode?: Record<string, unknown>;
  resolvedValuesByMode?: Record<string, { value?: string | number }>;
}

interface VariableExportCollection {
  id: string;
  name: string;
  modes?: { modeId: string; name: string }[];
}

interface VariableExportData {
  variables?: VariableExportVariable[];
  variableCollections?: VariableExportCollection[];
}

interface VariableExport {
  data?: VariableExportData;
}

/** Costruisce CSS con blocchi per ogni mode (Light/Dark) da figma-variables-export.json */
function buildCssFromVariablesExport(): string | null {
  if (!existsSync(VARIABLES_EXPORT)) return null;
  try {
    const raw = readFileSync(VARIABLES_EXPORT, "utf-8");
    const payload = JSON.parse(raw) as VariableExport & VariableExportData;
    const data: VariableExportData = payload.data ?? payload;
    const variables = data.variables ?? [];
    const collections = data.variableCollections ?? [];
    if (variables.length === 0) return null;
    const collectionById = new Map<string, VariableExportCollection>(
      collections.map((c) => [c.id, c])
    );

  // Raccogli tutte le mode (da collection che ne hanno più di una, es. Theme)
  const modeNamesByColl = new Map<string, string[]>();
  for (const c of collections) {
    const modes = c.modes ?? [];
    if (modes.length >= 1) {
      modeNamesByColl.set(c.id, modes.map((m) => m.name));
    }
  }
  const allModeNames = new Set<string>();
  for (const names of modeNamesByColl.values()) {
    names.forEach((n) => allModeNames.add(n));
  }
  let sortedModes = Array.from(allModeNames).sort((a, b) => {
    const aSlug = themeSlug(a);
    const bSlug = themeSlug(b);
    if (aSlug === "light") return -1;
    if (bSlug === "light") return 1;
    if (aSlug === "dark") return -1;
    if (bSlug === "dark") return 1;
    return a.localeCompare(b);
  });
  // Una sola mode per slug: evita che [data-theme="light"] riceva i valori di "Mode 1"
  // (che non esistono in resolvedValuesByMode Theme) e finisca con firstResolvedVal = Dark.
  // Si mantiene la prima mode per slug (es. "Light" per "light", "Dark" per "dark").
  sortedModes = sortedModes.filter(
    (name, i) => sortedModes.findIndex((n) => themeSlug(n) === themeSlug(name)) === i
  );
  if (sortedModes.length === 0) sortedModes.push("Mode 1");

  const scope = process.env.DS_SCOPE ?? "stable";
  const expPrefix = scope === "stable" ? "exp." : null;

  const byMode = new Map<string, Record<string, string | number>>();
  for (const mode of sortedModes) {
    byMode.set(mode, {});
  }

  for (const v of variables) {
    if (expPrefix && v.name.startsWith(expPrefix)) continue;
    const tokenName = v.name.replace(/\//g, ".");
    const resolved = v.resolvedValuesByMode ?? {};
    const rawByMode = v.valuesByMode ?? {};
    const coll: VariableExportCollection | undefined = v.variableCollectionId
      ? collectionById.get(v.variableCollectionId)
      : undefined;
    const firstEntry = Object.values(resolved)[0] as { value?: string | number } | undefined;
    const firstResolvedVal = firstEntry?.value;

    for (const modeName of sortedModes) {
      let value: string | number | undefined;
      const r = resolved[modeName];
      if (r?.value !== undefined) {
        value = r.value;
      } else {
        const modeId = coll?.modes?.find((m) => m.name === modeName)?.modeId;
        const raw = modeId != null ? rawByMode[modeId] : Object.values(rawByMode)[0];
        if (typeof raw === "object" && raw !== null && "r" in raw && "g" in raw && "b" in raw) {
          const { r: rr, g, b } = raw as { r: number; g: number; b: number };
          const R = Math.round(Math.min(1, Math.max(0, rr)) * 255);
          const G = Math.round(Math.min(1, Math.max(0, g)) * 255);
          const B = Math.round(Math.min(1, Math.max(0, b)) * 255);
          value = `#${[R, G, B].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
        } else if (typeof raw === "number" || typeof raw === "string") {
          value = raw;
        }
      }
      if (value === undefined && firstResolvedVal !== undefined) {
        value = firstResolvedVal;
      }
      if (value !== undefined) {
        const map = byMode.get(modeName)!;
        map[tokenName] = value;
      }
    }
  }

  const lines: string[] = [];
  for (let i = 0; i < sortedModes.length; i++) {
    const modeName = sortedModes[i]!;
    const slug = themeSlug(modeName);
    const selector = i === 0 ? ":root" : `[data-theme="${slug}"]`;
    lines.push(`${selector} {`);
    const map = byMode.get(modeName) ?? {};
    for (const [key, value] of Object.entries(map)) {
      const varName = "--nds-" + sanitizeCssVarName(key);
      if (varName !== "--nds-") lines.push(`  ${varName}: ${value};`);
    }
    lines.push("}");
  }
  return lines.join("\n");
  } catch {
    return null;
  }
}

function run(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const scope = process.env.DS_SCOPE ?? "stable";
  let tokens: FigmaToken[] = [];

  if (existsSync(MANIFEST)) {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as { scope?: string };
    const tokensPath = join(SNAPSHOTS, "current-tokens.json");
    if (existsSync(tokensPath)) {
      tokens = JSON.parse(readFileSync(tokensPath, "utf-8")) as FigmaToken[];
    }
    if (scope === "stable") {
      tokens = tokens.filter((t) => !t.experimental);
    }
  }

  const byCollection = new Map<string, FigmaToken[]>();
  for (const t of tokens) {
    const coll = t.collectionName ?? "Tokens";
    if (!byCollection.has(coll)) byCollection.set(coll, []);
    byCollection.get(coll)!.push(t);
  }

  const w3cRoot: Record<string, unknown> = {
    $metadata: {
      tokenSetOrder: [scope],
    },
  };

  const flatForCss: Record<string, string | number> = {};

  for (const [collectionName, collTokens] of byCollection) {
    const flat: Record<string, string | number> = {};
    for (const t of collTokens) {
      const name = t.name.replace(/^exp\./, "exp.");
      flat[name] = t.value;
      flatForCss[name] = t.value;
    }
    if (Object.keys(flat).length > 0) {
      w3cRoot[collectionName] = nestKeys(flat);
    }
  }

  if (Object.keys(w3cRoot).length <= 1) {
    const flat: Record<string, string | number> = {};
    for (const t of tokens) {
      flat[t.name.replace(/^exp\./, "exp.")] = t.value;
    }
    if (Object.keys(flat).length === 0) {
      flat["color.brand.primary"] = "#0066CC";
    }
    Object.assign(w3cRoot, nestKeys(flat));
    Object.assign(flatForCss, flat);
  }

  const modeCss = buildCssFromVariablesExport();
  if (modeCss) {
    writeFileSync(join(OUT_DIR, "tokens.css"), modeCss);
  } else {
    const cssLines: string[] = [":root {"];
    for (const [key, value] of Object.entries(flatForCss)) {
      const varName = "--nds-" + sanitizeCssVarName(key);
      if (varName !== "--nds-") cssLines.push(`  ${varName}: ${value};`);
    }
    cssLines.push("}");
    writeFileSync(join(OUT_DIR, "tokens.css"), cssLines.join("\n"));
  }

  writeFileSync(
    join(OUT_DIR, "tokens.json"),
    JSON.stringify(w3cRoot, null, 2)
  );
}

run();
