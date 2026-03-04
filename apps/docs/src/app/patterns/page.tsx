export default function PatternsPage() {
  return (
    <>
      <h1>Patterns</h1>
      <p className="nds-lead">
        Gruppi di comportamento che combinano componenti: form, filtri, flussi. Preview e playground in arrivo.
      </p>

      <section className="nds-section">
        <h2 className="nds-section-title">Forms</h2>
        <p className="nds-section-desc">
          Pattern per form (login, registrazione, wizard). Input + Button con varianti. Playground in arrivo.
        </p>
      </section>

      <section className="nds-section">
        <h2 className="nds-section-title">Filters</h2>
        <p className="nds-section-desc">
          Ricerca e filtri: campo di ricerca + azioni Filtra / Reset. Playground in arrivo.
        </p>
      </section>

      <section className="nds-section">
        <h2 className="nds-section-title">Flows</h2>
        <p className="nds-section-desc">
          Flussi multi-step (in arrivo: wizard, conferme, onboarding).
        </p>
      </section>
    </>
  );
}
