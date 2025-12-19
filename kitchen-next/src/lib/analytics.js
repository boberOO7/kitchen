"use client";

export function track(eventName, properties) {
  try {
    // Vercel Web Analytics exposes `window.va.track`
    if (typeof window !== "undefined" && window.va && typeof window.va.track === "function") {
      window.va.track(eventName, properties);
    }
  } catch {}
}


