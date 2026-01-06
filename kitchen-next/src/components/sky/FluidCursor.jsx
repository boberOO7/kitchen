"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic imports to avoid SSR issues
const BlobCursor = dynamic(() => import("./cursors/BlobCursor"), { ssr: false });
const TrailCursor = dynamic(() => import("./cursors/TrailCursor"), { ssr: false });
const WebGLCursor = dynamic(() => import("./cursors/WebGLCursor"), { ssr: false });

const CURSOR_MODES = ["blob", "trail", "webgl"];
const CURSOR_KEY = "sky-cursor-mode";

export default function FluidCursor() {
  const [cursorMode, setCursorMode] = useState("blob"); // default to blob
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Load saved cursor mode
    try {
      const saved = localStorage.getItem(CURSOR_KEY);
      if (saved && CURSOR_MODES.includes(saved)) {
        setCursorMode(saved);
      }
    } catch {}

    // Listen for cursor mode changes
    const handleCursorChange = (e) => {
      const newMode = e?.detail;
      if (newMode && CURSOR_MODES.includes(newMode)) {
        setCursorMode(newMode);
        try {
          localStorage.setItem(CURSOR_KEY, newMode);
        } catch {}
      }
    };

    window.addEventListener("sky-cursor-change", handleCursorChange);

    return () => {
      window.removeEventListener("sky-cursor-change", handleCursorChange);
    };
  }, []);

  if (!isClient) return null;

  // Render appropriate cursor component
  switch (cursorMode) {
    case "blob":
      return <BlobCursor />;
    case "trail":
      return <TrailCursor />;
    case "webgl":
      return <WebGLCursor />;
    default:
      return <BlobCursor />;
  }
}

// Export cursor modes for settings
export { CURSOR_MODES, CURSOR_KEY };
