/**
 * Namirial Design System — Single source of truth configuration.
 * Figma library IDs must be set before running sync.
 */
export default {
  name: "Namirial Design System",
  figma: {
    tokenLibraryId: process.env.FIGMA_TOKEN_LIBRARY_ID ?? "TOKEN_LIBRARY_ID",
    componentLibraryId:
      process.env.FIGMA_COMPONENT_LIBRARY_ID ?? "COMPONENT_LIBRARY_ID",
    experimentalPageName: "Experimental",
  },
  github: {
    stableBranch: "main",
    experimentalBranch: "experimental",
  },
  npm: {
    scope: "@namirial",
    packages: [
      "@namirial/design-system",
      "@namirial/react",
      "@namirial/angular",
      "@namirial/vue",
    ],
  },
} as const;

export type DesignSystemConfig = ReturnType<typeof import("./design-system.config").default>;
