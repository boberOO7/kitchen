"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Check if already shown this session
    const hasShown = sessionStorage.getItem("sky-preloader-shown");
    if (hasShown) {
      setIsVisible(false);
      setIsAnimating(false);
      return;
    }

    // Wait for page load + small delay for effect
    const handleLoad = () => {
      setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem("sky-preloader-shown", "true");
        }, 600); // Wait for fade out animation
      }, 800); // Minimum display time
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--sky-hero-bg)] transition-opacity duration-500 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Logo */}
      <div
        className={`transition-all duration-700 ${
          isAnimating
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="relative">
          {/* Logo text */}
          <h1 className="text-5xl font-light tracking-[0.3em] text-[var(--sky-hero-fg)] sm:text-6xl">
            SKY
          </h1>
          
          {/* Subtitle */}
          <p className="mt-2 text-center text-xs tracking-[0.25em] text-[var(--sky-hero-muted)]">
            KITCHENS
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      <div
        className={`mt-12 transition-all delay-200 duration-500 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Animated line */}
        <div className="relative h-[2px] w-32 overflow-hidden bg-[var(--sky-hero-fg)]/10">
          <div
            className="sky-preloader-sweep absolute inset-y-0 left-0 w-1/2 bg-[var(--sky-hero-fg)]/60"
          />
        </div>
      </div>
    </div>
  );
}

