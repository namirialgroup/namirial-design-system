"use client";

import { useEffect, useState } from "react";
import { ButtonPlayground } from "@/components/ComponentPlayground";

interface ComponentSets {
  button?: {
    displayName: string;
    variants: { figmaName: string; ndsVariant?: string }[];
  };
}

export function ComponentDocButton() {
  const [figmaVariants, setFigmaVariants] = useState<string[]>([]);

  useEffect(() => {
    fetch("/component-sets.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ComponentSets | null) => {
        if (data?.button?.variants?.length) {
          setFigmaVariants(data.button.variants.map((v) => v.figmaName));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <h1>Button</h1>
      <p className="nds-lead">
        Web component <code>nds-button</code>. Allineato a Figma Design System 2026: varianti (intent) primary, secondary, ghost, accent, info, positive, negative, warning; size xs/sm/md/lg; radius standard/full; slot leading/trailing per icone.
      </p>
      <section className="nds-section nds-section--hero">
        <h2 className="nds-section-title">Preview e playground</h2>
        <p className="nds-section-desc">
          Anteprima diretta del web component con controlli per variante, size e radius (allineati a Figma). Il tema Light/Dark della webapp si applica automaticamente.
        </p>
        <ButtonPlayground />
      </section>
      {figmaVariants.length > 0 && (
        <section className="nds-section">
          <h2 className="nds-section-title">Varianti in Figma</h2>
          <p className="nds-section-desc">
            Nomi reali delle varianti nel file Design System 2026 (sync da <code>pnpm sync:figma</code>).
          </p>
          <ul className="nds-doc-list" style={{ maxHeight: "12rem", overflowY: "auto" }}>
            {figmaVariants.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="nds-section">
        <h2 className="nds-section-title">Uso</h2>
        <p className="nds-section-desc">
          Importa <code>@namirial/components/loader</code>, chiama <code>defineCustomElements()</code>, poi usa il tag <code>&lt;nds-button variant=&quot;primary&quot;&gt;</code>.
        </p>
      </section>
    </>
  );
}
