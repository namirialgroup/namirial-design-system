/**
 * Changelog engine: stores previous snapshot hash, runs schema diff on publish,
 * classifies change (PATCH/MINOR/MAJOR), generates CHANGELOG.md and docs changelog data.
 * Auto-generated only from Figma diff. No manual editing.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  runSchemaDiff,
  type SchemaDiffResult,
  type ChangeType,
} from "@namirial/schema-diff";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const SNAPSHOTS = join(ROOT, "packages/figma-sync/snapshots");
const PREVIOUS_SNAPSHOT = join(SNAPSHOTS, "previous-manifest.json");
const CURRENT_MANIFEST = join(SNAPSHOTS, "manifest.json");
const CHANGELOG_MD = join(ROOT, "CHANGELOG.md");
const CHANGELOG_JSON = join(ROOT, "apps/docs/public/changelog.json");

export interface ChangelogEntry {
  version: string;
  date: string;
  figmaPublishDate: string;
  changeType: ChangeType;
  tokenChanges: { name: string; type: string; oldValue?: unknown; newValue?: unknown }[];
  componentChanges: { name: string; type: string; details?: string }[];
  breakingChanges: string[];
}

export function loadPreviousSnapshot(): unknown | null {
  if (!existsSync(PREVIOUS_SNAPSHOT)) return null;
  return JSON.parse(readFileSync(PREVIOUS_SNAPSHOT, "utf-8"));
}

export function generateChangelogFromDiff(
  diff: SchemaDiffResult,
  version: string,
  figmaPublishDate: string
): ChangelogEntry {
  return {
    version,
    date: new Date().toISOString().slice(0, 10),
    figmaPublishDate,
    changeType: diff.recommendedBump,
    tokenChanges: diff.tokenChanges.map((t) => ({
      name: t.name,
      type: t.type,
      oldValue: t.oldValue,
      newValue: t.newValue,
    })),
    componentChanges: diff.componentChanges.map((c) => ({
      name: c.name,
      type: c.type,
      details: c.details,
    })),
    breakingChanges: diff.breakingChanges,
  };
}

export function appendChangelogMd(entry: ChangelogEntry): void {
  const section = [
    `## ${entry.version} (${entry.date})`,
    "",
    `- **Figma publish date:** ${entry.figmaPublishDate}`,
    `- **Change type:** ${entry.changeType}`,
    "",
  ];
  if (entry.tokenChanges.length) {
    section.push("### Token changes");
    entry.tokenChanges.forEach((t) => {
      section.push(`- \`${t.name}\`: ${t.type}${t.oldValue != null ? ` ${String(t.oldValue)} → ${String(t.newValue)}` : ""}`);
    });
    section.push("");
  }
  if (entry.componentChanges.length) {
    section.push("### Component changes");
    entry.componentChanges.forEach((c) => {
      section.push(`- **${c.name}**: ${c.type}${c.details ? ` — ${c.details}` : ""}`);
    });
    section.push("");
  }
  if (entry.breakingChanges.length) {
    section.push("### Breaking changes");
    entry.breakingChanges.forEach((b) => section.push(`- ${b}`));
    section.push("");
  }
  const content = existsSync(CHANGELOG_MD)
    ? readFileSync(CHANGELOG_MD, "utf-8")
    : "# Changelog\n\nAll changes are derived from Figma publish events. No manual editing.\n\n";
  const insert = content.indexOf("\n## ");
  const newContent =
    insert === -1
      ? content + "\n" + section.join("\n")
      : content.slice(0, insert) + "\n" + section.join("\n") + content.slice(insert);
  writeFileSync(CHANGELOG_MD, newContent);
}

export function appendChangelogJson(entry: ChangelogEntry): void {
  const path = CHANGELOG_JSON;
  mkdirSync(join(path, ".."), { recursive: true });
  const entries: ChangelogEntry[] = existsSync(path)
    ? JSON.parse(readFileSync(path, "utf-8"))
    : [];
  entries.unshift(entry);
  writeFileSync(path, JSON.stringify(entries, null, 2));
}

export function runChangelogGeneration(
  previousTokens: { name: string; value: string | number }[],
  currentTokens: { name: string; value: string | number }[],
  previousComponents: { name: string; properties?: { name: string }[] }[],
  currentComponents: { name: string; properties?: { name: string }[] }[],
  currentVersion: string,
  figmaPublishDate: string
): ChangelogEntry | null {
  const prevManifest = loadPreviousSnapshot() as {
    tokenLibrary?: { hash: string };
    componentLibrary?: { hash: string };
  } | null;
  if (!prevManifest) return null;

  const currManifest = existsSync(CURRENT_MANIFEST)
    ? (JSON.parse(readFileSync(CURRENT_MANIFEST, "utf-8")) as {
        tokenLibrary?: { hash: string };
        componentLibrary?: { hash: string };
        timestamp?: string;
      })
    : {};

  const diff = runSchemaDiff(
    prevManifest,
    currManifest,
    previousTokens,
    currentTokens,
    previousComponents,
    currentComponents
  );

  const hasChanges =
    diff.tokenChanges.length > 0 || diff.componentChanges.length > 0;
  if (!hasChanges) return null;

  const entry = generateChangelogFromDiff(
    diff,
    currentVersion,
    figmaPublishDate ?? currManifest.timestamp ?? new Date().toISOString()
  );
  appendChangelogMd(entry);
  appendChangelogJson(entry);
  return entry;
}
