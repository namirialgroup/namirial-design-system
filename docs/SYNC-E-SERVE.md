# Sync con Figma e avvio documentazione

Comandi da eseguire **in ordine** dalla root del monorepo per sincronizzare la documentazione con Figma e visualizzarla in locale.

## 1. Imposta il token Figma (obbligatorio per il sync)

**Opzione A – Usa il file con le variabili** (es. `access-token-id.env` nella root):

```bash
source access-token-id.env
```

**Opzione B – Imposta solo il token a mano** (un solo comando, poi vai al passo 2):

```bash
export FIGMA_ACCESS_TOKEN="il_tuo_token"
```

Il token deve avere gli scope necessari per leggere il file (incluso `file_variables:read` per le Variables).  
Senza questo passaggio, `pnpm sync:figma` terminerà con errore.

## 2. Sincronizza con Figma

**Esegui questo comando in una riga separata** (dopo aver fatto il passo 1):

```bash
pnpm sync:figma
```

Questo comando:

- Scarica token (Variables) e componenti dal file Figma configurato in `design-system.config.json`
- Scrive gli snapshot in `packages/figma-sync/snapshots/`
- Copia il manifest in `apps/docs/public/manifest.json`
- Esporta le icone (componenti `lucide-icons/*`) come SVG in `apps/docs/public/icons/`

## 3. Avvia la documentazione (se non è già in esecuzione)

```bash
pnpm docs:serve
```

Le docs saranno disponibili su **http://localhost:6010**.

Se la porta 6010 è già in uso, il server delle docs è probabilmente già attivo: apri direttamente http://localhost:6010.

---

## Un solo comando (dopo aver impostato il token)

Sono **due comandi distinti**: prima carichi le variabili, poi lanci sync + serve.

```bash
source access-token-id.env
pnpm sync-and-serve
```

Oppure, se hai già esportato il token nel terminale:

```bash
pnpm sync-and-serve
```

**Errore da evitare:** non scrivere tutto su una riga tipo `export FIGMA_ACCESS_TOKEN=... sync-and-serve`: la shell interpreta `sync-and-serve` come argomento di `export` e dà "export: not valid in this context". Usa sempre due righe (o `&&` tra i due comandi).

---

## Se i token colore restano #000000 (debug)

Per capire quale struttura restituisce l’API Figma per le Variables:

1. Esegui il sync con debug attivo:
   ```bash
   source access-token-id.env
   FIGMA_DEBUG_VARIABLES=1 pnpm sync:figma
   ```
2. Apri `packages/figma-sync/snapshots/figma-variables-raw.json`.
3. Cerca una variable di tipo COLOR e controlla come è fatto `valuesByMode` (chiavi e forma del valore: `{ r, g, b }` in 0–1, hex, ecc.). Con quella struttura si può adattare il parsing in `packages/figma-sync/src/fetch.ts` (funzioni `extractColor` / `figmaColorToHex`).
