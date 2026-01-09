"use client";

import { useEffect, useState } from "react";

const MAGNET_KEY = "sky-magnet";
const CURSOR_KEY = "sky-cursor-mode";
const CURSOR_CONTRAST_KEY = "sky-cursor-contrast";
const VIDEO_KEY = "sky-video";
const PALETTE_KEY = "sky-palette";

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

export default function DevTools() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [palette, setPalette] = useState("mono");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [magnetMode, setMagnetMode] = useState("free");
  const [cursorMode, setCursorMode] = useState("blob");
  const [cursorContrast, setCursorContrast] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedPalette = localStorage.getItem(PALETTE_KEY);
      const storedVideo = localStorage.getItem(VIDEO_KEY);
      const storedMagnet = localStorage.getItem(MAGNET_KEY);
      const storedCursor = localStorage.getItem(CURSOR_KEY);
      const storedCursorContrast = localStorage.getItem(CURSOR_CONTRAST_KEY);
      if (storedPalette) setPalette(storedPalette);
      if (storedVideo !== null) setVideoEnabled(storedVideo === "true");
      if (storedMagnet) setMagnetMode(storedMagnet);
      if (storedCursor) setCursorMode(storedCursor);
      if (storedCursorContrast !== null) setCursorContrast(storedCursorContrast === "true");
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.palette = palette;
    try { localStorage.setItem(PALETTE_KEY, palette); } catch {}
  }, [palette]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.video = videoEnabled ? "on" : "off";
    try { localStorage.setItem(VIDEO_KEY, String(videoEnabled)); } catch {}
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

  if (!mounted) return null;

  return (
    <div className="fixed top-20 right-4 z-[9998] flex flex-col items-end gap-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center border shadow-lg transition ${
          isOpen
            ? "border-[var(--sky-accent)] bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
            : "border-[var(--sky-border)] bg-[var(--sky-surface)] text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
        }`}
        style={{ borderRadius: 4 }}
        aria-label={isOpen ? "Close dev tools" : "Open dev tools"}
        title="Dev Tools"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
          )}
        </svg>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div
          className="flex flex-col gap-2.5 border border-[var(--sky-border)] bg-[var(--sky-surface)] p-3 shadow-lg backdrop-blur-md"
          style={{ borderRadius: 4 }}
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--sky-muted)] mb-0.5">
            Dev Tools
          </div>

          {/* Cursor mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 w-20">
              <svg className="h-3.5 w-3.5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.76L7.62 18.78C7.45 18.92 7.24 19 7 19C6.45 19 6 18.55 6 18V3C6 2.45 6.45 2 7 2C7.24 2 7.47 2.09 7.64 2.23L7.65 2.22L19.14 11.86C19.57 12.22 19.62 12.85 19.27 13.27C19.1 13.47 18.86 13.59 18.62 13.62L14.94 14.04L17.15 18.81C17.39 19.31 17.18 19.91 16.68 20.15L13.64 21.97Z"/>
              </svg>
              <span className="text-[11px] text-[var(--sky-muted)]">Cursor</span>
            </div>
            <div className="flex gap-1">
              {CURSOR_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setCursorMode(mode.id)}
                  className={`px-2 py-1 text-[11px] border transition ${
                    cursorMode === mode.id
                      ? "border-[var(--sky-accent)] bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                      : "border-[var(--sky-border)] text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
                  }`}
                  style={{ borderRadius: 2 }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cursor contrast */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 w-20">
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
              </svg>
              <span className="text-[11px] text-[var(--sky-muted)]">Contrast</span>
            </div>
            <button
              type="button"
              onClick={() => setCursorContrast((v) => !v)}
              className={`px-2 py-1 text-[11px] border transition ${
                cursorContrast
                  ? "border-[var(--sky-accent)] bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                  : "border-[var(--sky-border)] text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {cursorContrast ? "Outline" : "Blend"}
            </button>
          </div>

          {/* Magnet mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 w-20">
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.01M6 18h.01M18 6h.01M18 18h.01M3 12h3m12 0h3M12 3v3m0 12v3" />
              </svg>
              <span className="text-[11px] text-[var(--sky-muted)]">Magnet</span>
            </div>
            <div className="flex gap-1">
              {MAGNET_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setMagnetMode(mode.id)}
                  className={`px-2 py-1 text-[11px] border transition ${
                    magnetMode === mode.id
                      ? "border-[var(--sky-accent)] bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                      : "border-[var(--sky-border)] text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
                  }`}
                  style={{ borderRadius: 2 }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Video toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 w-20">
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-[11px] text-[var(--sky-muted)]">Video</span>
            </div>
            <button
              type="button"
              onClick={() => setVideoEnabled((v) => !v)}
              className={`px-2 py-1 text-[11px] border transition ${
                videoEnabled
                  ? "border-[var(--sky-accent)] bg-[var(--sky-accent)] text-[var(--sky-accent-fg)]"
                  : "border-[var(--sky-border)] text-[var(--sky-fg)] hover:bg-[var(--sky-bg-alt)]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {videoEnabled ? "On" : "Off"}
            </button>
          </div>

          {/* Palette picker */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 w-20">
              <svg className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
              </svg>
              <span className="text-[11px] text-[var(--sky-muted)]">Palette</span>
            </div>
            <div className="flex gap-1.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPalette(p.id)}
                  className={`h-6 w-6 border transition ${
                    palette === p.id
                      ? "border-[var(--sky-fg)] scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ background: p.color, borderRadius: 2 }}
                  title={p.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
