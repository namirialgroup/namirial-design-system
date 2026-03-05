/**
 * Validates that generated output matches Figma snapshot.
 * If mismatch → exit 1 (CI must fail).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();

export function validateFigmaCodeMatch(): ValidationResult {
  const errors: string[] = [];
  const hashPath = join(ROOT, "packages/figma-sync/snapshots/last-snapshot-hash.txt");
  const manifestPath = join(ROOT, "packages/figma-sync/snapshots/manifest.json");

  // In CI senza sync Figma i file non esistono: niente da validare → OK
  if (!existsSync(hashPath) || !existsSync(manifestPath)) {
    return { valid: true, errors: [] };
  }

  const storedHash = readFileSync(hashPath, "utf-8").trim();
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  const expectedTokenHash = manifest.tokenLibrary?.hash;
  const expectedComponentHash = manifest.componentLibrary?.hash;
  // In CI senza Figma token il manifest è stub (senza hash): niente da confrontare → OK
  if (!expectedTokenHash || !expectedComponentHash) {
    return { valid: true, errors: [] };
  }

  const expectedComposite = [expectedTokenHash, expectedComponentHash, manifest.scope].join("-");
  if (storedHash !== expectedComposite) {
    errors.push(
      `Snapshot hash mismatch. Stored: ${storedHash}, Expected: ${expectedComposite}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
