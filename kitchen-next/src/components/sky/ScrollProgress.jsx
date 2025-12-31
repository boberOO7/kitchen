"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export default function ScrollProgress() {
  const pathname = usePathname();
  const [p, setP] = useState(0);

  const enabled = useMemo(() => pathname === "/", [pathname]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = doc.scrollHeight || 0;
      const clientHeight = doc.clientHeight || window.innerHeight || 0;
      const max = Math.max(1, scrollHeight - clientHeight);
      setP(clamp01(scrollTop / max));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px">
      <div
        className="h-full origin-left bg-[var(--sky-accent)] opacity-35"
        style={{
          transform: `scaleX(${p})`,
          transition: "transform 80ms linear",
        }}
      />
    </div>
  );
}


