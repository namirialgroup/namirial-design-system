#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runChangelogGeneration } from "./index.js";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAPSHOTS = join(ROOT, "packages/figma-sync/snapshots");
const PREVIOUS = join(SNAPSHOTS, "previous-manifest.json");
const CURRENT = join(SNAPSHOTS, "manifest.json");
const CURRENT_TOKENS = join(SNAPSHOTS, "current-tokens.json");
const CURRENT_COMPONENTS = join(SNAPSHOTS, "current-components.json");
const PREVIOUS_TOKENS = join(SNAPSHOTS, "previous-tokens.json");
const PREVIOUS_COMPONENTS = join(SNAPSHOTS, "previous-components.json");

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function main(): void {
  if (!existsSync(PREVIOUS) || !existsSync(CURRENT)) {
    console.log("No previous snapshot or current manifest; skipping changelog.");
    process.exit(0);
  }
  const pkg = JSON.parse(
    readFileSync(join(ROOT, "package.json"), "utf-8")
  ) as { version?: string };
  const version = pkg.version ?? "0.0.0";
  const currentManifest = loadJson<{ timestamp?: string }>(CURRENT);
  const figmaPublishDate = currentManifest.timestamp ?? new Date().toISOString();

  const previousTokens = existsSync(PREVIOUS_TOKENS)
    ? loadJson<{ name: string; value: string | number }[]>(PREVIOUS_TOKENS)
    : [];
  const currentTokens = existsSync(CURRENT_TOKENS)
    ? loadJson<{ name: string; value: string | number }[]>(CURRENT_TOKENS)
    : [];
  const previousComponents = existsSync(PREVIOUS_COMPONENTS)
    ? loadJson<{ name: string; properties?: { name: string }[] }[]>(PREVIOUS_COMPONENTS)
    : [];
  const currentComponents = existsSync(CURRENT_COMPONENTS)
    ? loadJson<{ name: string; properties?: { name: string }[] }[]>(CURRENT_COMPONENTS)
    : [];

  const entry = runChangelogGeneration(
    previousTokens,
    currentTokens,
    previousComponents,
    currentComponents,
    version,
    figmaPublishDate
  );
  if (entry) {
    console.log("Changelog updated for", entry.version, entry.changeType);
  }
}

main();
