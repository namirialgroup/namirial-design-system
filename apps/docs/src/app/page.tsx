import Link from "next/link";

const isExperimental = process.env.DS_SCOPE === "experimental";

export default function Home() {
  return (
    <>
      <h1>Design and publish in one place</h1>
      <p className="nds-lead">
        Namirial Design System — Figma come unica source of truth. Variables e componenti sincronizzati e documentati qui.
      </p>
      {isExperimental && (
        <div role="alert" className="nds-alert nds-alert--warning">
          <strong>Experimental</strong> — Not Production Ready. Solo componenti e token sperimentali.
        </div>
      )}
      <section className="nds-home-grid">
        <Link href="/overview" className="nds-home-card">
          <span className="nds-home-card-title">Overview</span>
          <span className="nds-home-card-desc">Design System e flusso di sincronizzazione con Figma</span>
        </Link>
        <Link href="/variables" className="nds-home-card">
          <span className="nds-home-card-title">Variables</span>
          <span className="nds-home-card-desc">Esplora collections, gruppi e modes con ricerca</span>
        </Link>
        <Link href="/components" className="nds-home-card">
          <span className="nds-home-card-title">Components</span>
          <span className="nds-home-card-desc">Web components Ready to Dev (esclusa Experimental)</span>
        </Link>
        <Link href="/patterns" className="nds-home-card">
          <span className="nds-home-card-title">Patterns</span>
          <span className="nds-home-card-desc">Form, filtri, flussi — gruppi di comportamento</span>
        </Link>
        <Link href="/experimental" className="nds-home-card">
          <span className="nds-home-card-title">Experimental</span>
          <span className="nds-home-card-desc">Anteprima componenti in pagina Experimental</span>
        </Link>
        <Link href="/changelog" className="nds-home-card">
          <span className="nds-home-card-title">Changelog</span>
          <span className="nds-home-card-desc">Modifiche generate dal diff Figma</span>
        </Link>
      </section>
      <p>
        Nessuna authoring manuale di componenti o token. I master in Figma referenziano le Variables della libreria.
      </p>
    </>
  );
}
