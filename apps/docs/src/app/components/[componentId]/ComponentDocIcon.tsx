"use client";

import { useEffect, useMemo, useState } from "react";
import { getLucideIconNames, IconGrid } from "../IconGrid";

export function ComponentDocIcon() {
  const [elementsReady, setElementsReady] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const allNames = useMemo(() => getLucideIconNames(), []);
  const filteredNames = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    if (!q) return allNames;
    return allNames.filter((n) => n.includes(q));
  }, [allNames, iconSearch]);

  useEffect(() => {
    import("@namirial/components/loader")
      .then((m) => {
        m.defineCustomElements?.();
        setElementsReady(true);
      })
      .catch(() => setElementsReady(true));
  }, []);

  if (!elementsReady) {
    return (
      <div className="nds-components-loading" aria-live="polite">
        <p>Caricamento componenti…</p>
      </div>
    );
  }

  return (
    <>
      <h1>Icon</h1>
      <p className="nds-lead">
        Web component <code>nds-icon</code> e set <strong>Lucide Icons</strong>. Le anteprime usano <code>lucide-react</code> (nessun sync da Figma): tutte le icone si vedono correttamente.
      </p>
      <section className="nds-section">
        <h2 className="nds-section-title">Catalogo Lucide (lucide-react)</h2>
        <p className="nds-section-desc">
          Tutte le icone disponibili nel pacchetto <code>lucide-react</code>. Nomi in kebab-case per <code>nds-icon name=&quot;...&quot;</code>. Cerca per nome.
        </p>
        <div className="nds-icon-search-wrap">
          <input
            type="search"
            className="nds-icon-search"
            placeholder="Cerca icone (es. arrow, check, user)..."
            aria-label="Cerca icone"
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
          />
          <span className="nds-icon-search-meta" aria-live="polite">
            {filteredNames.length === allNames.length
              ? `${allNames.length} icone`
              : `${filteredNames.length} di ${allNames.length}`}
          </span>
        </div>
        <IconGrid names={filteredNames} />
      </section>
      <section className="nds-section">
        <h2 className="nds-section-title">Uso</h2>
        <p className="nds-section-desc">
          <code>&lt;nds-icon name=&quot;check&quot; size={24} /&gt;</code>. Nomi in kebab-case come in Lucide.
        </p>
      </section>
    </>
  );
}
