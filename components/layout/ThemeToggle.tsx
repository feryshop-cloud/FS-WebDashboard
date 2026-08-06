"use client";

import { useState, useEffect, useCallback } from "react";
import { Sun, Moon } from "lucide-react";
import { getInitialTheme, setTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydration guard: initial theme must be read client-side only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setThemeState(getInitialTheme());
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("feryshop-theme");
      if (!stored) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mounted]);

  const handleToggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    setTheme(next);
  }, [theme]);

  if (!mounted) {
    return (
      <button
        className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ease-in-out"
        aria-label="Switch to dark mode"
        title="Switch to dark mode"
        disabled
      >
        <Moon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
        <span className="text-sm font-medium whitespace-nowrap">Dark Mode</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ease-in-out"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 shrink-0" strokeWidth={1.5} />
      ) : (
        <Moon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
      )}
      <span className="text-sm font-medium whitespace-nowrap">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
}
