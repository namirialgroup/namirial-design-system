# Namirial Design System

Enterprise-grade Design System platform. **Figma is the single source of truth** for tokens, components, variants, and status. No manual component or token authoring.

## Branches

| Branch | Purpose |
|--------|--------|
| `main` | Stable production — npm publish, official docs, version bump |
| `experimental` | Experimental docs only — no npm publish |

## Repository structure

```
packages/
  figma-sync/     # Fetch, filter, validate Figma libraries
  tokens/         # @namirial/design-system — W3C tokens, CSS vars, TS
  components/     # @namirial/components — Stencil web components
  react-wrapper/  # @namirial/react
  angular-wrapper/# @namirial/angular
  vue-wrapper/    # @namirial/vue
apps/
  docs/           # Next.js documentation (playground, tokens, changelog)
tools/
  schema-diff/    # Figma snapshot diff → PATCH/MINOR/MAJOR
  changelog-engine/# CHANGELOG.md + docs changelog from diff
  library-validator/ # Fail CI if code ≠ Figma snapshot
```

## Configuration

1. Set Figma library IDs in `design-system.config.json` or env:
   - `FIGMA_TOKEN_LIBRARY_ID`
   - `FIGMA_COMPONENT_LIBRARY_ID`
2. **Tokens** = dalla libreria **Variables** del file (Figma Variables), non dagli stili colore. I componenti master fanno riferimento a queste variables. Richiede scope `file_variables:read` e piano che supporti Variables API.
3. **Componenti** = dalla library (GET file/components o document).
4. Experimental tokens must be namespaced `exp.*`.
5. **Figma Console MCP** (opzionale): per query interattive su Figma da Cursor (variables, componenti, export CSS/Tailwind). Vedi [docs/FIGMA-MCP.md](docs/FIGMA-MCP.md).

## Anteprima (preview) dello stato di sviluppo

Per vedere componenti, token e changelog in un’unica app:

```bash
# Dalla root del monorepo
pnpm install
pnpm exec nx run figma-sync:build
source access-token-id.env   # oppure esporta FIGMA_ACCESS_TOKEN a mano
node packages/figma-sync/dist/src/cli.js
pnpm exec nx run tokens:build
pnpm exec nx run components:build
pnpm exec nx run docs:serve
```

Poi apri **http://localhost:6010**: homepage, **Components** (playground), **Token explorer**, **Changelog**.

**Se token o componenti restano sbagliati (tutti #000000, nomi/style non coerenti con Figma):**

1. **Usa sempre l’API (niente snapshot vecchi)**  
   Con token impostato il sync chiama Figma; se vuoi ignorare `input.json` imposta `FORCE_FIGMA_API=1`:
   ```bash
   export FIGMA_ACCESS_TOKEN="il_tuo_token"
   export FORCE_FIGMA_API=1
   node packages/figma-sync/dist/src/cli.js
   ```
   In console deve comparire **"Fonte: API Figma (Variables + Components)"**. Se vedi "Fonte: snapshot" stai usando dati da file, non da Figma.

2. **Scope del token**  
   Il token deve avere lo scope **`file_variables:read`** (oltre a `file_content:read`). In Figma: Settings → Personal access tokens → il token usato deve includere `file_variables:read`. Senza questo le Variables falliscono con 403 e il sync non aggiorna i token.

3. **Token da Variables, non da stili**  
   I token vengono **solo** dalla libreria **Variables** del file (`GET /v1/files/:key/variables/local`). Nel file Figma deve esistere una **Variable collection** con le variabili (colori, numeri, ecc.); i componenti master devono referenziare quelle variables. Se nel file usi solo “Color styles” (stili colore) e non Variables, l’API Variables può essere vuota o non disponibile.

4. **Dopo un sync riuscito**  
   Rigenera token e docs così la UI usa i dati nuovi:
   ```bash
   pnpm exec nx run tokens:build
   pnpm exec nx run docs:serve
   ```

5. **Se il sync va in errore 403**  
   Il CLI stampa un messaggio con possibili cause (scope, piano, file senza Variables). Correggi e riesegui il sync; finché il sync non va a buon fine, Token explorer e Components mostrano l’ultimo snapshot scritto in precedenza (anche se vecchio).

---

## Riferimento a una sola libreria Figma

Il design system usa **solo due file Figma** (identificati per ID), non tutte le librerie del team:

1. **Token Library** → `tokenLibraryId` (stili/colori/tipografia)
2. **Component Library** → `componentLibraryId` (componenti e varianti)

Se usi **un unico file Figma** che contiene sia gli stili sia i componenti, imposta **lo stesso ID** in entrambi i campi (come nel tuo `design-system.config.json`).

**Dove trovare l’ID (file key):**

- Apri il file (o la libreria) in Figma.
- Guarda l’URL: `https://www.figma.com/design/XXXXXXXX/...`  
  **`XXXXXXXX`** è l’ID da usare (es. `onY6xoWkmPGv6Zp4b1jEzn`).

**Dove configurarlo:**

- **`design-system.config.json`** (root del repo):
  - `figma.tokenLibraryId` → ID del file che contiene i token/stili
  - `figma.componentLibraryId` → ID del file che contiene i componenti (può essere lo stesso file)
- Oppure variabili d’ambiente (utile in CI): `FIGMA_TOKEN_LIBRARY_ID`, `FIGMA_COMPONENT_LIBRARY_ID`.

Solo questi due file vengono scaricati e usati; nessun altro file o libreria del team viene incluso.

---

## Local setup

```bash
pnpm install
pnpm exec nx run figma-sync:build
# Optional: set FIGMA_ACCESS_TOKEN and run sync
DS_SCOPE=stable FIGMA_ACCESS_TOKEN=xxx node packages/figma-sync/dist/src/cli.js
# Or place snapshot at packages/figma-sync/snapshots/input.json
pnpm run build
pnpm exec nx run docs:serve
```

## CI/CD

- **Figma publish pipeline** (`.github/workflows/figma-publish.yml`): sync → validate → build → test → changelog → version bump → npm publish (main only) → deploy docs.
- **Mismatch check** (`.github/workflows/ci-mismatch-check.yml`): fails if generated output does not match stored Figma snapshot hash.
- **Promotion** (`.github/workflows/promotion-experimental-to-stable.yml`): when components move from Experimental page to Stable → MINOR bump, changelog, commit.

## Governance

- No manual component or token creation.
- No override CSS; all styling from semantic tokens.
- Snapshot hash stored in repo for traceability.
- Changelog is auto-generated from Figma diff only.

## npm packages (from main)

- `@namirial/design-system` — tokens
- `@namirial/components` — web components
- `@namirial/react` — React wrapper
- `@namirial/angular` — Angular wrapper
- `@namirial/vue` — Vue wrapper
