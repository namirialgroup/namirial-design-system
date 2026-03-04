/**
 * Schema diff: compares previous Figma snapshot with current to classify changes.
 * Used by changelog-engine for semantic versioning.
 */
export type ChangeType = "PATCH" | "MINOR" | "MAJOR";

export interface TokenChange {
  name: string;
  type: "added" | "removed" | "value_change";
  oldValue?: string | number;
  newValue?: string | number;
  changeType: ChangeType;
}

export interface ComponentChange {
  name: string;
  type: "added" | "removed" | "breaking_prop" | "prop_added" | "variant_change";
  changeType: ChangeType;
  details?: string;
}

export interface SchemaDiffResult {
  tokenChanges: TokenChange[];
  componentChanges: ComponentChange[];
  recommendedBump: ChangeType;
  breakingChanges: string[];
}

export function diffTokenSchemas(
  previous: { name: string; value: string | number }[],
  current: { name: string; value: string | number }[]
): TokenChange[] {
  const prevMap = new Map(previous.map((t) => [t.name, t]));
  const currMap = new Map(current.map((t) => [t.name, t]));
  const changes: TokenChange[] = [];

  for (const [name, curr] of currMap) {
    const prev = prevMap.get(name);
    if (!prev) {
      changes.push({ name, type: "added", newValue: curr.value, changeType: "MINOR" });
    } else if (prev.value !== curr.value) {
      changes.push({
        name,
        type: "value_change",
        oldValue: prev.value,
        newValue: curr.value,
        changeType: "PATCH",
      });
    }
  }
  for (const [name, prev] of prevMap) {
    if (!currMap.has(name)) {
      changes.push({ name, type: "removed", oldValue: prev.value, changeType: "MAJOR" });
    }
  }
  return changes;
}

export function diffComponentSchemas(
  previous: { name: string; properties?: { name: string }[] }[],
  current: { name: string; properties?: { name: string }[] }[]
): ComponentChange[] {
  const prevMap = new Map(previous.map((c) => [c.name, c]));
  const currMap = new Map(current.map((c) => [c.name, c]));
  const changes: ComponentChange[] = [];

  for (const [name, curr] of currMap) {
    const prev = prevMap.get(name);
    if (!prev) {
      changes.push({ name, type: "added", changeType: "MINOR" });
    } else {
      const prevProps = new Set((prev.properties ?? []).map((p) => p.name));
      const currProps = new Set((curr.properties ?? []).map((p) => p.name));
      for (const p of prevProps) {
        if (!currProps.has(p)) {
          changes.push({
            name,
            type: "breaking_prop",
            changeType: "MAJOR",
            details: `Property removed: ${p}`,
          });
        }
      }
      for (const p of currProps) {
        if (!prevProps.has(p)) {
          changes.push({ name, type: "prop_added", changeType: "MINOR" });
        }
      }
    }
  }
  for (const [name] of prevMap) {
    if (!currMap.has(name)) {
      changes.push({ name, type: "removed", changeType: "MAJOR" });
    }
  }
  return changes;
}

export function runSchemaDiff(
  previousManifest: { tokenLibrary?: { hash: string }; componentLibrary?: { hash: string } },
  currentManifest: { tokenLibrary?: { hash: string }; componentLibrary?: { hash: string } },
  previousTokens: { name: string; value: string | number }[],
  currentTokens: { name: string; value: string | number }[],
  previousComponents: { name: string; properties?: { name: string }[] }[],
  currentComponents: { name: string; properties?: { name: string }[] }[]
): SchemaDiffResult {
  const tokenChanges = diffTokenSchemas(previousTokens, currentTokens);
  const componentChanges = diffComponentSchemas(previousComponents, currentComponents);

  const breakingChanges: string[] = [];
  let recommendedBump: ChangeType = "PATCH";

  for (const c of tokenChanges) {
    if (c.changeType === "MAJOR") {
      breakingChanges.push(`Token removed: ${c.name}`);
      recommendedBump = "MAJOR";
    } else if (c.changeType === "MINOR" && recommendedBump === "PATCH") {
      recommendedBump = "MINOR";
    }
  }
  for (const c of componentChanges) {
    if (c.changeType === "MAJOR") {
      breakingChanges.push(
        c.type === "removed" ? `Component removed: ${c.name}` : `${c.name}: ${c.details ?? c.type}`
      );
      recommendedBump = "MAJOR";
    } else if (c.changeType === "MINOR" && recommendedBump === "PATCH") {
      recommendedBump = "MINOR";
    }
  }

  return {
    tokenChanges,
    componentChanges,
    recommendedBump,
    breakingChanges,
  };
}
