"use client";

import { useEffect, useRef, useState } from "react";

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
  const [visible, setVisible] = useState(true);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const updateFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / delta));
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(updateFPS);
    };

    animationId = requestAnimationFrame(updateFPS);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === "production") return null;

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed top-4 right-4 z-[9999] h-8 w-8 rounded bg-black/70 text-xs text-white backdrop-blur-sm"
        title="Show FPS"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 rounded bg-black/80 px-3 py-2 font-mono text-xs text-white backdrop-blur-sm">
      <span
        className={`font-bold ${
          fps >= 55 ? "text-green-400" : fps >= 30 ? "text-yellow-400" : "text-red-400"
        }`}
      >
        {fps} FPS
      </span>
      <button
        onClick={() => setVisible(false)}
        className="ml-1 opacity-50 hover:opacity-100"
        title="Hide"
      >
        ✕
      </button>
    </div>
  );
}
