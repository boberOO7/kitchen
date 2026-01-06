"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "sky-theme";
const PALETTE_KEY = "sky-palette";
const VIDEO_KEY = "sky-video";
const MAGNET_KEY = "sky-magnet";
const CURSOR_KEY = "sky-cursor-mode";
const CURSOR_CONTRAST_KEY = "sky-cursor-contrast";

const MAGNET_MODES = [
  { id: "free", label: "Free" },
  { id: "field", label: "Field" },
  { id: "off", label: "Off" },
];

const CURSOR_MODES = [
  { id: "blob", label: "Blob" },
  { id: "trail", label: "Trail" },
  { id: "webgl", label: "Fluid" },
];

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
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState(() => getInitial(THEME_KEY, "dark"));
  const [palette, setPalette] = useState(() => getInitial(PALETTE_KEY, "mono"));
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [magnetMode, setMagnetMode] = useState("free");
  const [cursorMode, setCursorMode] = useState("blob");
  const [cursorContrast, setCursorContrast] = useState(false); // false = blend mode, true = outline/shadow
  const [showPalettes, setShowPalettes] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem(THEME_KEY);
      const storedPalette = localStorage.getItem(PALETTE_KEY);
      const storedVideo = localStorage.getItem(VIDEO_KEY);
      const storedMagnet = localStorage.getItem(MAGNET_KEY);
      const storedCursor = localStorage.getItem(CURSOR_KEY);
      const storedCursorContrast = localStorage.getItem(CURSOR_CONTRAST_KEY);
      if (storedTheme) setTheme(storedTheme);
      if (storedPalette) setPalette(storedPalette);
      if (storedVideo !== null) setVideoEnabled(storedVideo === "true");
      if (storedMagnet) setMagnetMode(storedMagnet);
      if (storedCursor) setCursorMode(storedCursor);
      if (storedCursorContrast !== null) setCursorContrast(storedCursorContrast === "true");
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.video = videoEnabled ? "on" : "off";
    try { localStorage.setItem(VIDEO_KEY, String(videoEnabled)); } catch {}
    // Dispatch custom event for page.js to listen
    window.dispatchEvent(new CustomEvent("sky-video-change", { detail: videoEnabled }));
  }, [videoEnabled]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    try { localStorage.setItem(MAGNET_KEY, magnetMode); } catch {}
    window.dispatchEvent(new CustomEvent("sky-magnet-change", { detail: magnetMode }));
  }, [magnetMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    try { localStorage.setItem(CURSOR_KEY, cursorMode); } catch {}
    window.dispatchEvent(new CustomEvent("sky-cursor-change", { detail: cursorMode }));
  }, [cursorMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    try { localStorage.setItem(CURSOR_CONTRAST_KEY, String(cursorContrast)); } catch {}
    window.dispatchEvent(new CustomEvent("sky-cursor-contrast-change", { detail: cursorContrast }));
  }, [cursorContrast]);

  const currentPalette = PALETTES.find(p => p.id === palette) || PALETTES[0];
  const currentMagnet = MAGNET_MODES.find((m) => m.id === magnetMode) || MAGNET_MODES[0];
  const currentCursor = CURSOR_MODES.find((c) => c.id === cursorMode) || CURSOR_MODES[0];

  // Avoid hydration mismatch: server can't know localStorage-based palette/theme.
  // Render a fixed-size placeholder until mounted so SSR and first client render match.
  if (!mounted) {
    return (
      <div className="relative flex items-center gap-2" aria-hidden="true">
        <div
          className="h-8 w-[140px] border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)]"
          style={{ borderRadius: 2 }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Cursor mode toggle */}
      <button
        type="button"
        onClick={() => {
          const idx = CURSOR_MODES.findIndex((c) => c.id === cursorMode);
          const next = CURSOR_MODES[(idx + 1) % CURSOR_MODES.length]?.id || "blob";
          setCursorMode(next);
        }}
        className="flex h-8 items-center gap-2 border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] px-2.5 text-[var(--sky-header-fg)] transition hover:bg-[var(--sky-header-surface-hover)]"
        style={{ borderRadius: 2 }}
        aria-label="Cursor style"
        title={`Cursor: ${currentCursor.label}`}
      >
        <svg className="h-3.5 w-3.5 opacity-80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.76L7.62 18.78C7.45 18.92 7.24 19 7 19C6.45 19 6 18.55 6 18V3C6 2.45 6.45 2 7 2C7.24 2 7.47 2.09 7.64 2.23L7.65 2.22L19.14 11.86C19.57 12.22 19.62 12.85 19.27 13.27C19.1 13.47 18.86 13.59 18.62 13.62L14.94 14.04L17.15 18.81C17.39 19.31 17.18 19.91 16.68 20.15L13.64 21.97Z"/>
        </svg>
        <span className="hidden text-xs sm:inline">{currentCursor.label}</span>
      </button>

      {/* Cursor contrast mode toggle (outline vs blend) */}
      <button
        type="button"
        onClick={() => setCursorContrast((v) => !v)}
        className={`flex h-8 items-center gap-1.5 border px-2.5 transition ${
          cursorContrast
            ? "border-[var(--sky-accent)] bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
            : "border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] text-[var(--sky-header-fg)] hover:bg-[var(--sky-header-surface-hover)]"
        }`}
        style={{ borderRadius: 2 }}
        aria-label={cursorContrast ? "Cursor: outline mode" : "Cursor: blend mode"}
        title={cursorContrast ? "Контраст: обведення (для світлої теми)" : "Контраст: інверсія (blend)"}
      >
        {cursorContrast ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
          </svg>
        )}
      </button>

      {/* Magnetism mode toggle */}
      <button
        type="button"
        onClick={() => {
          const idx = MAGNET_MODES.findIndex((m) => m.id === magnetMode);
          const next = MAGNET_MODES[(idx + 1) % MAGNET_MODES.length]?.id || "free";
          setMagnetMode(next);
        }}
        className="flex h-8 items-center gap-2 border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] px-2.5 text-[var(--sky-header-fg)] transition hover:bg-[var(--sky-header-surface-hover)]"
        style={{ borderRadius: 2 }}
        aria-label="Magnetism mode"
        title={`Magnet: ${currentMagnet.label}`}
      >
        <span className="text-[11px] tracking-[0.08em] opacity-80">MAG</span>
        <span className="hidden text-xs sm:inline">{currentMagnet.label}</span>
      </button>

      {/* Video toggle */}
      <button
        type="button"
        onClick={() => setVideoEnabled((v) => !v)}
        className="flex h-8 items-center gap-1.5 border border-[var(--sky-header-border)] bg-[var(--sky-header-surface)] px-2.5 text-[var(--sky-header-fg)] transition hover:bg-[var(--sky-header-surface-hover)]"
        style={{ borderRadius: 2 }}
        aria-label={videoEnabled ? "Disable video background" : "Enable video background"}
        title={videoEnabled ? "Вимкнути відео" : "Увімкнути відео"}
      >
        {videoEnabled ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m10.591 10.591L4.659 7.409" />
          </svg>
        )}
      </button>

      {/* Theme toggle */}
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

