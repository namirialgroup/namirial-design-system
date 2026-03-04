"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="nds-theme-toggle"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label={theme === "light" ? "Attiva dark mode" : "Attiva light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? (
        <Moon size={20} strokeWidth={2} aria-hidden />
      ) : (
        <Sun size={20} strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
