"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollingToTopRef = useRef(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollY = window.scrollY;
      
      // If we're scrolling to top, wait until we reach the top to reset
      if (scrollingToTopRef.current) {
        if (scrollY < 10) {
          scrollingToTopRef.current = false;
        }
        return; // Don't change visibility while scrolling to top
      }
      
      // Normal behavior: show button when scrolled down 400px
      setIsVisible(scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    // Mark that we're scrolling to top and hide immediately
    scrollingToTopRef.current = true;
    setIsVisible(false);
    
    const duration = 800;
    const start = window.scrollY;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      window.scrollTo(0, start * (1 - easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
      // Note: scrollingToTopRef is reset by the scroll handler when scrollY < 10
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={scrollToTop}
          data-cursor-magnetic
          className="fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center border border-[var(--sky-border)] bg-[var(--sky-surface)] text-[var(--sky-fg)] shadow-lg backdrop-blur-sm transition-colors hover:bg-[var(--sky-accent)] hover:text-[var(--sky-accent-fg)] hover:shadow-xl"
          style={{ borderRadius: 2 }}
          aria-label="Back to top"
          title="Повернутися до початку"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

