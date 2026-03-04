import Link from "next/link";

export default function NotFound() {
  return (
    <div className="nds-doc-section">
      <h1>404 — Pagina non trovata</h1>
      <p className="nds-lead">La pagina richiesta non esiste.</p>
      <p>
        <Link href="/" className="nds-nav-link">
          Torna alla home
        </Link>
      </p>
    </div>
  );
}
