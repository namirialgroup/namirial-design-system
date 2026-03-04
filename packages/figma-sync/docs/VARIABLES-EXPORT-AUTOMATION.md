# Export variabili Figma → mcp-exports (solo MCP)

**Non si usa** `FIGMA_ACCESS_TOKEN` né la REST API per le variables: il sync avviene **solo tramite Figma Console MCP** e Cursor.

## Un solo comando (in chat)

In Cursor chiedi:

**"Sincronizza le variabili da Figma"**

L’agent (seguendo la regola `.cursor/rules/figma-mcp-sync.mdc`):

1. Chiama `figma_get_variables` con `format: "summary"` per ottenere `totalPages` (es. 6).
2. Per ogni pagina da 1 a totalPages chiama `figma_get_variables` con `format: "filtered"`, `page`, `pageSize: 100` e **salva l’intera risposta JSON** in `packages/figma-sync/snapshots/_mcp-page-{i}.json`.
3. Esegue **`pnpm merge:mcp-pages`**: lo script legge tutti i `_mcp-page-*.json`, unisce variables e collections, e scrive **mcp-exports** con la struttura concordata (root per single-mode, sottocartelle per multi-mode, incluso **Component color**).
4. Esegue **`pnpm merge:mcp-exports`** (genera `figma-variables-export.json`) e **`pnpm sync:figma`** per aggiornare token e manifest nella webapp.
5. Elimina i file temporanei `_mcp-page-*.json`.

Risultato: variabili Figma lette per intero (incluse tutte le 7 collection, tra cui Component color) e istanziate correttamente in `mcp-exports` e nel progetto.

## Struttura mcp-exports

- **Root**: `primitives.json`, `semantic.json`, `component-no-modes.json`
- **theme/**: `light_theme.json`, `dark_theme.json`
- **component-color/**: `index-1_component-color.json` … `index-10_component-color.json`
- **component-intent/**: `primary_component-intent.json`, … `warning_component-intent.json`
- **component-dimension/**: `sm_`, `xs_`, `md_`, `lg_`, `xl_component-dimension.json`

## Salvare le pagine MCP (page 1 e 2) quando l'agent non può scriverle

L'agent in Cursor riceve le risposte di `figma_get_variables` (format filtered, page 1 e 2). Se non può scrivere direttamente `_mcp-page-1.json` e `_mcp-page-2.json` (es. limite di dimensione del Write), puoi usare uno di questi metodi.

**Opzione A – Due file di input**  
Salva la risposta MCP della page 1 in un file (es. `page1-response.json`) e quella della page 2 in `page2-response.json` (copia-incolla dal contesto della chat o da dove le hai esportate). Poi dalla root del repo o da `packages/figma-sync`:

```bash
node packages/figma-sync/scripts/save-mcp-page.js page1-response.json page2-response.json
```

**Opzione B – Stdin con delimitatore**  
Salva il JSON della page 1 in un file, quello della page 2 in un altro. Poi:

```bash
cat page1-response.json && echo '---PAGE2---' && cat page2-response.json | node packages/figma-sync/scripts/write-mcp-pages-from-stdin.mjs
```

In entrambi i casi si generano `snapshots/_mcp-page-1.json` e `_mcp-page-2.json`. Poi esegui **`pnpm merge:mcp-pages`** (dalla root).

## Script utilizzati

| Comando | Cosa fa |
|--------|---------|
| **pnpm merge:mcp-pages** | Legge `snapshots/_mcp-page-*.json`, unisce e scrive in `mcp-exports`. Da usare dopo che l’agent ha salvato le pagine MCP. |
| **pnpm merge:mcp-exports** | Unisce i file in `mcp-exports` e genera `figma-variables-export.json`. |
| **pnpm sync:figma** | Aggiorna componenti e token nel progetto (manifest, docs). |

## Riepilogo

- **Metodo**: solo Figma Console MCP + Cursor, nessun token REST.
- **Comando unico per l’utente**: in chat, **"Sincronizza le variabili da Figma"**.
