import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const base = process.cwd().endsWith("docs") ? process.cwd() : join(process.cwd(), "apps", "docs");
const CHANGELOG_JSON = join(base, "public", "changelog.json");

function getChangelog() {
  if (!existsSync(CHANGELOG_JSON)) return [];
  return JSON.parse(readFileSync(CHANGELOG_JSON, "utf-8")) as ChangelogEntry[];
}

interface ChangelogEntry {
  version: string;
  date: string;
  figmaPublishDate: string;
  changeType: string;
  tokenChanges: { name: string; type: string }[];
  componentChanges: { name: string; type: string; details?: string }[];
  breakingChanges: string[];
}

export default function ChangelogPage() {
  const entries = getChangelog();

  return (
    <>
      <h1>Changelog</h1>
      <p>Generato automaticamente dal diff Figma. Nessuna modifica manuale.</p>
      {entries.length === 0 ? (
        <p>Nessuna voce ancora.</p>
      ) : (
        <ul className="nds-changelog-list">
          {entries.map((e) => (
            <li key={e.version} className="nds-card">
              <strong>{e.version}</strong> ({e.date}) — {e.changeType}
              <br />
              <small>Figma publish: {e.figmaPublishDate}</small>
              {e.tokenChanges?.length > 0 && (
                <ul style={{ marginTop: "0.5rem" }}>
                  {e.tokenChanges.map((t) => (
                    <li key={t.name}>
                      Token: {t.name} ({t.type})
                    </li>
                  ))}
                </ul>
              )}
              {e.componentChanges?.length > 0 && (
                <ul style={{ marginTop: "0.5rem" }}>
                  {e.componentChanges.map((c) => (
                    <li key={c.name}>
                      Component: {c.name} ({c.type})
                      {c.details && ` — ${c.details}`}
                    </li>
                  ))}
                </ul>
              )}
              {e.breakingChanges?.length > 0 && (
                <div className="nds-breaking">
                  Breaking: {e.breakingChanges.join("; ")}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
