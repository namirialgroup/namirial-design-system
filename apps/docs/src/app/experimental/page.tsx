import ComponentsContent from "../components/ComponentsContent";

export default function ExperimentalPage() {
  return (
    <>
      <div className="nds-experimental-badge" role="status">
        Experimental — Not in main npm package
      </div>
      <h1>Experimental</h1>
      <p className="nds-lead">
        Componenti in pagina <strong>Experimental</strong> in Figma, status &quot;Ready to Dev&quot;.
        Anteprima della prossima release; non inclusi in <code>@namirial/components</code>.
      </p>
      <ComponentsContent scope="experimental" />
    </>
  );
}
