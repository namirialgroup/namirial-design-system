"use client";

import { useCallback, useEffect, useState } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

const LUCIDE_PREFIX = "lucide-icons/";

export function slugFromFigmaIconName(name: string): string {
  if (name.startsWith(LUCIDE_PREFIX)) {
    return name.slice(LUCIDE_PREFIX.length).trim();
  }
  return name;
}

/** Chiavi reali di lucide-react/dynamicIconImports (kebab-case). Usare questa lista per la griglia così tutte le icone si renderizzano. */
export function getLucideIconNames(): string[] {
  const keys = Object.keys(dynamicIconImports as Record<string, unknown>);
  return keys.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function LazyLucideIcon({
  name,
  size = 24,
  strokeWidth = 1.5,
  className,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const [Icon, setIcon] = useState<React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> | null>(null);
  useEffect(() => {
    const loader = (dynamicIconImports as Record<string, () => Promise<{ default: React.ComponentType<unknown> }>>)[name];
    if (!loader) {
      setIcon(null);
      return;
    }
    loader()
      .then((m) => setIcon(() => m.default))
      .catch(() => setIcon(null));
  }, [name]);

  if (!Icon) {
    return (
      <span className="nds-icon-placeholder" aria-hidden>
        —
      </span>
    );
  }
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}

/** Nome per dynamic import: se arriva "lucide-icons/foo-bar" → "foo-bar", altrimenti già chiave Lucide. */
function toDynamicImportKey(name: string): string {
  if (name.startsWith(LUCIDE_PREFIX)) return slugFromFigmaIconName(name).replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").toLowerCase();
  return name;
}

/** Estrae l'SVG dalla cella e lo copia negli appunti (formato come su lucide.dev). */
function copySvgFromCell(cellEl: HTMLElement): boolean {
  const svg = cellEl.querySelector(".nds-icon-cell-preview svg");
  if (!svg) return false;
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("width", "24");
  clone.setAttribute("height", "24");
  clone.setAttribute("stroke-width", "1.5");
  if (!clone.getAttribute("stroke")) clone.setAttribute("stroke", "currentColor");
  if (!clone.getAttribute("fill")) clone.setAttribute("fill", "none");
  const html = clone.outerHTML;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(html);
    return true;
  }
  return false;
}

export function IconGrid({ names }: { names: string[] }) {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleCellClick = useCallback((e: React.MouseEvent<HTMLDivElement>, name: string) => {
    const ok = copySvgFromCell(e.currentTarget);
    if (ok) {
      setCopiedName(name);
      setTimeout(() => setCopiedName(null), 2000);
    }
  }, []);

  return (
    <div className="nds-icon-grid">
      {names.map((name) => {
        const importKey = toDynamicImportKey(name);
        const displayName = name.startsWith(LUCIDE_PREFIX) ? slugFromFigmaIconName(name) : name;
        const isCopied = copiedName === name;
        return (
          <div
            key={name}
            className={`nds-icon-cell ${isCopied ? "nds-icon-cell--copied" : ""}`}
            role="button"
            tabIndex={0}
            onClick={(e) => handleCellClick(e, name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCellClick(e as unknown as React.MouseEvent<HTMLDivElement>, name);
              }
            }}
            title="Clicca per copiare l'SVG (come su lucide.dev)"
            aria-label={`Icona ${displayName}. Clicca per copiare SVG.`}
          >
            <div className="nds-icon-cell-preview">
              <LazyLucideIcon
                name={importKey}
                size={24}
                strokeWidth={1.5}
                className="nds-icon-img"
              />
            </div>
            <span className="nds-icon-cell-name">
              {isCopied ? "Copiato!" : displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}

