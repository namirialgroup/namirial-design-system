/**
 * Figma-derived schema types. Single source of truth from Figma.
 */
export interface FigmaToken {
  name: string;
  value: string | number;
  type: "color" | "dimension" | "fontFamily" | "fontWeight" | "duration" | "number" | "string";
  description?: string;
  /** Experimental tokens must be namespaced exp.* */
  experimental?: boolean;
  /** Id e nome della collection Figma (per rispettare gerarchia del pannello Variables) */
  collectionId?: string;
  collectionName?: string;
}

export interface FigmaTokenLibrary {
  id: string;
  name: string;
  tokens: FigmaToken[];
  hash: string;
}

export interface FigmaComponentVariant {
  name: string;
  properties: Record<string, string>;
  propertyValues?: Record<string, unknown>;
}

export interface FigmaComponentProperty {
  name: string;
  type: "BOOLEAN" | "TEXT" | "VARIANT" | "INSTANCE_SWAP";
  defaultValue?: string | boolean;
  variantOptions?: string[];
}

export interface FigmaComponent {
  id: string;
  name: string;
  key: string;
  description?: string;
  /** Must be "Ready for Dev" for inclusion */
  status?: string;
  properties: FigmaComponentProperty[];
  variants: FigmaComponentVariant[];
  /** Page name used for stable vs experimental split */
  pageName?: string;
}

export interface FigmaComponentLibrary {
  id: string;
  name: string;
  components: FigmaComponent[];
  pages: { id: string; name: string }[];
  hash: string;
}

export interface FigmaSyncManifest {
  timestamp: string;
  tokenLibrary: { id: string; hash: string };
  componentLibrary: { id: string; hash: string };
  scope: "stable" | "experimental";
  stableComponents: string[];
  experimentalComponents: string[];
  tokenCount: number;
  componentCount: number;
}

export interface FigmaSyncResult {
  success: boolean;
  manifest: FigmaSyncManifest;
  tokens: FigmaTokenLibrary;
  components: FigmaComponentLibrary;
  stableTokens: FigmaToken[];
  experimentalTokens: FigmaToken[];
  errors: string[];
}
