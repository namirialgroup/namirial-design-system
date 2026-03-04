# Allineamento Figma ↔ Webapp

## Component Playground (riferimento)

Il **Component Playground** in Figma è la fonte di verità per proprietà e Variable modes. Da qui non abbiamo accesso diretto all’interfaccia Figma; la struttura sotto è documentata dalla preview del playground del Button (Design System 2026) per allineare WC e docs.

### Proprietà del Button (Properties)

| Proprietà | Tipo | Esempio | Uso nel WC / docs |
|-----------|------|---------|-------------------------|
| **Status** | dropdown | Default, Hover, Active, Disabled, Loading | Stati visivi (hover/active gestiti in CSS) |
| **Style** | dropdown | Standard, Full-radius | `radiusStyle`: standard = radius md, full = pill |
| **Icon-only** | toggle | on/off | Solo icona, senza testo (layout compatto) |
| **Text** | input | "Button label" | Contenuto dello slot default |
| **Leading icon** | toggle | on/off | Slot `leading` |
| **Trailing icon** | toggle | on/off | Slot `trailing` |
| **Icon (Leading) → Swap** | dropdown | es. watermelon, arrow-right | Nome icona per slot leading |
| **Icon (Trailing) → Swap** | dropdown | es. book-type | Nome icona per slot trailing |

### Variable modes (design tokens applicati)

| Mode | Valori esempio | Uso nel WC / token |
|------|----------------|---------------------|
| **Component dimension** | xs, sm, md, lg | Prop `size` + token `--nds-size-element-*`, `--nds-font-size-*` |
| **Component intent** | Primary, Secondary, Ghost, Accent, … | Prop `variant` + token `--nds-button-{intent}-*` |
| **Theme** | Auto (Light), Dark | `data-theme` + `tokens.css` per mode Light/Dark |
| **Typography** | Auto (Light), … | Font/tipografia da Variables |

Se in futuro un plugin o Figma Console MCP esporta questa struttura (property definitions + mode names per componente), il sync potrà leggerla e generare `component-sets.json` e il playground in modo più fedele al playground.

---

## Cosa possiamo rilevare da Figma

### Via Figma REST API (sync attuale)

- **File components** (`GET /files/:id` con `?depth=1` o simile): nome del componente, key, description.  
  **Non** include: proprietà (variant axes), binding alle Variables, stati hover/active, dimensioni.
- **Variables**: non esposte direttamente dall’API REST standard; servono export manuali (Plugin/MCP).

### Via Figma Console MCP (export manuale)

Se usi **Figma Console MCP** (o un plugin che esporta JSON):

1. **Variables (Collections, Groups, Modes)**  
   Export delle collection → file tipo `figma-variables-export.json`.  
   Il build dei token (`packages/tokens`) legge questo file e genera `tokens.css` con `:root` e `[data-theme="dark"]` (e altri mode).  
   Così **colori, radius, dimensioni** del Design System 2026 provengono da Figma.

2. **Component metadata**  
   L’API REST non restituisce le **property definitions** (variant axes, valori).  
   Per allineare esattamente le varianti (es. Status, Style, Icon-only, Component dimension, Component intent) bisogna:
   - o esportare dalla Console/plugin un JSON con le proprietà dei componenti e consumarlo in `figma-sync` / docs,
   - o documentare a mano la mappatura (come fatto per il Button: primary/secondary/ghost + accent/info/positive/negative/warning, size, radiusStyle, slot leading/trailing).

3. **Nomi delle varianti**  
   Da `current-components.json` (nomi dei componenti nel file) ricaviamo i **nomi** delle varianti (es. `Status=Default, Style=Standard, Icon-only=False`) e li usiamo in `component-sets.json` e nella docs.  
   La **semantica** (quale prop del WC corrisponde a quale axis) va mantenuta in codice (Stencil + playground).

## Se mi spieghi come è configurato il bottone in Figma

È utile per:

- **Varianti (Style / Status / Icon-only)**: confermare che primary/secondary/ghost/accent/info/positive/negative/warning e Standard/Full-radius siano quelli in libreria.
- **Variables collegate**: quali Variable modes usi per “Component dimension”, “Component intent”, “Theme” (es. Light/Dark).
- **Hover / Active**: che colore di bordo e sfondo ha il ghost in hover e active (abbiamo applicato i token secondary hover/active border; se in Figma usi token diversi, possiamo aggiungere variabili ghost-specific nell’export e nel CSS).

Non possiamo “leggere” dal Figma REST API le property definitions o i binding; quindi la descrizione che fornisci (o un export MCP/plugin con proprietà e variabili) è il riferimento per allineare WC e docs.

## Flusso consigliato

1. **Figma** = unica fonte di verità per design (varianti, colori, radius, dimensioni).
2. **Export Variables** (MCP/plugin) → `figma-variables-export.json` → build token → `tokens.css` usato dalla webapp.
3. **Sync componenti** (`pnpm sync:figma`) → `current-components.json`, `component-sets.json`, `doc-components.json` (nomi e assi varianti da nomi).
4. **WC e playground docs**: implementazione manuale delle props e delle varianti in base alla documentazione Figma (o a un eventuale export esteso delle proprietà).  
   Button: varianti e size/radiusStyle/slot sono già allineati ai token e alle varianti descritte; ghost ha bordo in hover/active.

## Icone

Le **icone** in webapp (pagina Icon) non dipendono dal sync Figma: la griglia usa l’elenco da `lucide-react/dynamicIconImports`, così tutte le icone si vedono correttamente senza pesare sul sync e senza dipendere dai nomi “lucide-icons/…” in Figma.
