"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "sky-theme";

function getInitial(key, fallback) {
  if (typeof document === "undefined") return fallback;
  return document.documentElement?.dataset?.[key.replace("sky-", "")] || fallback;
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState(() => getInitial(THEME_KEY, "dark"));

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme) setTheme(storedTheme);
    } catch {}
    
    // Enable smooth transitions after initial render (prevents FOUC)
    requestAnimationFrame(() => {
      document.documentElement.dataset.themeReady = "true";
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className="h-8 w-8 border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)]"
        style={{ borderRadius: 2 }}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="flex h-8 w-8 items-center justify-center border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] text-[var(--sky-header-fg)] transition hover:bg-[var(--sky-header-surface-hover)]"
      style={{ borderRadius: 2 }}
      aria-label={theme === "dark" ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
    >
      {theme === "dark" ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
}
