/**
 * Tokens are populated at build time from packages/figma-sync output.
 * Fallback for when sync has not run.
 */
import type { DesignTokens } from "./types.js";

export const tokens: DesignTokens = {
  color: {
    brand: {
      primary: "#0066CC",
    },
  },
  spacing: {},
  typography: {},
};
