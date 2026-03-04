# Integrazione Figma Console MCP

Il progetto integra **[Figma Console MCP](https://docs.figma-console-mcp.southleft.com/)** (open source, MIT) per dialogare con Figma tramite MCP: estrazione di variables/token, componenti, stili e (con setup completo) creazione e modifica dal vivo.

## Ruolo nel workflow

| Canale | Uso | Quando |
|--------|-----|--------|
| **Figma Console MCP** | Estrazione variables/token e componenti da Design System 2026 | **Preferito** quando lavori in Cursor: massime potenzialità, valori risolti, stesso formato snapshot |
| **REST API (sync)** | `pnpm sync:figma` → `current-tokens.json` → build token → docs | CI, build senza Figma, chi non usa Cursor |

**Regola di progetto**: per estrarre token o componenti da Design System 2026 usa **sempre Figma Console MCP** quando sei in Cursor (vedi `.cursor/rules/figma-mcp-sync.mdc`). Il sync REST resta per **CI e automazione** (nessun Figma Desktop / MCP in pipeline).

L’MCP serve per:

- **Sync token**: `figma_get_variables` (con `resolveAliases: true`) → salva JSON → `pnpm sync:figma:mcp path/to/export.json` → build token. Oppure l’agent trasforma il payload con `mcpVariablesToFigmaTokens` e scrive `current-tokens.json`.
- Query interattive: “Estrai le variables in formato CSS/Tailwind/Sass”, specifiche componenti (`figma_get_component`, `figma_get_component_for_development`), screenshot, debug plugin.
- Creazione/modifica di variables e componenti in Figma (con Desktop Bridge).

Documentazione ufficiale: [docs.figma-console-mcp.southleft.com](https://docs.figma-console-mcp.southleft.com/).

---

## Setup in Cursor (questo repo)

### 1. Configurazione progetto

È già presente **`.cursor/mcp.json`** che registra il server Figma Console:

- **command**: `npx -y figma-console-mcp@latest`
- **envFile**: `access-token-id.env` (root del monorepo)

Il token Figma viene letto da `access-token-id.env` (stesso file usato per `pnpm sync:figma`). **Non committare** quel file se contiene token reali.

Se non usi `access-token-id.env`, puoi:

- Aggiungere in `.cursor/mcp.json` dentro `env`:  
  `"FIGMA_ACCESS_TOKEN": "${env:FIGMA_ACCESS_TOKEN}"`  
  e impostare `FIGMA_ACCESS_TOKEN` nel tuo ambiente (shell / Cursor), oppure  
- Creare un file `access-token-id.env` nella root con almeno:  
  `FIGMA_ACCESS_TOKEN=figd_...`

### 2. Collegare Figma Desktop (per tool che creano/modificano)

Per **solo lettura** (variables, componenti, stili, screenshot) basta il token.  
Per **creazione/modifica** (variables, componenti, execute) serve Figma Desktop connesso:

1. **Opzione consigliata – Desktop Bridge Plugin**
   - Apri **Figma Desktop** (non solo il browser).
   - **Plugins** → **Development** → **Import plugin from manifest...**
   - Percorso del manifest: esegui `npx figma-console-mcp@latest --print-path` e apri `figma-desktop-bridge/manifest.json` in quella cartella.
   - **Plugins** → **Development** → **Figma Desktop Bridge** → avvia il plugin.  
   Quando è connesso vedi l’indicatore “Connected”.

2. **Alternativa – CDP**
   - Chiudi completamente Figma.
   - Riavvio con porta di debug:
     - macOS: `open -a "Figma" --args --remote-debugging-port=9222`
     - Windows: `cmd /c "%LOCALAPPDATA%\Figma\Figma.exe" --remote-debugging-port=9222`
   - Verifica: [http://localhost:9222](http://localhost:9222) deve mostrare le pagine Figma.

### 3. Riavviare Cursor

Dopo aver creato o modificato `.cursor/mcp.json` (e, se serve, `access-token-id.env`), riavvia Cursor perché carichi il server MCP.

---

## File Figma del Design System

L’ID del file è in **`design-system.config.json`**:

- `figma.tokenLibraryId` / `figma.componentLibraryId` → stesso file Design System (es. `onY6xoWkmPGv6Zp4b1jEzn`).

URL Figma del file (per i tool che accettano `fileUrl`):

```text
https://www.figma.com/design/<FILE_KEY>/<NomeFile>
```

Esempio con il nostro config:  
`https://www.figma.com/design/onY6xoWkmPGv6Zp4b1jEzn/Design-System-2026`  
(il nome della pagina/file può variare; la chiave è quella in config.)

---

## Tool utili per questo progetto

| Tool | Scopo |
|------|--------|
| `figma_get_variables` | Variables/token del file; export in CSS, Tailwind, Sass, JSON. Parametri: `fileUrl`, `enrich: true`, `export_formats: ['css', 'tailwind', 'sass']`. |
| `figma_get_styles` | Stili colore, testo, effetti; export codice. |
| `figma_get_component` | Dati componente (metadata o reconstruction spec). |
| `figma_get_component_for_development` | Dati + immagine per implementazione UI. |
| `figma_get_design_system_summary` | Panoramica del design system (solo modalità locale). |
| `figma_navigate` | Apri un URL Figma e inizia il monitoraggio (utile prima di altri tool senza `fileUrl`). |
| `figma_get_status` | Verifica connessione (WebSocket/CDP) e stato. |

### Sync token via MCP (in Cursor)

1. Chiedi all’agent: “Sincronizza i token da Figma Design System 2026 usando Figma Console MCP.”
2. L’agent chiama `figma_get_variables` (file URL da `design-system.config.json`, `resolveAliases: true`), eventualmente più pagine se paginato.
3. L’agent salva l’output in `packages/figma-sync/snapshots/mcp-variables-export.json` (o altro path) e lancia `pnpm sync:figma:mcp path/to/file.json` (dopo aver buildato `figma-sync`), oppure usa `mcpVariablesToFigmaTokens` e scrive direttamente `current-tokens.json` e manifest.
4. Esegui il build dei token: `pnpm build` o `nx run tokens:build`.

Script disponibile: `pnpm sync:figma:mcp [file.json]` (oppure `MCP_VARIABLES_JSON=file.json pnpm sync:figma:mcp`). Richiede che `packages/figma-sync` sia già buildato.

### Altri prompt utili

- “Usa figma_get_variables con l’URL del file Design System e restituiscimi le variables in formato CSS.”
- “Dammi il summary del design system del file Figma del nostro progetto.”

---

## Troubleshooting

- **“FIGMA_ACCESS_TOKEN not configured”**  
  Controlla che `access-token-id.env` esista e contenga `FIGMA_ACCESS_TOKEN=figd_...` oppure che `FIGMA_ACCESS_TOKEN` sia impostato nell’ambiente e referenziato in `env` con `"${env:FIGMA_ACCESS_TOKEN}"`.

- **“Failed to connect to Figma Desktop”**  
  Serve per i tool che modificano Figma. Installa e avvia il Desktop Bridge Plugin oppure avvia Figma con `--remote-debugging-port=9222`.

- **Variables non disponibili**  
  L’API Variables di Figma può richiedere un piano che supporti Variables; in alternativa il tool può fare fallback su Styles. Vedi [docs Figma Console MCP](https://docs.figma-console-mcp.southleft.com/tools.md#figma_get_variables).

- **Server MCP non in elenco**  
  Riavvia Cursor dopo aver salvato `.cursor/mcp.json`. Controlla che il path `envFile` sia corretto rispetto alla root del workspace.

Guida completa: [Setup Guide](https://docs.figma-console-mcp.southleft.com/setup.md) e [Tools Reference](https://docs.figma-console-mcp.southleft.com/tools.md).
