"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Palette, Type, Hash, ToggleLeft, Quote } from "lucide-react";

type Mode = { name: string; modeId: string };
type Collection = { id: string; name: string; modes: Mode[] };
type ResolvedVal = { value?: string | number; aliasTo?: string };
type Variable = {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  resolvedValuesByMode?: Record<string, ResolvedVal>;
};

type Props = {
  variables: Variable[];
  variableCollections: Collection[];
};

function getGroupFromName(name: string): string {
  const i = name.indexOf("/");
  return i > 0 ? name.slice(0, i) : "—";
}

/** Path con due segmenti (es. "color/basic") per raggruppare in sezioni tipo Token Studio */
function getPathPrefix(name: string, segments = 2): string {
  const parts = name.split("/").filter(Boolean);
  return parts.slice(0, segments).join("/") || name;
}

function getAllModeNames(collection: Collection | undefined, vars: Variable[]): string[] {
  const fromCollection = collection?.modes?.map((m) => m.name) ?? [];
  const fromVars = new Set<string>();
  vars.forEach((v) => {
    Object.keys(v.resolvedValuesByMode ?? {}).forEach((k) => fromVars.add(k));
  });
  const combined = new Set([...fromCollection, ...fromVars]);
  return Array.from(combined).sort();
}

/** Raggruppa variabili per path prefix (es. color/basic) mantenendo ordine originale */
function groupByPathPrefix(vars: Variable[], segments = 2): { path: string; variables: Variable[] }[] {
  const map = new Map<string, Variable[]>();
  const order: string[] = [];
  for (const v of vars) {
    const path = getPathPrefix(v.name, segments);
    if (!map.has(path)) {
      map.set(path, []);
      order.push(path);
    }
    map.get(path)!.push(v);
  }
  return order.map((path) => ({ path, variables: map.get(path)! }));
}

export function VariablesViewer({ variables, variableCollections }: Props) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    variableCollections[0]?.id ?? null
  );
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const collection = variableCollections.find((c) => c.id === selectedCollectionId);
  const collectionVars = useMemo(() => {
    if (!selectedCollectionId) return [];
    return variables.filter((v) => v.variableCollectionId === selectedCollectionId);
  }, [variables, selectedCollectionId]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    collectionVars.forEach((v) => set.add(getGroupFromName(v.name)));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [collectionVars]);

  const filteredVars = useMemo(() => {
    let list =
      selectedGroup === "All"
        ? collectionVars
        : collectionVars.filter((v) => getGroupFromName(v.name) === selectedGroup);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((v) => v.name.toLowerCase().includes(q));
    return list;
  }, [collectionVars, selectedGroup, search]);

  const groupedSections = useMemo(() => groupByPathPrefix(filteredVars), [filteredVars]);

  const modeNames = useMemo(
    () => getAllModeNames(collection, collectionVars),
    [collection, collectionVars]
  );

  const copyValue = useCallback((text: string, id: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  function renderCell(v: Variable, modeName: string) {
    const resolved = v.resolvedValuesByMode?.[modeName];
    const cellId = `${v.id}-${modeName}`;
    if (resolved == null) {
      return <span className="nds-var-cell-empty">—</span>;
    }
    const { value, aliasTo } = resolved;
    const isColor = v.resolvedType === "COLOR";
    const displayText = typeof value === "string" ? value : value != null ? String(value) : aliasTo ?? "—";

    if (isColor && typeof value === "string" && value.startsWith("#")) {
      return (
        <button
          type="button"
          className="nds-var-cell nds-var-cell--color nds-var-cell--clickable"
          onClick={() => copyValue(value, cellId)}
          title="Clicca per copiare"
        >
          <span className="nds-var-swatch" style={{ backgroundColor: value }} aria-hidden />
          <span className="nds-var-cell-value">{value}</span>
          {aliasTo && <span className="nds-var-alias">→ {aliasTo}</span>}
          {copiedId === cellId && <span className="nds-var-copied">Copiato</span>}
        </button>
      );
    }
    if (aliasTo && (value == null || value === "")) {
      return (
        <button
          type="button"
          className="nds-var-cell nds-var-cell--alias nds-var-cell--clickable"
          onClick={() => copyValue(aliasTo, cellId)}
          title="Clicca per copiare alias"
        >
          <span className="nds-var-alias">→ {aliasTo}</span>
          {copiedId === cellId && <span className="nds-var-copied">Copiato</span>}
        </button>
      );
    }
    return (
      <button
        type="button"
        className="nds-var-cell nds-var-cell--clickable"
        onClick={() => copyValue(displayText, cellId)}
        title="Clicca per copiare"
      >
        {value != null ? String(value) : "—"}
        {aliasTo && <span className="nds-var-alias"> → {aliasTo}</span>}
        {copiedId === cellId && <span className="nds-var-copied">Copiato</span>}
      </button>
    );
  }

  function renderTypeBadge(v: Variable) {
    const type = (v.resolvedType ?? "").toLowerCase();
    const title = v.resolvedType || "—";
    const iconProps = { size: 14, "aria-hidden": true };
    if (type === "color") {
      return (
        <span className="nds-var-type-badge nds-var-type-badge--color" title={title}>
          <Palette {...iconProps} />
        </span>
      );
    }
    if (type === "string") {
      return (
        <span className="nds-var-type-badge nds-var-type-badge--string" title={title}>
          <Type {...iconProps} />
        </span>
      );
    }
    if (type === "float" || type === "integer") {
      return (
        <span className={`nds-var-type-badge nds-var-type-badge--${type}`} title={title}>
          <Hash {...iconProps} />
        </span>
      );
    }
    if (type === "boolean") {
      return (
        <span className="nds-var-type-badge nds-var-type-badge--boolean" title={title}>
          <ToggleLeft {...iconProps} />
        </span>
      );
    }
    return (
      <span className={`nds-var-type-badge nds-var-type-badge--${type || "unknown"}`} title={title}>
        <Quote {...iconProps} />
      </span>
    );
  }

  return (
    <div className="nds-var-root">
      <aside className="nds-var-sidebar">
        <div className="nds-var-sidebar-section">
          <h3 className="nds-var-sidebar-heading">Collections</h3>
          <nav className="nds-var-nav" aria-label="Collections">
            {variableCollections.map((c) => {
              const count = variables.filter((v) => v.variableCollectionId === c.id).length;
              const isSelected = c.id === selectedCollectionId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`nds-var-nav-item ${isSelected ? "nds-var-nav-item--active" : ""}`}
                  onClick={() => {
                    setSelectedCollectionId(c.id);
                    setSelectedGroup("All");
                  }}
                >
                  <span className="nds-var-nav-label">{c.name}</span>
                  <span className="nds-var-nav-count">{count}</span>
                </button>
              );
            })}
          </nav>
        </div>
        {collection && (
          <div className="nds-var-sidebar-section">
            <h3 className="nds-var-sidebar-heading">Groups</h3>
            <nav className="nds-var-nav" aria-label="Groups">
              {groups.map((g) => {
                const count =
                  g === "All"
                    ? collectionVars.length
                    : collectionVars.filter((v) => getGroupFromName(v.name) === g).length;
                const isSelected = g === selectedGroup;
                return (
                  <button
                    key={g}
                    type="button"
                    className={`nds-var-nav-item nds-var-nav-item--group ${isSelected ? "nds-var-nav-item--active" : ""}`}
                    onClick={() => setSelectedGroup(g)}
                  >
                    <span className="nds-var-nav-label">{g}</span>
                    <span className="nds-var-nav-count">{count}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </aside>

      <div className="nds-var-main">
        <header className="nds-var-header">
          <nav className="nds-var-breadcrumb" aria-label="Percorso">
            <span className="nds-var-breadcrumb-item">{collection?.name ?? "—"}</span>
            {selectedGroup !== "All" && (
              <>
                <span className="nds-var-breadcrumb-sep" aria-hidden>›</span>
                <span className="nds-var-breadcrumb-item nds-var-breadcrumb-item--current">{selectedGroup}</span>
              </>
            )}
          </nav>
          <div className="nds-var-search-wrap">
            <input
              type="search"
              className="nds-var-search"
              placeholder="Cerca variabile..."
              aria-label="Cerca variabile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search.trim() && (
              <span className="nds-var-search-hint">{filteredVars.length} risultati</span>
            )}
          </div>
        </header>

        <div id="nds-var-panel" className="nds-var-panel" role="region" aria-label="Variabili">
          <div className="nds-var-table-scroll">
            <table className="nds-var-table">
              <thead>
                <tr>
                  <th className="nds-var-th nds-var-th-name">Token</th>
                  <th className="nds-var-th nds-var-th-type" scope="col">Tipo</th>
                  {modeNames.map((modeName) => (
                    <th key={modeName} className="nds-var-th">
                      {modeName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedSections.map(({ path, variables: sectionVars }) => (
                  <React.Fragment key={path}>
                    <tr className="nds-var-section-row">
                      <td colSpan={2 + modeNames.length} className="nds-var-section-cell">
                        <span className="nds-var-section-label">{path}</span>
                        <span className="nds-var-section-count">{sectionVars.length} variabili</span>
                      </td>
                    </tr>
                    {sectionVars.map((v) => {
                      const displayName =
                        selectedGroup !== "All" && v.name.startsWith(selectedGroup + "/")
                          ? v.name.slice(selectedGroup.length + 1)
                          : v.name;
                      return (
                      <tr key={v.id} className="nds-var-tr">
                        <td className="nds-var-td nds-var-td-name">
                          <code className="nds-var-name" title={v.name}>{displayName}</code>
                        </td>
                        <td className="nds-var-td nds-var-td-type">{renderTypeBadge(v)}</td>
                        {modeNames.map((modeName) => (
                          <td key={modeName} className="nds-var-td">
                            {renderCell(v, modeName)}
                          </td>
                        ))}
                      </tr>
                    );})}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVars.length === 0 && (
            <div className="nds-var-empty">
              <p className="nds-var-empty-title">
                {search.trim() ? "Nessun risultato" : "Nessuna variabile"}
              </p>
              <p className="nds-var-empty-desc">
                {search.trim()
                  ? "Prova un altro termine o svuota la ricerca."
                  : "Seleziona un gruppo nella sidebar o una collection."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
