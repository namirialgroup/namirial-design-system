#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.env.GITHUB_WORKSPACE ?? process.cwd();
const CHANGELOG_JSON = join(ROOT, "apps/docs/public/changelog.json");
const ROOT_PKG = join(ROOT, "package.json");
const PACKAGES = ["packages/tokens", "packages/components", "packages/react-wrapper", "packages/angular-wrapper", "packages/vue-wrapper"];

function bump(version: string, type: "major" | "minor" | "patch"): string {
  const [a, b, c] = version.split(".").map(Number);
  if (type === "major") return `${a + 1}.0.0`;
  if (type === "minor") return `${a}.${b + 1}.0`;
  return `${a}.${b}.${c + 1}`;
}

function main(): void {
  const entries = existsSync(CHANGELOG_JSON)
    ? (JSON.parse(readFileSync(CHANGELOG_JSON, "utf-8")) as { changeType: string }[])
    : [];
  const latest = entries[0];
  const bumpType = latest?.changeType === "MAJOR" ? "major" : latest?.changeType === "MINOR" ? "minor" : "patch";

  const rootPkg = JSON.parse(readFileSync(ROOT_PKG, "utf-8")) as { version: string };
  const newVersion = bump(rootPkg.version || "0.0.0", bumpType);
  rootPkg.version = newVersion;
  writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + "\n");

  for (const p of PACKAGES) {
    const path = join(ROOT, p, "package.json");
    if (!existsSync(path)) continue;
    const pkg = JSON.parse(readFileSync(path, "utf-8")) as { version?: string };
    if (pkg.version !== undefined) {
      pkg.version = newVersion;
      writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
    }
  }
  console.log("Version bumped to", newVersion, `(${bumpType})`);
}

main();
