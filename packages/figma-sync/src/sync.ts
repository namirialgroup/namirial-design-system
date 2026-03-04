/**
 * Orchestrates fetch → filter → validate → manifest.
 * If validation fails, throws and stops the build.
 */
import { filterComponentsByScope, filterTokensByScope, filterLibrariesById } from "./filter.js";
import type { FilterConfig } from "./filter.js";
import type {
  FigmaComponentLibrary,
  FigmaSyncManifest,
  FigmaSyncResult,
  FigmaTokenLibrary,
} from "./types.js";
import { getSnapshotHash } from "./manifest.js";

const REQUIRED_STATUS = "Ready for Dev";
const EXPERIMENTAL_TOKEN_PREFIX = "exp.";

export interface SyncOptions extends FilterConfig {
  tokens: FigmaTokenLibrary;
  components: FigmaComponentLibrary;
}

export function runSync(options: SyncOptions): FigmaSyncResult {
  const errors: string[] = [];

  if (
    !filterLibrariesById(options.tokens, options.components, options)
  ) {
    errors.push(
      `Library ID mismatch. Expected token: ${options.tokenLibraryId}, component: ${options.componentLibraryId}`
    );
  }

  const { stable: stableComponents, experimental: experimentalComponents } =
    filterComponentsByScope(options.components, options);

  for (const comp of [...stableComponents, ...experimentalComponents]) {
    if (comp.status !== REQUIRED_STATUS) {
      errors.push(
        `Component "${comp.name}" must have status "${REQUIRED_STATUS}". Got: ${comp.status ?? "undefined"}`
      );
    }
  }

  const stableTokens = filterTokensByScope(options.tokens, "stable");
  const experimentalTokens = filterTokensByScope(options.tokens, "experimental");

  for (const t of experimentalTokens) {
    if (!t.name.startsWith(EXPERIMENTAL_TOKEN_PREFIX)) {
      errors.push(
        `Experimental token must be namespaced "${EXPERIMENTAL_TOKEN_PREFIX}*": ${t.name}`
      );
    }
  }

  const tokenNames = new Set(options.tokens.tokens.map((t) => t.name));
  const expNames = new Set(experimentalTokens.map((t) => t.name));
  for (const name of expNames) {
    const stableName = name.replace(/^exp\./, "");
    if (tokenNames.has(stableName)) {
      errors.push(
        `Experimental token cannot override stable token: ${name} vs ${stableName}`
      );
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      manifest: buildManifest(options, stableComponents, experimentalComponents, stableTokens, experimentalTokens),
      tokens: options.tokens,
      components: options.components,
      stableTokens: [],
      experimentalTokens: [],
      errors,
    };
  }

  const scope =
    options.scope === "experimental" ? "experimental" : "stable";
  const manifest = buildManifest(
    options,
    stableComponents,
    experimentalComponents,
    stableTokens,
    experimentalTokens
  );

  const result: FigmaSyncResult = {
    success: true,
    manifest,
    tokens: options.tokens,
    components: options.components,
    stableTokens,
    experimentalTokens,
    errors: [],
  };

  result.manifest.timestamp = new Date().toISOString();
  return result;
}

function buildManifest(
  options: SyncOptions,
  stableComponents: { name: string }[],
  experimentalComponents: { name: string }[],
  stableTokens: { name: string }[],
  experimentalTokens: { name: string }[]
): FigmaSyncManifest {
  return {
    timestamp: new Date().toISOString(),
    tokenLibrary: { id: options.tokenLibraryId, hash: options.tokens.hash },
    componentLibrary: {
      id: options.componentLibraryId,
      hash: options.components.hash,
    },
    scope: options.scope,
    stableComponents: stableComponents.map((c) => c.name),
    experimentalComponents: experimentalComponents.map((c) => c.name),
    tokenCount: stableTokens.length + experimentalTokens.length,
    componentCount:
      options.scope === "stable"
        ? stableComponents.length
        : stableComponents.length + experimentalComponents.length,
  };
}

export function getSnapshotHashFromResult(result: FigmaSyncResult): string {
  return getSnapshotHash(result);
}
