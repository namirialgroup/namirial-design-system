/**
 * Registry icone Lucide per nds-icon.
 * Chiave: nome in kebab-case (es. "arrow-right", "check").
 * Valore: attributi SVG path (viewBox 0 0 24 24 di default).
 * Il registro può essere espanso con uno script che legge il manifest Figma (lucide-icons/*)
 * e genera le path da @lucide/icons o lucide.
 */
export interface IconData {
  path: string;
  viewBox?: string;
}

export const iconRegistry: Record<string, IconData> = {
  check: { path: "M20 6 9 17l-5-5" },
  x: { path: "M18 6 6 18M6 6l12 12" },
  "arrow-right": { path: "M5 12h14m-7-7 7 7-7 7" },
  "link-2": {
    path: "M9 17H7A5 5 0 0 1 7 7h2m4 0h2a5 5 0 0 1 0 10h-2m-4 0H9m0-4H7m4 4H9",
  },
  info: {
    path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v4m0-8v.01",
  },
};

const DEFAULT_VIEWBOX = "0 0 24 24";

export function getIconData(name: string): IconData | undefined {
  const key = name.replace(/\s+/g, "-").toLowerCase();
  return iconRegistry[key];
}

export function getIconViewBox(data: IconData): string {
  return data.viewBox ?? DEFAULT_VIEWBOX;
}
