"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeContext";

export type PreviewTheme = "light" | "dark";

const PreviewThemeContext = createContext<PreviewTheme>("light");

export function usePreviewTheme(): PreviewTheme {
  return useContext(PreviewThemeContext);
}

interface PreviewThemeWrapperProps {
  children: React.ReactNode;
  /** Etichetta opzionale sopra il toggle (es. "Anteprima") */
  label?: string;
  className?: string;
}

/**
 * Wrapper per le preview: toggle Light | Dark solo per questa anteprima.
 * Default = tema della webapp (nessuna CTA "App", solo Light/Dark con quello attivo di default).
 */
export function PreviewThemeWrapper({ children, label, className = "" }: PreviewThemeWrapperProps) {
  const { theme: appTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");
  const userHasChosenRef = useRef(false);
  useEffect(() => {
    if (!userHasChosenRef.current) setPreviewTheme(appTheme);
  }, [appTheme]);
  const setLight = () => {
    userHasChosenRef.current = true;
    setPreviewTheme("light");
  };
  const setDark = () => {
    userHasChosenRef.current = true;
    setPreviewTheme("dark");
  };

  return (
    <PreviewThemeContext.Provider value={previewTheme}>
      <div className={`nds-preview-theme-wrapper ${className}`.trim()}>
        <div className="nds-preview-theme-header">
          {label ? <span className="nds-preview-theme-label">{label}</span> : null}
          <div className="nds-preview-theme-toggle" role="group" aria-label="Tema anteprima">
            <button
              type="button"
              className={previewTheme === "light" ? "nds-preview-theme-btn nds-preview-theme-btn--active" : "nds-preview-theme-btn"}
              onClick={setLight}
              title="Anteprima in light"
            >
              Light
            </button>
            <button
              type="button"
              className={previewTheme === "dark" ? "nds-preview-theme-btn nds-preview-theme-btn--active" : "nds-preview-theme-btn"}
              onClick={setDark}
              title="Anteprima in dark"
            >
              Dark
            </button>
          </div>
        </div>
        <div className="nds-preview-theme-canvas" data-theme={previewTheme}>
          {children}
        </div>
      </div>
    </PreviewThemeContext.Provider>
  );
}
