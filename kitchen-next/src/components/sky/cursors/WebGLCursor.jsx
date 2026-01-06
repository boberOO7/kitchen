"use client";

import { useEffect, useRef, useState } from "react";

// Metaball Fluid Cursor
// Uses SVG filter "goo effect" to make particles merge like liquid droplets

const CURSOR_CONTRAST_KEY = "sky-cursor-contrast";

export default function WebGLCursor() {
  const containerRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [contrastMode, setContrastMode] = useState(false); // false = blend mode, true = shadow
  const particlesRef = useRef([]);
  const posRef = useRef({ x: -100, y: -100, px: -100, py: -100 });
  const rafRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedContrast = localStorage.getItem(CURSOR_CONTRAST_KEY);
      if (storedContrast !== null) setContrastMode(storedContrast === "true");
    } catch {}

    const onContrastChange = (e) => {
      setContrastMode(e?.detail ?? false);
    };
    window.addEventListener("sky-cursor-contrast-change", onContrastChange);

    return () => {
      window.removeEventListener("sky-cursor-contrast-change", onContrastChange);
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    // Resize
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle class
    class Particle {
      constructor(x, y, vx, vy, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 1.0;
        this.decay = 0.012 + Math.random() * 0.008;
        this.size = size || 20 + Math.random() * 30;
        this.originalSize = this.size;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy *= 0.94;
        this.life -= this.decay;
        this.size = this.originalSize * Math.pow(this.life, 0.5);
        return this.life > 0;
      }
    }

    // Mouse tracking
    const handleMouse = (e) => {
      posRef.current.px = posRef.current.x;
      posRef.current.py = posRef.current.y;
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });

    // Get accent color
    const getColor = () => {
      const css = getComputedStyle(document.documentElement)
        .getPropertyValue("--sky-accent").trim();
      return css || "#b08d57";
    };

    // Animation
    const animate = () => {
      const { x, y, px, py } = posRef.current;

      // Spawn particles along movement path
      const dx = x - px;
      const dy = y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        // More particles for faster movement
        const numParticles = Math.min(Math.ceil(dist / 10), 5);
        
        for (let i = 0; i < numParticles; i++) {
          const t = i / numParticles;
          const spawnX = px + dx * t + (Math.random() - 0.5) * 8;
          const spawnY = py + dy * t + (Math.random() - 0.5) * 8;
          
          // Velocity based on movement direction with some spread
          const spread = 0.3;
          const vx = dx * 0.08 + (Math.random() - 0.5) * spread * dist * 0.1;
          const vy = dy * 0.08 + (Math.random() - 0.5) * spread * dist * 0.1;
          
          // Larger particles in center, smaller on edges
          const centerBias = 1 - Math.abs(t - 0.5) * 2;
          const size = 10 + Math.random() * 12 + centerBias * 8;

          if (particlesRef.current.length < 200) {
            particlesRef.current.push(new Particle(spawnX, spawnY, vx, vy, size));
          }
        }
      }

      // Add a "head" particle at cursor position only when clearly moving
      if (dist > 5 && particlesRef.current.length < 200) {
        particlesRef.current.push(new Particle(x, y, dx * 0.02, dy * 0.02, 14));
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => p.update());

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get color
      const color = getColor();

      // Draw particles
      ctx.fillStyle = color;
      
      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw cursor head (always visible)
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 99999,
        // Use blend mode only when contrast mode is OFF
        mixBlendMode: contrastMode ? 'normal' : 'difference',
      }}
    >
      {/* SVG Filter for metaball/goo effect */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          {/* Standard goo filter - used when contrast mode is OFF (with blend mode) */}
          <filter id="goo-filter">
            {/* Blur to make edges soft and overlapping */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            {/* Color matrix to create threshold effect - this is the magic */}
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -10"
              result="goo"
            />
            {/* Composite original on top for sharper edges */}
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          {/* Combined goo + shadow filter - used when contrast mode is ON */}
          <filter id="goo-filter-shadow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 25 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" result="gooResult" />
            {/* Add subtle shadow for contrast on any background */}
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--sky-bg, #fafafa)" floodOpacity="0.6" />
          </filter>
        </defs>
      </svg>

      {/* Canvas with appropriate filter based on contrast mode */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          filter: contrastMode ? "url(#goo-filter-shadow)" : "url(#goo-filter)",
        }}
      />
    </div>
  );
}
