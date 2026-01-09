"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to read CSS custom properties from the current theme.
 * Automatically updates when theme or palette changes.
 */
export function useThemeColors() {
  const [colors, setColors] = useState({
    canvasBg: "#f4f5f6",
    canvasFloor: "#f0f1f3",
    isDark: false,
  });

  const updateColors = useCallback(() => {
    if (typeof window === "undefined") return;

    const style = getComputedStyle(document.documentElement);
    const canvasBg = style.getPropertyValue("--sky-canvas-bg").trim() || "#f4f5f6";
    const canvasFloor = style.getPropertyValue("--sky-canvas-floor").trim() || "#f0f1f3";
    const theme = document.documentElement.dataset.theme;
    const isDark = theme === "dark";

    setColors({ canvasBg, canvasFloor, isDark });
  }, []);

  useEffect(() => {
    // Initial read
    updateColors();

    // Watch for theme/palette changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "data-theme" || mutation.attributeName === "data-palette")
        ) {
          updateColors();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });

    return () => observer.disconnect();
  }, [updateColors]);

  return colors;
}
