/**
 * Filter libraries strictly by configured IDs and split stable vs experimental.
 */
import type {
  FigmaComponent,
  FigmaComponentLibrary,
  FigmaToken,
  FigmaTokenLibrary,
} from "./types.js";

export interface FilterConfig {
  tokenLibraryId: string;
  componentLibraryId: string;
  experimentalPageName: string;
  scope: "stable" | "experimental";
}

export function filterTokensByScope(
  library: FigmaTokenLibrary,
  scope: "stable" | "experimental"
): FigmaToken[] {
  if (scope === "stable") {
    return library.tokens.filter((t) => !t.experimental);
  }
  return library.tokens.filter((t) => t.experimental && t.name.startsWith("exp."));
}

export function filterComponentsByScope(
  library: FigmaComponentLibrary,
  config: FilterConfig
): { stable: FigmaComponent[]; experimental: FigmaComponent[] } {
  const stable: FigmaComponent[] = [];
  const experimental: FigmaComponent[] = [];
  const expPage = config.experimentalPageName;
  for (const comp of library.components) {
    if (comp.pageName === expPage) {
      experimental.push(comp);
    } else {
      stable.push(comp);
    }
  }
  return { stable, experimental };
}

export function filterLibrariesById(
  tokenLibrary: FigmaTokenLibrary,
  componentLibrary: FigmaComponentLibrary,
  config: FilterConfig
): boolean {
  const tokenMatch = tokenLibrary.id === config.tokenLibraryId;
  const componentMatch = componentLibrary.id === config.componentLibraryId;
  return tokenMatch && componentMatch;
}
