# Figma Sync

Sync token e componenti dalla library Figma. Output in `snapshots/` e manifest in `apps/docs/public/`.  
Le docs usano **lucide-react** per le anteprime delle icone (nessun export SVG da Figma necessario). Il design system espone anche il web component **nds-icon** (Lucide) in `@namirial/components`. Con token configurato, il sync può comunque esportare SVG in `apps/docs/public/icons/` per uso opzionale.

## Token da API vs export JSON

Se i token in docs risultano tutti `#000000`, l’API Variables può restituire una struttura diversa da quella attesa (mode, alias, formato colore).

**Opzione 1 – Export JSON (consigliata per debuggare)**  
1. Ottieni la risposta di `GET https://api.figma.com/v1/files/:file_key/variables/local` (con il tuo token e `file_key` = `tokenLibraryId` da `design-system.config.json`).  
2. Salva il JSON in `packages/figma-sync/snapshots/figma-variables-export.json`.  
3. Esegui il sync con token impostato:  
   `FIGMA_ACCESS_TOKEN=xxx pnpm sync:figma`  
   Se il file esiste, i token verranno letti da lì (stessa logica di parsing) e i componenti dall’API.  
4. Oppure usa un path custom:  
   `FIGMA_VARIABLES_JSON=/path/to/export.json FIGMA_ACCESS_TOKEN=xxx pnpm sync:figma`

Il JSON deve avere la forma della risposta Variables API:  
`{ "meta": { "variables": { ... }, "variableCollections": { ... } } }`  
(variables/collections possono essere oggetti keyed by id o array).

**Se uso l'export JSON, perdo la sync con Figma?**  
Sì: finché usi il file JSON, i valori dei token non si aggiornano da soli quando pubblichi in Figma. Per riallinearti: rigenera l'export (salva di nuovo la risposta Variables in `figma-variables-export.json`) e riesegui `pnpm sync:figma`. Oppure rimuovi il file e non impostare `FIGMA_VARIABLES_JSON`: il sync userà di nuovo solo l'API per i token (sync completo a ogni publish).

**Opzione 2 – Solo API**  
Assicurati che il token abbia scope `file_variables:read` e che il file Figma usi Variables (non solo Color styles). Poi `pnpm sync:figma` userà solo l’API.

## Piano Professional (senza file_variables:read)

Se il token non può avere lo scope `file_variables:read` (es. piano Figma Professional), usa l'export **Figma Console MCP** come file: in Cursor chiedi all'agent di estrarre le variables con `figma_get_variables` e salvare l'output; metti il JSON in `packages/figma-sync/snapshots/figma-variables-export.json` e lancia `pnpm sync:figma`. I token verranno letti dal file (formato MCP), i componenti dall'API (`file_content:read`).
