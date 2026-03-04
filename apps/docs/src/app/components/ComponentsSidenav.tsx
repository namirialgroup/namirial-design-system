"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const FALLBACK_COMPONENTS = [
  { slug: "button", label: "Button" },
  { slug: "icon", label: "Icon" },
];

interface DocComponentEntry {
  slug: string;
  label: string;
}

export function ComponentsSidenav() {
  const pathname = usePathname();
  const currentSlug = pathname?.replace(/^\/components\/?/, "").split("/")[0] || "";
  const [list, setList] = useState<DocComponentEntry[]>(FALLBACK_COMPONENTS);

  useEffect(() => {
    fetch("/doc-components.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { components?: DocComponentEntry[] } | null) => {
        if (data?.components?.length) {
          setList(data.components);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="nds-components-sidenav" aria-label="Navigazione componenti">
      <div className="nds-components-sidenav-inner">
        <p className="nds-components-sidenav-title">Componenti</p>
        <nav className="nds-components-sidenav-nav">
          <div className="nds-components-sidenav-group">
            <span className="nds-components-sidenav-group-title">Design System 2026</span>
            <ul className="nds-components-sidenav-list">
              {list.map(({ slug, label }) => {
                const href = `/components/${slug}`;
                const isActive = currentSlug === slug;
                return (
                  <li key={slug}>
                    <Link
                      href={href}
                      className={`nds-components-sidenav-link ${isActive ? "nds-components-sidenav-link--active" : ""}`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
}
