"use client";

import { useEffect, useRef, useState } from "react";

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function rectInfo(rect) {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
  };
}

function pointRectDistance(x, y, rect) {
  const { left, top, right, bottom } = rectInfo(rect);
  const closestX = clamp(x, left, right);
  const closestY = clamp(y, top, bottom);
  const dx = x - closestX;
  const dy = y - closestY;
  return {
    dist: Math.hypot(dx, dy),
    inside: x >= left && x <= right && y >= top && y <= bottom,
    closestX,
    closestY,
  };
}

function minEdgeDistanceInside(x, y, rect) {
  const { left, top, right, bottom } = rectInfo(rect);
  return Math.min(x - left, right - x, y - top, bottom - y);
}

function closestPointOnPerimeter(x, y, rect) {
  const { left, top, right, bottom } = rectInfo(rect);
  const inside = x >= left && x <= right && y >= top && y <= bottom;
  if (!inside) {
    return { x: clamp(x, left, right), y: clamp(y, top, bottom) };
  }
  const dl = x - left, dr = right - x, dt = y - top, db = bottom - y;
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
  
  const line = (pointA, pointB) => ({
    length: Math.sqrt((pointB.x - pointA.x) ** 2 + (pointB.y - pointA.y) ** 2),
    angle: Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x),
  });

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

// Deform blob based on velocity
function deformPoints(points, vx, vy, maxDeform = 0.6) {
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < 0.5) return points;
  
  const normalizedSpeed = Math.min(speed / 25, 1);
  const deformAmount = normalizedSpeed * maxDeform;
  const moveAngle = Math.atan2(vy, vx);

  return points.map((point) => {
    const pointAngle = Math.atan2(point.y, point.x);
    const angleDiff = pointAngle - moveAngle;
    
    const stretch = Math.cos(angleDiff);
    const perpSquish = Math.abs(Math.sin(angleDiff));
    
    const stretchFactor = 1 + stretch * deformAmount * 1.2;
    const squishFactor = 1 - perpSquish * deformAmount * 0.4;

    return {
      x: point.x * stretchFactor * squishFactor,
      y: point.y * stretchFactor * squishFactor,
    };
  });
}

export default function BlobCursor() {
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
  const magnetModeRef = useRef("free");
  const magnetTouchedRef = useRef(false);
  const scale = useRef(1);
  const targetScale = useRef(1);
  const time = useRef(0);
  const raf = useRef(null);
  const lastFrameTime = useRef(performance.now());

  const BASE_RADIUS = 14;
  const NUM_POINTS = 8;
  const MAGNET_ENTER = 140;
  const MAGNET_EXIT = 180;
  const EDGE_STICK_RANGE = 28;
  const SWITCH_MARGIN = 18;
  const SCALE_BOOST = 0.9;
  const STRENGTH_LERP = 0.14;

  useEffect(() => {
    setIsClient(true);

    try {
      const stored = localStorage.getItem(MAGNET_KEY);
      if (stored) magnetModeRef.current = stored;
    } catch {}

    const onMagnetMode = (e) => {
      magnetModeRef.current = e?.detail || "free";
      magnetTarget.current = null;
      magnetActive.current = false;
      magnetTouchedRef.current = false;
      strengthSmoothed.current = 0;
    };
    window.addEventListener("sky-magnet-change", onMagnetMode);
    
    mousePos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    cursorPos.current = { ...mousePos.current };
    prevMouse.current = { ...mousePos.current };

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const refreshMagnetElements = () => {
      magnetElements.current = Array.from(
        document.querySelectorAll('[data-cursor-magnetic], a, button, [role="button"]')
      );
    };

    refreshMagnetElements();
    window.addEventListener("resize", refreshMagnetElements);
    window.addEventListener("scroll", refreshMagnetElements, { passive: true });

    const animate = () => {
      const now = performance.now();
      const deltaTime = Math.min((now - lastFrameTime.current) / 1000, 0.05);
      lastFrameTime.current = now;
      
      time.current += deltaTime;
      frameCount.current += 1;

      // Calculate velocity with smooth decay
      const velDecay = Math.pow(0.88, 60 * deltaTime);
      velocity.current.x = (mousePos.current.x - prevMouse.current.x) * 0.85 + velocity.current.x * velDecay;
      velocity.current.y = (mousePos.current.y - prevMouse.current.y) * 0.85 + velocity.current.y * velDecay;
      prevMouse.current = { ...mousePos.current };

      let targetX = mousePos.current.x;
      let targetY = mousePos.current.y;
      let targetStrength = 0;

      if (frameCount.current % 30 === 0) {
        magnetElements.current = Array.from(
          document.querySelectorAll('[data-cursor-magnetic], a, button, [role="button"]')
        );
      }

      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const mode = magnetModeRef.current || "free";

      // Magnetic logic
      if (mode !== "off") {
        const currentTarget = magnetTarget.current;
        if (currentTarget) {
          const rect = currentTarget.getBoundingClientRect();
          const { dist, inside } = pointRectDistance(mx, my, rect);
          if (!inside && dist > MAGNET_EXIT) {
            magnetTarget.current = null;
            magnetActive.current = false;
            magnetTouchedRef.current = false;
          }
          if (inside && mode === "free") magnetTouchedRef.current = true;
        }

        const findBestCandidate = () => {
          let bestEl = null, bestDist = Infinity;
          for (const el of magnetElements.current) {
            if (!el || el === document.documentElement || el === document.body) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) continue;
            if (rect.bottom < -MAGNET_ENTER || rect.top > window.innerHeight + MAGNET_ENTER) continue;
            if (rect.right < -MAGNET_ENTER || rect.left > window.innerWidth + MAGNET_ENTER) continue;
            const { dist } = pointRectDistance(mx, my, rect);
            if (dist < bestDist) { bestDist = dist; bestEl = el; }
          }
          return { bestEl, bestDist };
        };

        if (!magnetTarget.current && magnetElements.current.length) {
          const { bestEl, bestDist } = findBestCandidate();
          if (bestEl && bestDist < MAGNET_ENTER) {
            magnetTarget.current = bestEl;
            magnetActive.current = true;
          }
        } else if (magnetTarget.current && magnetElements.current.length && frameCount.current % 6 === 0) {
          const currentRect = magnetTarget.current.getBoundingClientRect();
          const { dist: currentDist, inside: currentInside } = pointRectDistance(mx, my, currentRect);
          const { bestEl, bestDist } = findBestCandidate();
          if (!(mode === "free" && (currentInside || magnetTouchedRef.current)) &&
              bestEl && bestEl !== magnetTarget.current && bestDist < MAGNET_ENTER &&
              (currentDist > 6 || !currentInside) && bestDist + SWITCH_MARGIN < currentDist) {
            magnetTarget.current = bestEl;
            magnetActive.current = true;
            magnetTouchedRef.current = false;
          }
        }

        const activeTarget = magnetTarget.current;
        if (activeTarget) {
          const rect = activeTarget.getBoundingClientRect();
          const { cx, cy } = rectInfo(rect);
          const { dist, inside } = pointRectDistance(mx, my, rect);

          if (mode === "field") {
            targetStrength = 1 - smoothstep(0, MAGNET_ENTER, dist);
            const perimeter = closestPointOnPerimeter(mx, my, rect);
            const edgeDistInside = inside ? minEdgeDistanceInside(mx, my, rect) : 0;
            const edgeProximity = inside ? (1 - smoothstep(0, EDGE_STICK_RANGE, edgeDistInside)) : 1;
            const anchorX = lerp(cx, perimeter.x, inside ? edgeProximity : 1);
            const anchorY = lerp(cy, perimeter.y, inside ? edgeProximity : 1);
            targetX += (anchorX - mx) * targetStrength * 0.9;
            targetY += (anchorY - my) * targetStrength * 0.9;
          } else {
            const baseStrength = 1 - smoothstep(0, MAGNET_ENTER, dist);
            if (!inside && !magnetTouchedRef.current) {
              targetStrength = baseStrength;
              const { closestX, closestY } = pointRectDistance(mx, my, rect);
              targetX += (closestX - mx) * targetStrength * 0.95;
              targetY += (closestY - my) * targetStrength * 0.95;
            } else {
              targetStrength = 1;
            }
          }

          if (!inside && dist > MAGNET_EXIT) {
            magnetTarget.current = null;
            magnetActive.current = false;
            targetStrength = 0;
          }
        }
      }

      const baseLerp = 60 * deltaTime;
      strengthSmoothed.current += (targetStrength - strengthSmoothed.current) * STRENGTH_LERP * baseLerp;
      targetScale.current = 1 + SCALE_BOOST * strengthSmoothed.current;

      const nextMag = strengthSmoothed.current > 0.10;
      if (nextMag !== isMagneticRef.current) {
        isMagneticRef.current = nextMag;
        setIsMagnetic(nextMag);
      }

      // Cursor position - instant for normal, lerp for magnetic
      if (strengthSmoothed.current > 0.1) {
        const magnetLerp = Math.min(0.25 * baseLerp, 1);
        cursorPos.current.x += (targetX - cursorPos.current.x) * magnetLerp;
        cursorPos.current.y += (targetY - cursorPos.current.y) * magnetLerp;
      } else {
        cursorPos.current.x = targetX;
        cursorPos.current.y = targetY;
      }
      scale.current += (targetScale.current - scale.current) * Math.min(0.12 * baseLerp, 1);

      // Generate blob with noise only when moving
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
      const noiseAmount = speed > 1 ? 2 : 0; // No noise when stationary
      
      const radius = BASE_RADIUS * scale.current;
      let points = generateCirclePoints(NUM_POINTS, radius, noiseAmount, time.current);
      points = deformPoints(points, velocity.current.x, velocity.current.y);

      const path = generateBlobPath(points);

      if (pathRef.current) pathRef.current.setAttribute('d', path);
      if (glowRef.current) glowRef.current.setAttribute('d', path);
      if (svgRef.current) {
        svgRef.current.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`;
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
      className="fluid-cursor blob-cursor"
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
        <filter id="blob-cursor-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path
        ref={glowRef}
        d="M14,0 A14,14 0 1,1 -14,0 A14,14 0 1,1 14,0"
        fill="var(--sky-accent, #b08d57)"
        opacity={isMagnetic ? 0.5 : 0.25}
        filter="url(#blob-cursor-glow)"
      />
      
      <path
        ref={pathRef}
        d="M14,0 A14,14 0 1,1 -14,0 A14,14 0 1,1 14,0"
        fill="var(--sky-accent, #b08d57)"
        opacity={isMagnetic ? 1 : 0.85}
      />
    </svg>
  );
}

