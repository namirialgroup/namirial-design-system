"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="nds-error-boundary">
      <h2>Qualcosa è andato storto</h2>
      <p className="nds-error-message">{error.message}</p>
      <button type="button" className="nds-error-reset" onClick={() => reset()}>
        Riprova
      </button>
    </div>
  );
}
