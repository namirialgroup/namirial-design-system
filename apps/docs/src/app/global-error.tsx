"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", padding: "2rem", background: "#fafafa", color: "#0a0a0a" }}>
        <h1>Errore globale</h1>
        <p>{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: "0.5rem 1rem", cursor: "pointer", marginTop: "1rem" }}
        >
          Riprova
        </button>
      </body>
    </html>
  );
}
