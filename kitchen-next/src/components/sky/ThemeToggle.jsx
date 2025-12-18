"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "sky-theme";
const PALETTE_KEY = "sky-palette";

const PALETTES = [
  { id: "mono", label: "Mono", color: "#0a0a0a" },
  { id: "warm", label: "Sand", color: "#b8860b" },
  { id: "slate", label: "Slate", color: "#3b82f6" },
  { id: "forest", label: "Forest", color: "#16a34a" },
];

function getInitial(key, fallback) {
  if (typeof document === "undefined") return fallback;
  return document.documentElement?.dataset?.[key.replace("sky-", "")] || fallback;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getInitial(THEME_KEY, "dark"));
  const [palette, setPalette] = useState(() => getInitial(PALETTE_KEY, "mono"));
  const [showPalettes, setShowPalettes] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);
      const storedPalette = localStorage.getItem(PALETTE_KEY);
      if (storedTheme) setTheme(storedTheme);
      if (storedPalette) setPalette(storedPalette);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.palette = palette;
    try { localStorage.setItem(PALETTE_KEY, palette); } catch {}
  }, [palette]);

  const currentPalette = PALETTES.find(p => p.id === palette) || PALETTES[0];

  return (
    <div className="relative flex items-center gap-2">
      {/* Theme toggle (dark/light) */}
      <button
        type="button"
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        className="flex h-8 items-center gap-1.5 border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] px-2.5 text-[var(--sky-header-fg)] transition hover:bg-[var(--sky-header-surface-hover)]"
        style={{ borderRadius: 2 }}
        aria-label={theme === "dark" ? "Switch to light" : "Switch to dark"}
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

      {/* Palette picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPalettes(!showPalettes)}
          className="flex h-8 items-center gap-2 border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] px-2.5 text-[var(--sky-header-fg)] transition hover:bg-[var(--sky-header-surface-hover)]"
          style={{ borderRadius: 2 }}
          aria-label="Choose color palette"
        >
          <span
            className="h-3.5 w-3.5 border border-black/10"
            style={{ background: currentPalette.color, borderRadius: 1 }}
          />
          <span className="hidden text-xs sm:inline">{currentPalette.label}</span>
          <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPalettes && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPalettes(false)} />
            <div
              className="absolute right-0 top-full z-50 mt-1 min-w-[140px] border border-[var(--sky-border)] bg-[var(--sky-surface)] p-1 shadow-lg"
              style={{ borderRadius: 2 }}
            >
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPalette(p.id);
                    setShowPalettes(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-xs transition ${
                    palette === p.id
                      ? "bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                      : "text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
                  }`}
                  style={{ borderRadius: 1 }}
                >
                  <span
                    className="h-3.5 w-3.5 border border-black/10"
                    style={{ background: p.color, borderRadius: 1 }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
