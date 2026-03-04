"use client";

import { useEffect, useState } from "react";

interface DocComponentEntry {
  slug: string;
  label: string;
}

export function ComponentDocGeneric({ slug }: { slug: string }) {
  const [label, setLabel] = useState<string>(slug);

  useEffect(() => {
    fetch("/doc-components.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { components?: DocComponentEntry[] } | null) => {
        if (data?.components) {
          const found = data.components.find((c) => c.slug === slug);
          if (found) setLabel(found.label);
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    import("@namirial/components/loader").then((m) => m.defineCustomElements?.());
  }, []);

  const displayName = label || slug;
  const tagName = `nds-${slug}`;

  return (
    <>
      <h1>{displayName}</h1>
      <p className="nds-lead">
        Componente <strong>Ready to Dev</strong> nella libreria Figma Design System 2026. Documentazione e web component in fase di implementazione.
      </p>

      <section className="nds-section nds-section--hero">
        <h2 className="nds-section-title">Preview</h2>
        <p className="nds-section-desc">
          Anteprima. Se il web component <code>{tagName}</code> esiste, viene renderizzato; altrimenti placeholder. Per vedere varianti e dettagli apri la libreria Design System 2026 in Figma.
        </p>
        <div className="nds-demo-preview nds-playground-preview-canvas">
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--nds-docs-text-muted)",
              fontSize: "0.875rem",
            }}
          >
            <span
              className="nds-doc-badge-ready"
            >
              Ready to Dev
            </span>
            <code>{tagName}</code>
            <span>Preview in arrivo</span>
          </div>
        </div>
      </section>

      <section className="nds-section">
        <h2 className="nds-section-title">Stato</h2>
        <p className="nds-section-desc">
          Questo componente è stato rilevato durante il sync da Figma. Per vedere le varianti e i dettagli in Figma, apri la libreria Design System 2026. La scheda doc e l’eventuale web component <code>nds-*</code> saranno disponibili nelle prossime release.
        </p>
      </section>
      <section className="nds-section">
        <h2 className="nds-section-title">Slug</h2>
        <p className="nds-section-desc">
          <code>{slug}</code>
        </p>
      </section>
    </>
  );
}
