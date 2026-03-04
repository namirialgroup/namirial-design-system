# Export MCP (Variables)

Contiene i JSON esportati da Figma (tramite Figma Console MCP, nessun token). Il merge legge la root e **un livello di sotto-cartelle** e genera `../figma-variables-export.json`.

**Sync in un solo comando (solo MCP)**: in Cursor chiedi **"Sincronizza le variabili da Figma"**. L'agent usa MCP, salva le pagine in `_mcp-page-*.json`, lancia `pnpm merge:mcp-pages` poi `pnpm merge:mcp-exports` e `pnpm sync:figma`. Vedi `.cursor/rules/figma-mcp-sync.mdc` e `docs/VARIABLES-EXPORT-AUTOMATION.md`.

- **Riorganizzazione da merge esistente**: da root, `pnpm reorganize:mcp-exports` legge `../figma-variables-export.json` e riscrive questa cartella con la struttura e naming concordati (senza chiamare l'API).
- **Export automatico (REST API)**: da root del repo, `FIGMA_ACCESS_TOKEN=xxx pnpm export:variables` scarica le variabili con l’API e scrive qui la stessa struttura (collection in root, mode in sottocartelle con naming `nome-mode_nome-collection.json`). Su file molto grandi l’API può rispondere 400; in quel caso usare l’export MCP da Cursor.
- **Export manuale (MCP)**: in Cursor chiedi di usare `figma_get_variables` per ogni collection/mode e salvare i file in questa cartella. Vedi `packages/figma-sync/docs/VARIABLES-EXPORT-AUTOMATION.md`.

## Struttura consigliata

- **Root** `mcp-exports/`: un JSON per collection quando è un solo file (es. `component-dimension.json`, `component-color.json`). Ideale: esportare da Figma **un unico JSON per collection** quando possibile (niente paginazione p1, p2).
- **Sotto-cartelle** (nome = collection, lowercase): quando una collection ha più mode o è paginata, una cartella con il nome della collection (es. `theme`, `semantic`, `primitives`) e dentro un JSON per mode o per pagina.
- **Naming dei file per mode**: `nome-della-mode_nome-collection-madre.json` — mode e collection in minuscolo, parole separate da `-`, separatore `_` tra mode e collection. Es. collection "Theme" con mode "Dark" e "Light": `theme/dark_theme.json`, `theme/light_theme.json`. Mode con più parole (es. "Primary Accent"): `primary-accent_component-color.json`.

Esempio layout (allineato a Figma):

```
mcp-exports/
├── README.md
├── primitives.json
├── semantic.json
├── component-no-modes.json
├── theme/
│   ├── dark_theme.json
│   └── light_theme.json
├── component-intent/              ← "Component intent" in Figma (7 mode: Primary, Secondary, Accent, Info, Positive, Negative, Warning)
│   ├── primary_component-intent.json
│   ├── secondary_component-intent.json
│   ├── accent_component-intent.json
│   ├── info_component-intent.json
│   ├── positive_component-intent.json
│   ├── negative_component-intent.json
│   └── warning_component-intent.json
├── component-color/               ← "Component color" in Figma (10 mode: Index-1 … Index-10), incluso con sync MCP
│   ├── index-1_component-color.json
│   └── … index-10_component-color.json
└── component-dimension/
    ├── sm_component-dimension.json
    ├── xs_component-dimension.json
    ├── md_component-dimension.json
    ├── lg_component-dimension.json
    └── xl_component-dimension.json
```

- **Merge**: `pnpm merge:mcp-exports` legge tutti i `.json` in root e in ogni sotto-cartella (esclusi `_*` e `*.raw*`) e unisce variables e collections in `../figma-variables-export.json`.
- **Component intent vs Component color**: in Figma sono due collection diverse. "Component intent" (id 78:13) ha 7 mode (Primary, Secondary, Accent, Info, Positive, Negative, Warning). "Component color" (id 1814:42211) ha 10 mode (Index-1 … Index-10). Non confondere i nomi: i file in `component-color/` devono contenere variabili della collection "Component color", non "Component intent". Per avere "Component color" nel repo usa l’**export dedicato**: **`pnpm export:component-color`** (richiede `FIGMA_ACCESS_TOKEN` con scope `file_variables:read`). In alternativa: `pnpm export:variables` (export completo) oppure export via Figma Console MCP (il filtro per collection può restituire cache, quindi l’export dedicato REST è più affidabile).
- **Cosa mettere**: solo file JSON nel formato MCP (con `data.variables` e opzionalmente `data.variableCollections`). Non versionare file temporanei (prefisso `_` o suffisso `.raw`).

## Formato JSON richiesto dal merge

**Puoi sostituire** cartelle e file in `mcp-exports` come vuoi (nomi e struttura).  
**Attenzione al contenuto**: se i JSON che metti qui hanno un formato diverso, il merge non li riconosce e rischi di “rompere” il pipeline (es. `figma-variables-export.json` vuoto o incompleto).

Il merge si aspetta uno di questi schemi:

1. **Con intestazione (consigliato)**  
   `fileKey`, `source`, `format`, `timestamp` sono **opzionali**; servono solo per tracciabilità. Obbligatorio è avere `data` con:
   - `data.variables`: array di oggetti variabile (vedi sotto)
   - `data.variableCollections`: array di oggetti collection (opzionale ma utile)

2. **Senza intestazione**  
   Anche un JSON che alla root ha direttamente `variables` e/o `variableCollections` va bene (il merge fa `payload.data ?? payload`).

Ogni **variabile** deve avere almeno: `id`, `name`, `variableCollectionId`, e `resolvedValuesByMode` (o `valuesByMode`). Esempio minimo:

```json
{
  "data": {
    "variables": [
      {
        "id": "VariableID:157:7535",
        "name": "theme/background",
        "resolvedType": "COLOR",
        "variableCollectionId": "VariableCollectionId:76:107",
        "resolvedValuesByMode": {
          "Dark": { "value": "#222828" },
          "Light": { "value": "#F0F3F8" }
        }
      }
    ],
    "variableCollections": [
      {
        "id": "VariableCollectionId:76:107",
        "name": "Theme",
        "modes": [{ "name": "Light", "modeId": "76:1" }, { "name": "Dark", "modeId": "78:0" }]
      }
    ]
  }
}
```

**Formato “Design Tokens” da Figma** (es. `{ "theme": { "background": { "$type": "color", ... } } }`): è un altro formato. Il merge **non** lo riconosce (cerca `variables` / `variableCollections`), quindi non usare direttamente quell’export come file in `mcp-exports` senza convertirlo. Per usare quell’export serve uno script di conversione da quel formato al formato sopra (o esportare da Figma/plugin in formato “Variables”/MCP con l’array `variables`).
