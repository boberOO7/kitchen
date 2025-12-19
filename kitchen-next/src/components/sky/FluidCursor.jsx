"use client";

import { useEffect, useRef, useState } from "react";

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Smoothstep returning 0..1 where x<=edge0 -> 0 and x>=edge1 -> 1 (works with edge0<edge1)
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function rectInfo(rect) {
  const left = rect.left;
  const top = rect.top;
  const right = rect.right;
  const bottom = rect.bottom;
  const cx = left + rect.width / 2;
  const cy = top + rect.height / 2;
  return { left, top, right, bottom, cx, cy };
}

function pointRectDistance(x, y, rect) {
  const { left, top, right, bottom } = rectInfo(rect);
  const closestX = clamp(x, left, right);
  const closestY = clamp(y, top, bottom);
  const dx = x - closestX;
  const dy = y - closestY;
  const dist = Math.hypot(dx, dy);
  const inside = x >= left && x <= right && y >= top && y <= bottom;
  return { dist, inside, closestX, closestY };
}

function minEdgeDistanceInside(x, y, rect) {
  const { left, top, right, bottom } = rectInfo(rect);
  const dl = x - left;
  const dr = right - x;
  const dt = y - top;
  const db = bottom - y;
  return Math.min(dl, dr, dt, db);
}

function closestPointOnPerimeter(x, y, rect) {
  const { left, top, right, bottom } = rectInfo(rect);
  const inside = x >= left && x <= right && y >= top && y <= bottom;
  if (!inside) {
    return {
      x: clamp(x, left, right),
      y: clamp(y, top, bottom),
    };
  }
  // inside: pick nearest edge and project onto it
  const dl = x - left;
  const dr = right - x;
  const dt = y - top;
  const db = bottom - y;
  const m = Math.min(dl, dr, dt, db);
  if (m === dl) return { x: left, y: clamp(y, top, bottom) };
  if (m === dr) return { x: right, y: clamp(y, top, bottom) };
  if (m === dt) return { x: clamp(x, left, right), y: top };
  return { x: clamp(x, left, right), y: bottom };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Generate smooth blob path from points
function generateBlobPath(points) {
  if (points.length < 3) return "";
  
  const smoothing = 0.2;
  
  const line = (pointA, pointB) => {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointA.y;
    return {
      length: Math.sqrt(lengthX ** 2 + lengthY ** 2),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  const controlPoint = (current, previous, next, reverse) => {
    const p = previous || current;
    const n = next || current;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    return {
      x: current.x + Math.cos(angle) * length,
      y: current.y + Math.sin(angle) * length,
    };
  };

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const current = points[i];
    const previous = points[i - 1];
    const next = points[i + 1] || points[0];
    const beforePrevious = points[i - 2] || points[points.length - 1];

    const cp1 = controlPoint(previous, beforePrevious, current, false);
    const cp2 = controlPoint(current, previous, next, true);

    d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${current.x} ${current.y}`;
  }

  // Close path
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const secondPoint = points[1];
  const beforeLast = points[points.length - 2];

  const cp1 = controlPoint(lastPoint, beforeLast, firstPoint, false);
  const cp2 = controlPoint(firstPoint, lastPoint, secondPoint, true);

  d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${firstPoint.x} ${firstPoint.y}`;

  return d;
}

// Generate points around circle with organic noise
function generateCirclePoints(numPoints, radius, noise, time) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const noiseOffset = noise * Math.sin(time * 3 + i * 1.8);
    const r = radius + noiseOffset;
    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return points;
}

// Deform blob based on velocity - MORE AGGRESSIVE
function deformPoints(points, vx, vy, maxDeform = 0.8) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < 0.5) return points;
  
  // Lower threshold = more responsive, higher max = more stretch
  const normalizedSpeed = Math.min(speed / 20, 1);
  const deformAmount = normalizedSpeed * maxDeform;
  const moveAngle = Math.atan2(vy, vx);

  return points.map((point) => {
    const pointAngle = Math.atan2(point.y, point.x);
    const angleDiff = pointAngle - moveAngle;
    
    // Stretch in direction of movement
    const stretch = Math.cos(angleDiff);
    // Squish perpendicular to movement
    const perpSquish = Math.abs(Math.sin(angleDiff));
    
    const stretchFactor = 1 + stretch * deformAmount * 1.5;
    const squishFactor = 1 - perpSquish * deformAmount * 0.6;

    return {
      x: point.x * stretchFactor * squishFactor,
      y: point.y * stretchFactor * squishFactor,
    };
  });
}

export default function FluidCursor() {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const glowRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isMagnetic, setIsMagnetic] = useState(false);

  const MAGNET_KEY = "sky-magnet";

  // Animation state refs
  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const prevMouse = useRef({ x: 0, y: 0 });
  const magnetTarget = useRef(null);
  const magnetElements = useRef([]);
  const magnetActive = useRef(false);
  const frameCount = useRef(0);
  const strengthSmoothed = useRef(0);
  const isMagneticRef = useRef(false);
  const magnetModeRef = useRef("free"); // free | field | off
  const magnetTouchedRef = useRef(false); // for "free" mode: once inside, allow free movement
  const scale = useRef(1);
  const targetScale = useRef(1);
  const time = useRef(0);
  const raf = useRef(null);

  const BASE_RADIUS = 14;
  const NUM_POINTS = 8;
  const MAGNET_ENTER = 140; // start feeling pull outside element
  const MAGNET_EXIT = 180; // hysteresis (makes exiting a bit harder)
  const EDGE_STICK_RANGE = 28; // px inside element where edge influence ramps up
  const SWITCH_MARGIN = 18; // px improvement needed to switch between adjacent elements
  const SCALE_BOOST = 0.9; // constant scale boost while magnet active
  const STRENGTH_LERP = 0.14; // smoothing for magnetic strength
  const EXIT_RESIST = 22; // px pushback near edges (free mode only)

  useEffect(() => {
    setIsClient(true);

    // Load magnet mode + listen for changes
    try {
      const stored = localStorage.getItem(MAGNET_KEY);
      if (stored) magnetModeRef.current = stored;
    } catch {}

    const onMagnetMode = (e) => {
      magnetModeRef.current = e?.detail || "free";
      // Reset state when switching modes
      magnetTarget.current = null;
      magnetActive.current = false;
      magnetTouchedRef.current = false;
      strengthSmoothed.current = 0;
    };
    window.addEventListener("sky-magnet-change", onMagnetMode);
    
    // Init position
    mousePos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    cursorPos.current = { ...mousePos.current };
    prevMouse.current = { ...mousePos.current };

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const refreshMagnetElements = () => {
      // Keep it conservative; avoids scanning random divs.
      magnetElements.current = Array.from(
        document.querySelectorAll('[data-cursor-magnetic], a, button, [role="button"]')
      );
    };

    refreshMagnetElements();
    window.addEventListener("resize", refreshMagnetElements);
    window.addEventListener("scroll", refreshMagnetElements, { passive: true });

    const animate = () => {
      time.current += 0.016;
      frameCount.current += 1;

      // Calculate velocity - more responsive
      velocity.current.x = (mousePos.current.x - prevMouse.current.x) * 0.8 + velocity.current.x * 0.7;
      velocity.current.y = (mousePos.current.y - prevMouse.current.y) * 0.8 + velocity.current.y * 0.7;
      prevMouse.current = { ...mousePos.current };

      // Target position (with magnetic pull)
      let targetX = mousePos.current.x;
      let targetY = mousePos.current.y;
      let targetStrength = 0;

      // Refresh candidate list occasionally (DOM can change due to route transitions)
      if (frameCount.current % 30 === 0) {
        magnetElements.current = Array.from(
          document.querySelectorAll('[data-cursor-magnetic], a, button, [role="button"]')
        );
      }

      // Proximity detection + hysteresis
      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      const mode = magnetModeRef.current || "free";
      if (mode === "off") {
        // Decay magnet strength and skip target selection
        strengthSmoothed.current += (0 - strengthSmoothed.current) * STRENGTH_LERP;
        targetScale.current = 1 + SCALE_BOOST * strengthSmoothed.current;
        const nextMag = strengthSmoothed.current > 0.10;
        if (nextMag !== isMagneticRef.current) {
          isMagneticRef.current = nextMag;
          setIsMagnetic(nextMag);
        }
        // Smooth lerp (no magnetic adjustments)
        cursorPos.current.x += (targetX - cursorPos.current.x) * 0.18;
        cursorPos.current.y += (targetY - cursorPos.current.y) * 0.18;
        scale.current += (targetScale.current - scale.current) * 0.12;

        // Generate blob
        const radius = BASE_RADIUS * scale.current;
        let points = generateCirclePoints(NUM_POINTS, radius, 3, time.current);
        points = deformPoints(points, velocity.current.x, velocity.current.y);
        const path = generateBlobPath(points);
        if (pathRef.current) pathRef.current.setAttribute("d", path);
        if (glowRef.current) glowRef.current.setAttribute("d", path);
        if (svgRef.current) svgRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
        raf.current = requestAnimationFrame(animate);
        return;
      }

      const currentTarget = magnetTarget.current;
      if (currentTarget) {
        const rect = currentTarget.getBoundingClientRect();
        const { dist, inside } = pointRectDistance(mx, my, rect);
        // Keep active while inside, or within EXIT range
        if (!inside && dist > MAGNET_EXIT) {
          magnetTarget.current = null;
          magnetActive.current = false;
          magnetTouchedRef.current = false;
        }
        if (inside && mode === "free") {
          magnetTouchedRef.current = true;
        }
      }

      // Find best candidate (used for initial pick and stable switching)
      const findBestCandidate = () => {
        let bestEl = null;
        let bestDist = Infinity;

        for (const el of magnetElements.current) {
          if (!el || el === document.documentElement || el === document.body) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          // Skip if far outside viewport to reduce work
          if (rect.bottom < -MAGNET_ENTER || rect.top > window.innerHeight + MAGNET_ENTER) continue;
          if (rect.right < -MAGNET_ENTER || rect.left > window.innerWidth + MAGNET_ENTER) continue;

          const { dist } = pointRectDistance(mx, my, rect);
          if (dist < bestDist) {
            bestDist = dist;
            bestEl = el;
          }
        }

        return { bestEl, bestDist };
      };

      // If no current target, find nearest within ENTER range
      if (!magnetTarget.current && magnetElements.current.length) {
        const { bestEl, bestDist } = findBestCandidate();
        if (bestEl && bestDist < MAGNET_ENTER) {
          magnetTarget.current = bestEl;
          magnetActive.current = true;
        }
      } else if (magnetTarget.current && magnetElements.current.length && frameCount.current % 6 === 0) {
        // Sticky switching: only switch if a new element is meaningfully closer
        const currentRect = magnetTarget.current.getBoundingClientRect();
        const { dist: currentDist, inside: currentInside } = pointRectDistance(mx, my, currentRect);
        const { bestEl, bestDist } = findBestCandidate();
        // In "free" mode: once inside/contacted, don't switch until you exit
        if (mode === "free" && (currentInside || magnetTouchedRef.current)) {
          // no-op
        } else
        if (
          bestEl &&
          bestEl !== magnetTarget.current &&
          bestDist < MAGNET_ENTER &&
          // if we're not deep inside current, allow switch when clearly better
          (currentDist > 6 || !currentInside) &&
          bestDist + SWITCH_MARGIN < currentDist
        ) {
          magnetTarget.current = bestEl;
          magnetActive.current = true;
          magnetTouchedRef.current = false;
        }
      }

      // Apply magnetic behavior by mode
      const activeTarget = magnetTarget.current;
      if (activeTarget) {
        const rect = activeTarget.getBoundingClientRect();
        const { cx, cy } = rectInfo(rect);
        const { dist, inside } = pointRectDistance(mx, my, rect);

        if (mode === "field") {
          // Existing logic: continuous field + blended anchor
          targetStrength = 1 - smoothstep(0, MAGNET_ENTER, dist);

          const perimeter = closestPointOnPerimeter(mx, my, rect);
          const edgeDistInside = inside ? minEdgeDistanceInside(mx, my, rect) : 0;
          const edgeProximity = inside ? (1 - smoothstep(0, EDGE_STICK_RANGE, edgeDistInside)) : 1;
          const outsideBlend = inside ? edgeProximity : 1;

          const anchorX = lerp(cx, perimeter.x, outsideBlend);
          const anchorY = lerp(cy, perimeter.y, outsideBlend);

          const pull = 0.9;
          targetX += (anchorX - mx) * targetStrength * pull;
          targetY += (anchorY - my) * targetStrength * pull;
        } else {
          // mode === "free"
          // Outside: attract to the element (uniformly to its bounds)
          // Inside after contact: allow free movement (no pull), but keep magnetic look.
          const baseStrength = 1 - smoothstep(0, MAGNET_ENTER, dist);
          const touched = magnetTouchedRef.current;

          if (!inside && !touched) {
            targetStrength = baseStrength;
            // pull to closest point on rect (all sides)
            const { closestX, closestY } = pointRectDistance(mx, my, rect);
            const pull = 0.95;
            targetX += (closestX - mx) * targetStrength * pull;
            targetY += (closestY - my) * targetStrength * pull;
          } else {
            // Inside (or already touched): no pull (free movement)
            targetStrength = 1; // keep magnetic look while within the active magnet

            // Exit should be harder: resist leaving near edges only when moving outward.
            if (inside) {
              const edgeDist = minEdgeDistanceInside(mx, my, rect);
              const edgeStrength = 1 - smoothstep(0, EDGE_STICK_RANGE, edgeDist); // 1 near edge
              if (edgeStrength > 0) {
                // Determine nearest edge outward normal
                const { left, top, right, bottom } = rectInfo(rect);
                const dl = mx - left;
                const dr = right - mx;
                const dt = my - top;
                const db = bottom - my;
                const m = Math.min(dl, dr, dt, db);
                let nx = 0, ny = 0; // outward normal
                if (m === dl) { nx = -1; ny = 0; }
                else if (m === dr) { nx = 1; ny = 0; }
                else if (m === dt) { nx = 0; ny = -1; }
                else { nx = 0; ny = 1; }

                // Apply resistance only if velocity points outward
                const dot = velocity.current.x * nx + velocity.current.y * ny;
                if (dot > 0.1) {
                  // push cursor back inside along -normal
                  targetX += (-nx) * edgeStrength * EXIT_RESIST;
                  targetY += (-ny) * edgeStrength * EXIT_RESIST;
                }
              }
            }
          }
        }

        // Sticky target must feel consistent across entire element: keep scale tied to strength only
        // (no special-casing inside vs outside)
        // Extra safety: clear if far away
        if (!inside && dist > MAGNET_EXIT) {
          magnetTarget.current = null;
          magnetActive.current = false;
          targetStrength = 0;
        }
      }

      // Smooth magnetic strength to eliminate shaking near boundaries/corners
      strengthSmoothed.current += (targetStrength - strengthSmoothed.current) * STRENGTH_LERP;

      // Scale stays consistent anywhere within the magnet zone (including inside)
      targetScale.current = 1 + SCALE_BOOST * strengthSmoothed.current;

      // Avoid per-frame React updates; only update when threshold crosses
      const nextMag = strengthSmoothed.current > 0.10;
      if (nextMag !== isMagneticRef.current) {
        isMagneticRef.current = nextMag;
        setIsMagnetic(nextMag);
      }

      // Smooth lerp
      cursorPos.current.x += (targetX - cursorPos.current.x) * 0.18;
      cursorPos.current.y += (targetY - cursorPos.current.y) * 0.18;
      scale.current += (targetScale.current - scale.current) * 0.12;

      // Generate blob - more organic wobble (3 instead of 2)
      const radius = BASE_RADIUS * scale.current;
      let points = generateCirclePoints(NUM_POINTS, radius, 3, time.current);
      points = deformPoints(points, velocity.current.x, velocity.current.y);

      const path = generateBlobPath(points);

      // Update DOM
      if (pathRef.current) pathRef.current.setAttribute('d', path);
      if (glowRef.current) glowRef.current.setAttribute('d', path);
      if (svgRef.current) {
        svgRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`;
      }

      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener("resize", refreshMagnetElements);
      window.removeEventListener("scroll", refreshMagnetElements);
      window.removeEventListener("sky-magnet-change", onMagnetMode);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!isClient) return null;

  return (
    <svg
      ref={svgRef}
      className="fluid-cursor"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 80,
        height: 80,
        marginLeft: -40,
        marginTop: -40,
        pointerEvents: 'none',
        zIndex: 99999,
        mixBlendMode: 'difference',
        willChange: 'transform',
      }}
      viewBox="-40 -40 80 80"
    >
      <defs>
        <filter id="cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Glow */}
      <path
        ref={glowRef}
        d="M14,0 A14,14 0 1,1 -14,0 A14,14 0 1,1 14,0"
        fill="var(--sky-accent, #b08d57)"
        opacity={isMagnetic ? 0.5 : 0.25}
        filter="url(#cursor-glow)"
      />
      
      {/* Main blob */}
      <path
        ref={pathRef}
        d="M14,0 A14,14 0 1,1 -14,0 A14,14 0 1,1 14,0"
        fill="var(--sky-accent, #b08d57)"
        opacity={isMagnetic ? 1 : 0.85}
      />
    </svg>
  );
}
