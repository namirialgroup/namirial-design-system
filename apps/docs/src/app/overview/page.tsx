import Link from "next/link";

export default function OverviewPage() {
  return (
    <>
      <h1>Design System — Panoramica</h1>
      <p className="nds-lead">
        Namirial Design System è una <strong>libreria di web components sincronizzata con Figma</strong>.
        Il file Figma <strong>Design System 2026</strong> è l’unica source of truth per token (Variables) e componenti.
      </p>

      <section className="nds-doc-section">
        <h2>Obiettivo</h2>
        <p>
          Design e codice restano allineati senza duplicazione manuale: i master in Figma referenziano le Variables della libreria;
          il sync porta token e metadati dei componenti nel repo e genera token CSS/JSON e il manifest dei componenti.
          Le applicazioni consumano i <strong>web components</strong> (<code>nds-button</code>, <code>nds-icon</code>, ecc.) e i <strong>design token</strong> via <code>@namirial/design-system</code>.
        </p>
      </section>

      <section className="nds-doc-section">
        <h2>Source of truth: Figma</h2>
        <ul>
          <li>
            <strong>File:</strong> Design System 2026 (configurato in <code>design-system.config.json</code> come <code>tokenLibraryId</code> e <code>componentLibraryId</code>).
          </li>
          <li>
            <strong>Token (Variables):</strong> colori, numeri, stringhe e booleani definiti nel pannello Variables. Le collection includono ad esempio Primitives, Theme, Semantic, Component color/dimension switch.
          </li>
          <li>
            <strong>Componenti:</strong> componenti e varianti pubblicati nella library Figma (status &quot;Ready for Dev&quot; per lo scope stabile).
          </li>
        </ul>
      </section>

      <section className="nds-doc-section">
        <h2>Flusso di sincronizzazione</h2>
        <p>
          Quando lavori in <strong>Cursor</strong>, il canale preferito per estrarre token (e componenti) è <strong>Figma Console MCP</strong>: massime potenzialità, valori risolti (es. hex), stesso formato snapshot. Per <strong>CI e build senza Figma</strong> si usa il sync REST (<code>pnpm sync:figma</code>).
        </p>
        <ol className="nds-doc-list">
          <li>
            <strong>Sync (MCP o REST)</strong> — gli snapshot vengono scritti in <code>packages/figma-sync/snapshots/</code>:
            <ul>
              <li><strong>Via MCP</strong>: in Cursor chiedi di sincronizzare con Figma Console MCP; l’agent usa <code>figma_get_variables</code> e (opzionalmente) <code>sync:figma:mcp</code> o la trasformazione <code>mcpVariablesToFigmaTokens</code>.</li>
              <li><strong>Via REST</strong>: <code>pnpm sync:figma</code> — legge Variables e componenti con REST API (<code>FIGMA_ACCESS_TOKEN</code>).</li>
              <li>Output: <code>current-tokens.json</code>, <code>current-components.json</code> (solo REST), <code>manifest.json</code>.</li>
            </ul>
          </li>
          <li>
            <strong>Build token</strong> — il package <code>@namirial/design-system</code> (tokens) legge <code>current-tokens.json</code>, raggruppa per collection e genera:
            <ul>
              <li><code>packages/tokens/dist/tokens.json</code> — struttura annidata (collection → gruppi → token)</li>
              <li><code>packages/tokens/dist/tokens.css</code> — custom properties <code>--nds-*</code></li>
            </ul>
          </li>
          <li>
            <strong>Docs</strong> — la webapp documentazione importa <code>tokens.json</code> per la pagina Token explorer e serve <code>manifest.json</code> (copiato in <code>apps/docs/public/</code>) per la pagina Components.
          </li>
        </ol>
        <p>
          Nessuna authoring manuale di componenti o token: le modifiche partono da Figma e vengono propagate con sync e build.
        </p>
      </section>

      <section className="nds-doc-section">
        <h2>Documentazione in questa webapp</h2>
        <ul>
          <li>
            <Link href="/tokens">Token explorer</Link> — esplora le Variables (per collection e gruppo) sincronizzate da Figma; valori e struttura come in <code>tokens.json</code>.
          </li>
          <li>
            <Link href="/components">Components</Link> — elenco componenti dalla library Figma, playground Icon e Button, uso dei web components (<code>nds-icon</code>, <code>nds-button</code>, ecc.) nelle app.
          </li>
          <li>
            <Link href="/changelog">Changelog</Link> — modifiche generate dal diff tra snapshot Figma (token e componenti).
          </li>
        </ul>
      </section>
    </>
  );
}
