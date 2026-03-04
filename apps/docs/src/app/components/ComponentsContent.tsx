"use client";

import { useEffect, useState } from "react";
import { IconGrid } from "./IconGrid";
import { ButtonPlayground } from "@/components/ComponentPlayground";

interface DesignSystemManifest {
  stableComponents?: string[];
  experimentalComponents?: string[];
  componentCount?: number;
}

const LUCIDE_PREFIX = "lucide-icons/";

function isLucideIconName(name: string): boolean {
  return name.startsWith(LUCIDE_PREFIX);
}

type Scope = "stable" | "experimental";

export default function ComponentsContent({ scope = "stable" }: { scope?: Scope }) {
  const [manifest, setManifest] = useState<DesignSystemManifest | null>(null);
  const [manifestError, setManifestError] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);

  useEffect(() => {
    import("@namirial/components/loader")
      .then((m) => {
        m.defineCustomElements?.();
        setElementsReady(true);
      })
      .catch(() => setElementsReady(true));
  }, []);

  useEffect(() => {
    fetch("/manifest.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then((data: DesignSystemManifest) => setManifest(data))
      .catch(() => setManifestError(true));
  }, []);

  const stable = manifest?.stableComponents ?? [];
  const experimental = manifest?.experimentalComponents ?? [];
  const allNames = scope === "experimental" ? experimental : stable;
  const iconNames = allNames.filter(isLucideIconName);
  const otherComponents = allNames.filter((n) => !isLucideIconName(n));
  const [iconSearch, setIconSearch] = useState("");
  const slugFromIconName = (n: string) =>
    n.startsWith(LUCIDE_PREFIX) ? n.slice(LUCIDE_PREFIX.length).trim().toLowerCase() : "";
  const filteredIconNames = iconSearch.trim()
    ? iconNames.filter((n) => slugFromIconName(n).includes(iconSearch.trim().toLowerCase()))
    : iconNames;

  if (!elementsReady) {
    return (
      <div className="nds-components-loading" aria-live="polite">
        <p>Caricamento componenti…</p>
      </div>
    );
  }

  return (
    <>
      <section className="nds-section nds-section--hero">
        <h2 className="nds-section-title">Button</h2>
        <p className="nds-section-desc">
          Web component <code>nds-button</code>. Configurazione Figma: Style (Standard, Full-radius, Ghost), Intent, Size.
        </p>
        <ButtonPlayground />
      </section>

      <section className="nds-section">
        <h2 className="nds-section-title">Icon</h2>
        <p className="nds-section-desc">
          Web component <code>nds-icon</code> (Lucide). Catalogo da <code>lucide-react</code>, anteprime nella pagina Icon.
        </p>
        {manifestError && (
          <p className="nds-alert">
            Manifest non disponibile. Le icone sotto usano <code>lucide-react</code> per l’anteprima; in app usa <code>nds-icon</code>.
          </p>
        )}
        {iconNames.length > 0 ? (
          <>
            <div className="nds-icon-search-wrap">
              <input
                type="search"
                className="nds-icon-search"
                placeholder="Cerca icone (es. arrow, check)..."
                aria-label="Cerca icone"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
              />
              <span className="nds-icon-search-meta" aria-live="polite">
                {filteredIconNames.length === iconNames.length
                  ? `${iconNames.length} icone`
                  : `${filteredIconNames.length} di ${iconNames.length}`}
              </span>
            </div>
            <IconGrid names={filteredIconNames} />
          </>
        ) : (
          <p className="nds-muted">
            Elenco icone da manifest (sync Figma). Vedi la pagina Icon per il catalogo Lucide e le anteprime.
          </p>
        )}
      </section>

      {otherComponents.length > 0 && (
        <section className="nds-section">
          <h2 className="nds-section-title">Altri componenti</h2>
          <p className="nds-section-desc">Dalla library Figma (esclusa Icon).</p>
          <ul className="nds-components-list">
            {otherComponents.map((name) => (
              <li key={name}>
                <code>{name}</code>
                {name.toLowerCase() === "button" && " — demo sopra"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="nds-section">
        <h2 className="nds-section-title">Uso nei progetti</h2>
        <p className="nds-section-desc">
          Importa <code>@namirial/components/loader</code>, chiama <code>defineCustomElements()</code> una volta, poi usa <code>&lt;nds-button&gt;</code>, <code>&lt;nds-icon&gt;</code>, ecc.
        </p>
      </section>
    </>
  );
}
