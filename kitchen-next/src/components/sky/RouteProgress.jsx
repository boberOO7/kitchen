"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLoadingRef = useRef(false);
  const timersRef = useRef([]);
  const prevPathRef = useRef(pathname);

  // Clear all timers
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Start loading animation
  const startLoading = () => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    clearTimers();
    
    setIsVisible(true);
    setProgress(0);
    
    // Animate progress
    timersRef.current.push(setTimeout(() => setProgress(25), 50));
    timersRef.current.push(setTimeout(() => setProgress(50), 200));
    timersRef.current.push(setTimeout(() => setProgress(70), 400));
    timersRef.current.push(setTimeout(() => setProgress(85), 800));
  };

  // Complete loading animation
  const completeLoading = () => {
    if (!isLoadingRef.current) return;
    
    clearTimers();
    isLoadingRef.current = false;
    
    // Jump to 100%
    setProgress(100);
    
    // Hide after animation
    timersRef.current.push(
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300)
    );
  };

  // Watch for route changes to complete loading
  useEffect(() => {
    // Skip initial mount
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      completeLoading();
    }
  }, [pathname, searchParams]);

  // Listen for navigation start via link clicks
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      
      const href = link.getAttribute("href");
      if (!href) return;
      
      // Skip external links, anchors, tel, mailto
      if (
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:")
      ) {
        return;
      }
      
      // Skip if same route
      const targetPath = href.split("?")[0];
      if (targetPath === pathname) return;
      
      startLoading();
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearTimers();
    };
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9998] h-[3px] overflow-hidden">
      <div
        className="h-full bg-[var(--sky-accent)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 
            ? "width 150ms ease-out" 
            : "width 400ms cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 0 10px var(--sky-accent), 0 0 5px var(--sky-accent)",
        }}
      />
    </div>
  );
}
