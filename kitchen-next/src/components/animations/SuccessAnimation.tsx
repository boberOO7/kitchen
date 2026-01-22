"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

// Luxury color palette for particles
const PARTICLE_COLORS = [
  "#C9A962", // Muted gold
  "#B08D57", // Soft bronze
  "#D4C4A8", // Warm beige
  "#E8DCC8", // Cream
  "#A69060", // Dark gold
];

// Generate particles with random properties
function generateParticles(count = 24) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100, // -100 to 100
    y: -(Math.random() * 120 + 40), // -40 to -160 (upward)
    size: Math.random() * 4 + 2, // 2-6px
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    delay: Math.random() * 0.4, // 0-0.4s delay
    duration: Math.random() * 1.2 + 1.5, // 1.5-2.7s
    rotation: Math.random() * 360,
  }));
}

// Animated checkmark SVG path
function AnimatedCheckmark() {
  return (
    <svg
      className="h-24 w-24 sm:h-32 sm:w-32"
      viewBox="0 0 100 100"
      fill="none"
    >
      {/* Circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        stroke="#C9A962"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.8, ease: "easeInOut" },
          opacity: { duration: 0.2 },
        }}
      />
      
      {/* Checkmark */}
      <motion.path
        d="M30 52 L44 66 L70 38"
        stroke="#C9A962"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.5, ease: "easeOut", delay: 0.6 },
          opacity: { duration: 0.1, delay: 0.6 },
        }}
      />
    </svg>
  );
}

// Single particle component
function Particle({ x, y, size, color, delay, duration, rotation }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{
        x: 0,
        y: 0,
        opacity: 0,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        x: x,
        y: y,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.5],
        rotate: rotation,
      }}
      transition={{
        duration: duration,
        delay: delay + 0.8, // Start after checkmark begins
        ease: "easeOut",
      }}
    />
  );
}

// Elegant sparkle (diamond shape)
function Sparkle({ x, y, delay, size = 8 }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        x: x,
        y: y,
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 1.5,
        delay: delay + 1,
        ease: "easeOut",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#C9A962">
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
      </svg>
    </motion.div>
  );
}

export default function SuccessAnimation({ orderId, onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Memoize particles to prevent regeneration on re-renders
  const particles = useMemo(() => generateParticles(24), []);
  
  // Sparkles at fixed positions
  const sparkles = useMemo(() => [
    { x: -80, y: -60, delay: 0, size: 10 },
    { x: 90, y: -40, delay: 0.2, size: 8 },
    { x: -60, y: 40, delay: 0.15, size: 6 },
    { x: 70, y: 60, delay: 0.3, size: 7 },
    { x: 0, y: -90, delay: 0.1, size: 9 },
  ], []);

  useEffect(() => {
    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Handle exit animation complete
  const handleExitComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--sky-bg)]/98 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        if (!isVisible) {
          handleExitComplete();
        }
      }}
    >
      {/* Particle container */}
      <div className="relative">
        {/* Particles */}
        {particles.map((particle) => (
          <Particle key={particle.id} {...particle} />
        ))}

        {/* Sparkles */}
        {sparkles.map((sparkle, i) => (
          <Sparkle key={`sparkle-${i}`} {...sparkle} />
        ))}

        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1,
          }}
        >
          <AnimatedCheckmark />
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <h2 className="text-2xl font-light tracking-[-0.02em] text-[var(--sky-fg)] sm:text-3xl">
          Замовлення оформлено
        </h2>
        <p className="mt-2 text-sm text-[var(--sky-muted)]">
          #{orderId}
        </p>
      </motion.div>

      {/* Subtle hint to continue */}
      <motion.p
        className="absolute bottom-12 text-xs text-[var(--sky-muted2)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        Зачекайте...
      </motion.p>
    </motion.div>
  );
}

