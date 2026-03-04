# Namirial Design System — Architecture

Figma (via Figma Console MCP or REST API) is the **only** source of truth.

## Outputs

1. **Documentation web app** (Next.js, App Router, localhost:6010)
2. **StencilJS Web Components library** (`@namirial/components`)
3. **Design tokens** (`@namirial/design-system`, tokens.css + tokens.json)
4. **Local sync workflow** (dev-sync, release)
5. **Versioned changelog system**

---

## Figma Source

**File**: Design System 2026 (`onY6xoWkmPGv6Zp4b1jEzn`)

Extract via **Figma Console MCP**:

- Variable Collections, Groups, Modes
- Variable aliases
- Component metadata, properties, variants
- Page names (for Experimental filter)
- Component status ("Ready for Dev")

**No manual** token or component creation.

---

## App Structure (Ant Design–like)

| Section      | Content |
|-------------|---------|
| **Variables**   | All Figma variables, Collection → Group → Variable, modes, search |
| **Components**  | All "Ready for Dev", NOT in Experimental page |
| **Experimental**| All "Ready for Dev" IN page "Experimental" |
| **Changelog**   | Semantic diff, version selector |

---

## Variables

- **Source**: `figma-variables-export.json` (merge of MCP exports)
- **Structure**: Collection → Group → Variable (exact Figma hierarchy)
- **Display**: Name, Collection, Mode values, Alias reference, Token type
- **UI**: Sidebar by collection, search, mode switch (light/dark)
- **Order**: Preserve Figma order (no alphabetical sort)

---

## Components

- **Filter**: Solo componenti il cui **nome non inizia con `.` o `_`** (i prefissi indicano nested da nascondere); page ≠ "Experimental" per lo scope stable.
- **Generation**: StencilJS Web Components from Figma properties/variants
- **Styling**: Use Variables only (no hardcoded styles)
- **Per-component page**: Playground, Props table, Variant matrix, Usage, Tag name, Install

---

## Experimental

- **Filter**: Status "Ready for Dev", page === "Experimental"
- **Rendering**: Same as Components (Web Components)
- **Badge**: Visible "Experimental" label
- **npm**: NOT included in main `@namirial/components` export

---

## Versioning & Changelog

- On sync: store Figma snapshot
- Compare with previous snapshot
- Semantic diff:
  - Token value change → PATCH
  - New component → MINOR
  - Breaking prop change → MAJOR
- Output: CHANGELOG.md, changelog page, version selector

---

## Flusso Figma ↔ Webapp

**Figma** è l’unica fonte di verità. La **Webapp (docs)** legge gli artefatti prodotti dal sync e mostra preview e playground direttamente in pagina.

```
  Figma (Design System 2026)
           │
           ▼
  pnpm sync:figma  ──►  snapshots/
           │                 ├── current-components.json
           │                 ├── current-tokens.json
           │                 ├── figma-variables-export.json
           │                 ├── component-sets.json
           │                 └── doc-components.json
           │
           ├──►  build tokens   ──►  tokens.css (modi Light/Dark)
           │
           ├──►  build components  ──►  nds-button, nds-icon, …
           │
           ├──►  copia in apps/docs/public/
           │         (manifest, component-sets, doc-components)
           │
           ▼
  ┌─────────────────────────────────────────────────┐
  │  Webapp (docs)                                  │
  │  - Sidenav da doc-components.json               │
  │  - Preview e playground inline in pagina        │
  │  - tokens.css (Light/Dark) + WC nds-*           │
  └─────────────────────────────────────────────────┘
```

- **Webapp (docs)**: catalogo (sidenav da `doc-components.json`), pagine per ogni componente con **preview e playground inline**. Usa `component-sets.json`, `doc-components.json`, `tokens.css` e i WC costruiti dai token.

Per evitare discrepanze:

1. **Un solo flusso**: dopo ogni cambio in Figma eseguire `pnpm sync:figma` (o `pnpm dev-sync`); la webapp riceve i file in `apps/docs/public/`.
2. **Stesso build**: token e componenti vanno buildati dopo il sync; la webapp usa `@namirial/design-system/tokens.css` e `@namirial/components`.

**La webapp non è connessa a Figma** in tempo reale: legge gli **output del sync** (JSON + token + WC). Per confrontare con Figma si può usare il link "Apri in Figma" nelle pagine componenti.

---

## Sync Workflow

| Command   | Action |
|-----------|--------|
| `pnpm merge:mcp-exports` | Merge MCP variable exports → figma-variables-export.json (run first when using Figma Console MCP) |
| `pnpm sync:figma` | Fetch Figma → tokens + components → save previous snapshot → write manifest, current-tokens, current-components |
| `pnpm dev-sync` | merge (optional) → sync → build tokens → build components → serve docs |
| `pnpm release`  | Version bump → changelog generation |

Per **sincronizzare variabili e componenti da Design System 2026** vedi `pnpm sync:figma` e `pnpm dev-sync` (token Figma, sync, build token/componenti, serve docs).

---

## File Layout

```
namirial-design-system/
├── design-system.config.json    # Figma IDs, experimental page name
├── docs/ARCHITECTURE.md         # This file
├── packages/
│   ├── figma-sync/              # Extraction, merge, sync
│   ├── tokens/                  # @namirial/design-system
│   └── components/              # @namirial/components (Stencil)
├── apps/docs/                   # Next.js documentation
└── packages/figma-sync/snapshots/
    ├── figma-variables-export.json
    ├── current-tokens.json
    ├── current-components.json
    ├── manifest.json
    └── versions/                # Snapshot history for changelog
```
