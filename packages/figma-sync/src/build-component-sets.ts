/**
 * Legge current-components.json e produce component-sets.json:
 * raggruppa i componenti per "set" (es. Button = tutte le varianti Status=..., Style=..., Icon-only=...).
 * Usato da docs per mostrare i nomi reali delle varianti Figma.
 * Includere componenti aggiuntivi (es. da pagine "Data display & filter") via design-system.config.json:
 *   "docs": { "additionalComponents": [{ "slug": "table", "label": "Table" }] }
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function getComponentSetsPath(snapDir: string): string {
  return join(snapDir, "component-sets.json");
}

export function getDocComponentsPath(snapDir: string): string {
  return join(snapDir, "doc-components.json");
}

export interface DocComponentEntry {
  slug: string;
  label: string;
}

interface FigmaComponent {
  id: string;
  name: string;
  key: string;
  description?: string;
  status?: string;
  properties: unknown[];
  variants: { name: string; properties: Record<string, string> }[];
  pageName?: string;
}

/** Pattern per riconoscere varianti del Button (Figma: Status=..., Style=..., Icon-only=...). */
const BUTTON_PATTERN = /^Status=.+, Style=.+, Icon-only=(True|False)$/;

/** Estende il pattern: qualsiasi nome con Property=Value, Property2=Value2 (varianti Figma). */
const VARIANT_PATTERN = /^([A-Za-z0-9-]+=[^,=]+)(,\s*[A-Za-z0-9-]+=[^,=]+)*$/;

/** Nome "doc" del set (slug per URL). */
const SET_NAMES: Record<string, string> = {
  button: "Button",
};

/** Estrae assi e valori da un nome variante Figma (es. "Status=Default, Style=Ghost, Icon-only=False"). */
function parseVariantName(figmaName: string): { axes: Record<string, string[]>; properties: Record<string, string> } {
  const axes: Record<string, Set<string>> = {};
  const properties: Record<string, string> = {};
  const parts = figmaName.split(/,\s*/);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    properties[key] = value;
    if (!axes[key]) axes[key] = new Set();
    axes[key].add(value);
  }
  const axesArrays: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(axes)) {
    axesArrays[k] = Array.from(set).sort();
  }
  return { axes: axesArrays, properties };
}

function inferSetName(figmaName: string): string | null {
  if (BUTTON_PATTERN.test(figmaName)) return "button";
  if (VARIANT_PATTERN.test(figmaName)) {
    const lower = figmaName.toLowerCase();
    if (lower.includes("style=") && (lower.includes("icon-only") || lower.includes("status="))) return "button";
  }
  return null;
}

export function buildComponentSets(snapDir: string): void {
  const currentPath = join(snapDir, "current-components.json");
  const outputPath = join(snapDir, "component-sets.json");

  if (!existsSync(currentPath)) {
    return;
  }

  const raw = readFileSync(currentPath, "utf-8");
  const components = JSON.parse(raw) as FigmaComponent[];

  type SetEntry = {
    displayName: string;
    variantAxes: Record<string, string[]>;
    variants: { figmaName: string; storyId?: string; ndsVariant?: string; properties?: Record<string, string> }[];
  };
  const sets: Record<string, SetEntry> = {};

  for (const c of components) {
    const setName = inferSetName(c.name);
    if (!setName) continue;

    if (!sets[setName]) {
      sets[setName] = {
        displayName: SET_NAMES[setName] ?? setName,
        variantAxes: {},
        variants: [],
      };
    }

    const { axes, properties } = parseVariantName(c.name);
    for (const [axis, values] of Object.entries(axes)) {
      const existing = sets[setName]!.variantAxes[axis] ?? [];
      const combined = [...new Set([...existing, ...values])].sort();
      sets[setName]!.variantAxes[axis] = combined;
    }

    // Mappatura opzionale Figma Style → nds-button (WC attuale); le varianti restano tutte da Figma
    let ndsVariant: string | undefined;
    if (setName === "button") {
      if (c.name.includes("Style=Ghost")) ndsVariant = "ghost";
      else if (c.name.includes("Style=Standard") || c.name.includes("Style=Full-radius"))
        ndsVariant = "primary";
      else if (c.name.includes("Style=Secondary")) ndsVariant = "secondary";
      else ndsVariant = "primary";
    }

    sets[setName].variants.push({
      figmaName: c.name,
      ndsVariant,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    });
  }

  for (const s of Object.values(sets)) {
    s.variants.sort((a, b) => a.figmaName.localeCompare(b.figmaName));
  }

  writeFileSync(outputPath, JSON.stringify(sets, null, 2), "utf-8");
  console.log("  component-sets.json aggiornato");

  // Elenco componenti per la docs: Button, Icon + tutti i componenti “standalone” da Figma
  const docList: DocComponentEntry[] = [];
  const slugSet = new Set<string>();

  const add = (slug: string, label: string) => {
    const s = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "component";
    if (!slugSet.has(s)) {
      slugSet.add(s);
      docList.push({ slug: s, label });
    }
  };

  add("button", "Button");
  add("icon", "Icon");

  /** Componenti aggiuntivi da design-system.config.json (es. Data display & filter) */
  const configPath = join(snapDir, "..", "..", "..", "design-system.config.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
        docs?: { additionalComponents?: { slug: string; label: string }[] };
      };
      for (const c of config.docs?.additionalComponents ?? []) {
        if (c?.slug && c?.label) add(c.slug, c.label);
      }
    } catch {
      /* ignore */
    }
  }

  /** Slug da escludere: non sono Ready to Dev. */
  const EXCLUDED_DOC_SLUGS = new Set(["cover"]);

  for (const c of components) {
    const name = c.name?.trim() || "";
    if (!name) continue;
    if (BUTTON_PATTERN.test(name)) continue;
    if (name.startsWith("lucide-icons/") || name.startsWith("custom-icons/")) continue;
    // Solo nomi che non sono varianti (senza "=") così da avere Message, Toast, Alert, nav-divider, input, ecc.
    if (name.includes("=")) continue;
    const label = name;
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "component";
    if (slug && slug.length > 0 && !EXCLUDED_DOC_SLUGS.has(slug)) add(slug, label);
  }

  docList.sort((a, b) => {
    if (a.slug === "button") return -1;
    if (b.slug === "button") return 1;
    if (a.slug === "icon") return -1;
    if (b.slug === "icon") return 1;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });

  const docComponentsPath = join(snapDir, "doc-components.json");
  writeFileSync(docComponentsPath, JSON.stringify({ components: docList }, null, 2), "utf-8");
  console.log("  doc-components.json aggiornato (" + docList.length + " voci)");
}
