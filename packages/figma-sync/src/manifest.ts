import type { FigmaSyncManifest, FigmaSyncResult } from "./types.js";

const MANIFEST_PATH = "packages/figma-sync/snapshots/manifest.json";
const SNAPSHOT_HASH_PATH = "packages/figma-sync/snapshots/last-snapshot-hash.txt";

export function getManifestPath(): string {
  return MANIFEST_PATH;
}

export function getSnapshotHashPath(): string {
  return SNAPSHOT_HASH_PATH;
}

export function writeManifest(manifest: FigmaSyncManifest, fsRoot: string): void {
  const path = `${fsRoot}/${MANIFEST_PATH}`;
  // Caller should use fs.writeFileSync(path, JSON.stringify(manifest, null, 2))
  // We export the paths for the CLI to use
}

export function getSnapshotHash(result: FigmaSyncResult): string {
  return [
    result.tokens.hash,
    result.components.hash,
    result.manifest.scope,
  ].join("-");
}
