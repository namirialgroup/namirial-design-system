# Export MCP Variables - Istruzioni

**Preferenza**: esporta da Figma **un unico JSON per collection** quando possibile (evita paginazione p1, p2). Se una collection è troppo grande, usa più file e mettili in una sotto-cartella con il nome della collection (vedi `mcp-exports/README.md`).

**Collection in Figma (Design System 2026)** da coprire: Primitives, Semantic, Theme, **Component intent**, Component dimension, Component no-modes, Component color.

**Nota su Figma Console MCP**: chiamando `figma_get_variables` con `format: "filtered"` e `collectionName`/`collectionId`, il server può restituire dati in cache (sempre pagina 1) e ignorare il filtro. Per avere export per collection: apri il file in Figma Desktop, assicurati che il plugin abbia dati aggiornati, oppure usa l’export REST (`pnpm export:variables`) con un token che ha scope `file_variables:read`. In alternativa esporta manualmente dal plugin Figma (se disponibile) e salva i JSON in `mcp-exports`.

1. **Estrai** ogni collection con `figma_get_variables` (Figma Console MCP). Per le mode usa il naming `nome-della-mode_nome-collection-madre.json` (parole in minuscolo con `-`, separatore `_` tra mode e collection), dentro una cartella con il nome della collection (lowercase):
   - **Theme**: cartella `mcp-exports/theme/` con `dark_theme.json`, `light_theme.json` (una mode per file)
   - **Semantic**: cartella `mcp-exports/semantic/` con `dark_semantic.json`, `light_semantic.json` (o un file per mode)
   - **Primitives**: cartella `mcp-exports/primitives/` — un file o, se paginato, primitives-p1.json, primitives-p2.json …
   - **Component intent**: un file in root → `mcp-exports/component-intent.json` (o cartella `component-intent/` con un file per mode: `primary_component-intent.json`, `secondary_component-intent.json`, …)
   - **Component dimension**: cartella `mcp-exports/component-dimension/` con `sm_component-dimension.json`, `xs_component-dimension.json`, ecc. (una mode per file)
   - **Component color**: cartella `mcp-exports/component-color/` con un file per mode (Index-1, Index-2, …) o un unico file se preferisci
   - **Component no-modes**: un file in root → `mcp-exports/component-no-modes.json`

2. **Salva** ogni risposta MCP nella root di `mcp-exports` o nella sotto-cartella della collection (nome cartella = nome collection).

3. **Esegui il merge**:
   ```bash
   pnpm merge:mcp-exports
   ```
   oppure
   ```bash
   node packages/figma-sync/dist/src/merge-mcp-exports.js packages/figma-sync/snapshots/mcp-exports
   ```
   Il merge legge tutti i `.json` in root e in ogni sotto-cartella (un livello).
