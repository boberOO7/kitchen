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
  return {
    dist: Math.hypot(x - closestX, y - closestY),
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
  if (!inside) return { x: clamp(x, left, right), y: clamp(y, top, bottom) };
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

// Ramer-Douglas-Peucker algorithm
function simplifyPath(points, epsilon = 2) {
  if (points.length < 3) return points;
  let maxDist = 0, maxIndex = 0;
  const first = points[0], last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) { maxDist = dist; maxIndex = i; }
  }
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPath(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x, dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;
  if (lineLengthSq === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq));
  return Math.hypot(point.x - (lineStart.x + t * dx), point.y - (lineStart.y + t * dy));
}

// Chaikin smoothing
function chaikinSmooth(points, iterations = 2) {
  if (points.length < 3) return points;
  let result = points;
  for (let iter = 0; iter < iterations; iter++) {
    const smoothed = [result[0]];
    for (let i = 0; i < result.length - 1; i++) {
      const p0 = result[i], p1 = result[i + 1];
      smoothed.push({ x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 });
      smoothed.push({ x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 });
    }
    smoothed.push(result[result.length - 1]);
    result = smoothed;
  }
  return result;
}

// Catmull-Rom spline path
function generateTrailPath(points) {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 4;
    const cp1x = p1.x + (p2.x - p0.x) / tension;
    const cp1y = p1.y + (p2.y - p0.y) / tension;
    const cp2x = p2.x - (p3.x - p1.x) / tension;
    const cp2y = p2.y - (p3.y - p1.y) / tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const CURSOR_CONTRAST_KEY = "sky-cursor-contrast";

export default function TrailCursor() {
  const containerRef = useRef(null);
  const trailRef = useRef(null);
  const headRef = useRef(null);
  const glowRef = useRef(null);
  const outlineRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [contrastMode, setContrastMode] = useState(false); // false = blend mode, true = outline

  const MAGNET_KEY = "sky-magnet";

  const mousePos = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const trailHistory = useRef([]);
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
  const raf = useRef(null);
  const lastFrameTime = useRef(performance.now());
  const time = useRef(0);

  const TRAIL_DURATION = 300;
  const TRAIL_SAMPLE_INTERVAL = 12;
  const HEAD_RADIUS = 12;
  const MAX_TRAIL_WIDTH = 22;
  const MIN_TRAIL_WIDTH = 4;
  const WAVE_AMPLITUDE = 1.5;
  const WAVE_FREQUENCY = 0.15;
  const MAGNET_ENTER = 140;
  const MAGNET_EXIT = 180;
  const EDGE_STICK_RANGE = 28;
  const SWITCH_MARGIN = 18;
  const SCALE_BOOST = 0.5;
  const STRENGTH_LERP = 0.14;

  useEffect(() => {
    setIsClient(true);

    try {
      const stored = localStorage.getItem(MAGNET_KEY);
      if (stored) magnetModeRef.current = stored;
      const storedContrast = localStorage.getItem(CURSOR_CONTRAST_KEY);
      if (storedContrast !== null) setContrastMode(storedContrast === "true");
    } catch {}

    const onMagnetMode = (e) => {
      magnetModeRef.current = e?.detail || "free";
      magnetTarget.current = null;
      magnetActive.current = false;
      magnetTouchedRef.current = false;
      strengthSmoothed.current = 0;
    };
    window.addEventListener("sky-magnet-change", onMagnetMode);

    const onContrastChange = (e) => {
      setContrastMode(e?.detail ?? false);
    };
    window.addEventListener("sky-cursor-contrast-change", onContrastChange);

    const initX = window.innerWidth / 2;
    const initY = window.innerHeight / 2;
    mousePos.current = { x: initX, y: initY };
    cursorPos.current = { x: initX, y: initY };

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

    let lastSampleTime = 0;

    const animate = () => {
      const now = performance.now();
      const deltaTime = Math.min((now - lastFrameTime.current) / 1000, 0.05);
      lastFrameTime.current = now;
      time.current += deltaTime;
      frameCount.current += 1;

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

      if (strengthSmoothed.current > 0.1) {
        const magnetLerp = Math.min(0.25 * baseLerp, 1);
        cursorPos.current.x += (targetX - cursorPos.current.x) * magnetLerp;
        cursorPos.current.y += (targetY - cursorPos.current.y) * magnetLerp;
      } else {
        cursorPos.current.x = targetX;
        cursorPos.current.y = targetY;
      }
      scale.current += (targetScale.current - scale.current) * Math.min(0.15 * baseLerp, 1);

      // Trail history
      if (now - lastSampleTime >= TRAIL_SAMPLE_INTERVAL) {
        const lastPoint = trailHistory.current[trailHistory.current.length - 1];
        const dx = lastPoint ? cursorPos.current.x - lastPoint.x : 10;
        const dy = lastPoint ? cursorPos.current.y - lastPoint.y : 10;
        if (Math.sqrt(dx * dx + dy * dy) > 1.5 || !lastPoint) {
          trailHistory.current.push({ x: cursorPos.current.x, y: cursorPos.current.y, time: now });
          lastSampleTime = now;
        }
      }

      const cutoffTime = now - TRAIL_DURATION;
      while (trailHistory.current.length > 0 && trailHistory.current[0].time < cutoffTime) {
        trailHistory.current.shift();
      }

      // Render trail
      const rawTrail = trailHistory.current;
      if (rawTrail.length >= 3 && trailRef.current) {
        const simplified = simplifyPath(rawTrail.map(p => ({ x: p.x, y: p.y, time: p.time })), 1.5);
        const smoothedCenter = chaikinSmooth(simplified, 2);
        
        const leftEdge = [], rightEdge = [];
        let cumulativeDistance = 0;
        
        for (let i = 0; i < smoothedCenter.length; i++) {
          const p = smoothedCenter[i];
          
          let closestOriginal = rawTrail[0];
          let minDistSq = Infinity;
          for (const orig of rawTrail) {
            const dSq = (orig.x - p.x) ** 2 + (orig.y - p.y) ** 2;
            if (dSq < minDistSq) { minDistSq = dSq; closestOriginal = orig; }
          }
          
          const age = (now - closestOriginal.time) / TRAIL_DURATION;
          const easedAge = age * age * (3 - 2 * age);
          const baseWidth = lerp(MAX_TRAIL_WIDTH, MIN_TRAIL_WIDTH, easedAge);
          const wavePhase = cumulativeDistance * WAVE_FREQUENCY + time.current * 2;
          const wave = Math.sin(wavePhase) * WAVE_AMPLITUDE * (1 - age);
          const width = Math.max(MIN_TRAIL_WIDTH, baseWidth + wave);
          
          let nx = 0, ny = 1;
          if (i < smoothedCenter.length - 1 && i > 0) {
            const prev = smoothedCenter[i - 1], next = smoothedCenter[i + 1];
            const dx = next.x - prev.x, dy = next.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            nx = -dy / len; ny = dx / len;
            cumulativeDistance += Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
          } else if (i < smoothedCenter.length - 1) {
            const next = smoothedCenter[i + 1];
            const dx = next.x - p.x, dy = next.y - p.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            nx = -dy / len; ny = dx / len;
          } else if (i > 0) {
            const prev = smoothedCenter[i - 1];
            const dx = p.x - prev.x, dy = p.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            nx = -dy / len; ny = dx / len;
            cumulativeDistance += Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
          }
          
          leftEdge.push({ x: p.x + nx * width / 2, y: p.y + ny * width / 2 });
          rightEdge.push({ x: p.x - nx * width / 2, y: p.y - ny * width / 2 });
        }
        
        if (leftEdge.length >= 2) {
          const tailLeft = leftEdge[0], tailRight = rightEdge[0];
          const headLeft = leftEdge[leftEdge.length - 1], headRight = rightEdge[rightEdge.length - 1];
          const tailCenter = smoothedCenter[0];
          const tailRadius = Math.max(2, Math.sqrt((tailLeft.x - tailCenter.x) ** 2 + (tailLeft.y - tailCenter.y) ** 2));
          
          const rightEdgePath = generateTrailPath(rightEdge);
          const leftReversed = [...leftEdge].reverse();
          const leftEdgePath = generateTrailPath(leftReversed);
          
          const tailCapArc = `M ${tailLeft.x} ${tailLeft.y} A ${tailRadius} ${tailRadius} 0 0 1 ${tailRight.x} ${tailRight.y}`;
          const fullPath = tailCapArc + 
            " " + rightEdgePath.replace(/^M [^ ]+ [^ ]+/, "L " + tailRight.x + " " + tailRight.y) +
            " L " + headLeft.x + " " + headLeft.y +
            " " + leftEdgePath.replace(/^M [^ ]+ [^ ]+/, "") + " Z";
          
          trailRef.current.setAttribute("d", fullPath);
        } else {
          trailRef.current.setAttribute("d", "");
        }
      } else if (trailRef.current) {
        trailRef.current.setAttribute("d", "");
      }

      // Render head
      const headRadius = HEAD_RADIUS * scale.current;
      if (headRef.current) {
        headRef.current.setAttribute("cx", cursorPos.current.x);
        headRef.current.setAttribute("cy", cursorPos.current.y);
        headRef.current.setAttribute("r", headRadius);
      }
      if (glowRef.current) {
        glowRef.current.setAttribute("cx", cursorPos.current.x);
        glowRef.current.setAttribute("cy", cursorPos.current.y);
        glowRef.current.setAttribute("r", headRadius + 4);
      }
      if (outlineRef.current) {
        outlineRef.current.setAttribute("cx", cursorPos.current.x);
        outlineRef.current.setAttribute("cy", cursorPos.current.y);
        outlineRef.current.setAttribute("r", headRadius + 2);
      }

      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", refreshMagnetElements);
      window.removeEventListener("scroll", refreshMagnetElements);
      window.removeEventListener("sky-magnet-change", onMagnetMode);
      window.removeEventListener("sky-cursor-contrast-change", onContrastChange);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!isClient) return null;

  return (
    <svg
      ref={containerRef}
      className="fluid-cursor trail-cursor"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 99999,
        overflow: "visible",
        // Use blend mode only when contrast mode is OFF
        mixBlendMode: contrastMode ? 'normal' : 'difference',
      }}
    >
      <defs>
        <filter id="trail-cursor-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Trail - with contrast stroke only when contrast mode is ON */}
      <path 
        ref={trailRef} 
        d="" 
        fill="var(--sky-accent)" 
        opacity={0.5} 
        stroke={contrastMode ? "var(--sky-bg)" : "none"} 
        strokeWidth={contrastMode ? "2" : "0"} 
        strokeOpacity="0.3" 
      />

      {/* Contrast outline for head - only visible when contrast mode is ON */}
      {contrastMode && (
        <circle
          ref={outlineRef}
          cx={0} cy={0} r={HEAD_RADIUS + 2}
          fill="none"
          stroke="var(--sky-bg)"
          strokeWidth="2"
          opacity={0.4}
          filter="url(#trail-cursor-glow)"
        />
      )}

      <circle
        ref={glowRef}
        cx={0} cy={0} r={HEAD_RADIUS + 4}
        fill="var(--sky-accent)"
        opacity={isMagnetic ? 0.5 : 0.25}
        filter="url(#trail-cursor-glow)"
      />

      <circle
        ref={headRef}
        cx={0} cy={0} r={HEAD_RADIUS}
        fill="var(--sky-accent)"
        opacity={isMagnetic ? 1 : 0.85}
      />
    </svg>
  );
}

