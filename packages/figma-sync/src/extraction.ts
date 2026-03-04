/**
 * Figma extraction contracts and helpers.
 * Actual extraction is done via Figma Console MCP (figma_get_variables, figma_get_component_for_development).
 *
 * This module defines:
 * - Types for MCP extraction output
 * - Processing logic for raw MCP payloads
 * - Filtering: Ready for Dev, page name (Experimental)
 */

export const REQUIRED_STATUS = "Ready for Dev";
export const EXPERIMENTAL_PAGE_NAME = "Experimental";

export interface FigmaVariableRaw {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  variableCollectionId: string;
  valuesByMode?: Record<string, unknown>;
  resolvedValuesByMode?: Record<string, { value?: string | number; aliasTo?: string }>;
}

export interface FigmaCollectionRaw {
  id: string;
  name: string;
  modes: { name: string; modeId: string }[];
  defaultModeId?: string;
}

export interface FigmaComponentRaw {
  id: string;
  name: string;
  key: string;
  description?: string;
  status?: string;
  pageName?: string;
  componentSetId?: string;
  properties?: { name: string; type: string; defaultValue?: string | boolean }[];
}

/** Filters components: only Ready for Dev */
export function filterReadyForDev<T extends { status?: string }>(items: T[]): T[] {
  return items.filter((c) => c.status === REQUIRED_STATUS);
}

/** Splits components by page: Experimental vs stable */
export function splitByExperimentalPage<T extends { pageName?: string }>(
  items: T[],
  experimentalPageName = EXPERIMENTAL_PAGE_NAME
): { stable: T[]; experimental: T[] } {
  const stable: T[] = [];
  const experimental: T[] = [];
  for (const item of items) {
    if (item.pageName === experimentalPageName) {
      experimental.push(item);
    } else {
      stable.push(item);
    }
  }
  return { stable, experimental };
}
