#!/usr/bin/env node
/**
 * CLI: sync Figma libraries, validate, write manifest and snapshot hash.
 * Usage: DS_SCOPE=stable|experimental pnpm sync:figma
 * Requires FIGMA_ACCESS_TOKEN or snapshot at packages/figma-sync/snapshots/input.json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  fetchTokenLibrary,
  fetchComponentLibrary,
  loadSnapshot,
  buildTokenLibraryFromVariablesExport,
  buildTokenLibraryFromMcpExport,
  isMcpVariablesFormat,
} from "./fetch.js";
import { exportIconsToDocs } from "./export-icons.js";
import { runSync } from "./sync.js";
import { buildComponentSets } from "./build-component-sets.js";
import { getManifestPath, getSnapshotHashPath, getSnapshotHash } from "./manifest.js";

const ROOT = process.cwd();
const SCOPE = (process.env.DS_SCOPE ?? "stable") as "stable" | "experimental";

/** Carica variabili da access-token-id.env nella root se FIGMA_ACCESS_TOKEN non è già impostato. */
function loadEnvFileIfNeeded(): void {
  if (process.env.FIGMA_ACCESS_TOKEN) return;
  const envPath = join(ROOT, "access-token-id.env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = value;
  }
}

async function main(): Promise<void> {
  loadEnvFileIfNeeded();

  let tokenLibraryId = process.env.FIGMA_TOKEN_LIBRARY_ID ?? "TOKEN_LIBRARY_ID";
  let componentLibraryId = process.env.FIGMA_COMPONENT_LIBRARY_ID ?? "COMPONENT_LIBRARY_ID";
  let experimentalPageName = "Experimental";
  let tokenNamePrefix: string | undefined;
  let excludedVariableCollections: string[] | undefined;
  const configPath = join(ROOT, "design-system.config.json");
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
      figma?: {
        tokenLibraryId?: string;
        componentLibraryId?: string;
        experimentalPageName?: string;
        tokenNamePrefix?: string;
        excludedVariableCollections?: string[];
      };
    };
    tokenLibraryId = config.figma?.tokenLibraryId ?? tokenLibraryId;
    componentLibraryId = config.figma?.componentLibraryId ?? componentLibraryId;
    experimentalPageName = config.figma?.experimentalPageName ?? experimentalPageName;
    tokenNamePrefix = config.figma?.tokenNamePrefix;
    excludedVariableCollections = config.figma?.excludedVariableCollections;
  }

  let tokens: Awaited<ReturnType<typeof fetchTokenLibrary>>;
  let components: Awaited<ReturnType<typeof fetchComponentLibrary>>;

  const snapshotPath = join(ROOT, "packages/figma-sync/snapshots/input.json");
  const token = process.env.FIGMA_ACCESS_TOKEN;
  const forceApi = process.env.FORCE_FIGMA_API === "1" || process.env.FORCE_FIGMA_API === "true";
  const useSnapshot = existsSync(snapshotPath) && !forceApi && !token;

  if (useSnapshot) {
    console.log("Fonte: snapshot (packages/figma-sync/snapshots/input.json)");
    const raw = readFileSync(snapshotPath, "utf-8");
    const payload = JSON.parse(raw) as { tokens: typeof tokens; components: typeof components };
    const loaded = loadSnapshot(payload);
    tokens = loaded.tokens;
    components = loaded.components;
  } else if (token) {
    const variablesJsonPath =
      process.env.FIGMA_VARIABLES_JSON ||
      join(ROOT, "packages/figma-sync/snapshots/figma-variables-export.json");
    if (existsSync(variablesJsonPath)) {
      const variablesData = JSON.parse(readFileSync(variablesJsonPath, "utf-8")) as unknown;
      if (isMcpVariablesFormat(variablesData)) {
        console.log("Fonte: API Figma (Components) + token da export MCP:", variablesJsonPath);
        tokens = buildTokenLibraryFromMcpExport(variablesData, tokenLibraryId);
      } else {
        console.log("Fonte: API Figma (Components) + token da export JSON (Variables API):", variablesJsonPath);
        tokens = buildTokenLibraryFromVariablesExport(
          variablesData as Parameters<typeof buildTokenLibraryFromVariablesExport>[0],
          tokenLibraryId,
          { tokenNamePrefix, excludedVariableCollections }
        );
      }
      try {
        components = await fetchComponentLibrary({
          tokenLibraryId,
          componentLibraryId,
          accessToken: token,
          tokenNamePrefix,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Errore fetch componenti:", msg);
        process.exit(1);
      }
    } else {
      console.log("Fonte: API Figma (Variables + Components)");
      const snapDirForDebug = join(ROOT, "packages/figma-sync/snapshots");
      const opts = {
        tokenLibraryId,
        componentLibraryId,
        accessToken: token,
        tokenNamePrefix,
        excludedVariableCollections,
        ...(process.env.FIGMA_DEBUG_VARIABLES === "1" || process.env.FIGMA_DEBUG_VARIABLES === "true"
          ? { debugVariablesPath: join(snapDirForDebug, "figma-variables-raw.json") }
          : {}),
      };
      try {
        tokens = await fetchTokenLibrary(opts);
        components = await fetchComponentLibrary(opts);
      } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Errore durante il fetch da Figma:", msg);
      if (msg.includes("403") || msg.includes("Variables")) {
        console.error("\nPossibili cause:");
        console.error("  - Token senza scope file_variables:read (aggiungi lo scope e rigenera il token)");
        console.error("  - Piano Figma che non supporta Variables API (serve supporto Enterprise/Variables)");
        console.error("  - File senza Variables (usa la libreria Variables nel file, non solo gli stili colore)");
      }
      process.exit(1);
    }
  }
  } else {
    console.error(
      "Imposta FIGMA_ACCESS_TOKEN (con scope file_variables:read) oppure usa uno snapshot in packages/figma-sync/snapshots/input.json"
    );
    process.exit(1);
  }

  const result = runSync({
    tokenLibraryId,
    componentLibraryId,
    experimentalPageName,
    scope: SCOPE,
    tokens,
    components,
  });

  if (!result.success) {
    console.error("Validation failed:");
    result.errors.forEach((e) => console.error("  -", e));
    process.exit(1);
  }

  const snapDir = join(ROOT, "packages/figma-sync/snapshots");
  mkdirSync(snapDir, { recursive: true });
  // Copy current → previous for changelog diff (before overwriting)
  const prevManifest = join(snapDir, "previous-manifest.json");
  const prevTokens = join(snapDir, "previous-tokens.json");
  const prevComponents = join(snapDir, "previous-components.json");
  const currManifestPath = join(snapDir, "manifest.json");
  const currTokensPath = join(snapDir, "current-tokens.json");
  const currComponentsPath = join(snapDir, "current-components.json");
  if (existsSync(currManifestPath)) writeFileSync(prevManifest, readFileSync(currManifestPath, "utf-8"));
  if (existsSync(currTokensPath)) writeFileSync(prevTokens, readFileSync(currTokensPath, "utf-8"));
  if (existsSync(currComponentsPath)) writeFileSync(prevComponents, readFileSync(currComponentsPath, "utf-8"));

  const manifestPath = join(ROOT, getManifestPath());
  writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2));
  const hash = getSnapshotHash(result);
  const hashPath = join(ROOT, getSnapshotHashPath());
  writeFileSync(hashPath, hash);
  writeFileSync(
    join(snapDir, "manifest.json"),
    JSON.stringify(result.manifest, null, 2)
  );
  writeFileSync(join(snapDir, "last-snapshot-hash.txt"), hash);
  const allTokens = [...result.stableTokens, ...result.experimentalTokens];
  const allComponents = [
    ...result.components.components.filter((c) => result.manifest.stableComponents.includes(c.name)),
    ...result.components.components.filter((c) => result.manifest.experimentalComponents.includes(c.name)),
  ];
  writeFileSync(join(snapDir, "current-tokens.json"), JSON.stringify(allTokens, null, 2));
  writeFileSync(join(snapDir, "current-components.json"), JSON.stringify(allComponents, null, 2));
  buildComponentSets(snapDir);

  const docsPublic = resolve(snapDir, "..", "..", "..", "apps", "docs", "public");
  try {
    mkdirSync(docsPublic, { recursive: true });
    const manifestContent = readFileSync(join(snapDir, "manifest.json"), "utf-8");
    writeFileSync(join(docsPublic, "manifest.json"), manifestContent);
    const componentSetsPath = join(snapDir, "component-sets.json");
    if (existsSync(componentSetsPath)) {
      const content = readFileSync(componentSetsPath, "utf-8");
      writeFileSync(join(docsPublic, "component-sets.json"), content);
      console.log("  component-sets.json copiato in docs");
    }
    const docComponentsPath = join(snapDir, "doc-components.json");
    if (existsSync(docComponentsPath)) {
      const docContent = readFileSync(docComponentsPath, "utf-8");
      writeFileSync(join(docsPublic, "doc-components.json"), docContent);
      console.log("  doc-components.json copiato in docs");
    }
    console.log("  Manifest copiato in apps/docs/public");
  } catch (err) {
    console.warn("  Manifest non copiato in docs (", (err as Error).message, ")");
  }

  const skipIcons = process.env.SKIP_ICON_EXPORT === "1" || process.env.SKIP_ICON_EXPORT === "true";
  if (token && !skipIcons) {
    try {
      const iconResult = await exportIconsToDocs({
        componentLibraryId,
        accessToken: token,
        snapshotsDir: snapDir,
        docsPublicDir: docsPublic,
      });
      if (iconResult.exported > 0 || iconResult.failed > 0) {
        console.log("  Icone (da Figma):", iconResult.exported, "exportate", iconResult.failed ? `, ${iconResult.failed} fallite` : "");
      }
    } catch (err) {
      console.warn("  Export icone non eseguito:", (err as Error).message);
    }
  } else if (skipIcons) {
    console.log("  Export icone saltato (SKIP_ICON_EXPORT=1)");
  }

  console.log("Figma sync OK. Scope:", SCOPE);
  console.log("  Tokens:", result.manifest.tokenCount);
  console.log("  Components:", result.manifest.componentCount);
  console.log("  Snapshot hash:", hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
