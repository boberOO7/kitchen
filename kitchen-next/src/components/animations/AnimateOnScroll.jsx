"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/**
 * AnimateOnScroll — Wrapper component for scroll-triggered animations
 * 
 * @param {string} variant - Animation type: "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "scale" | "blur"
 * @param {number} delay - Delay in seconds before animation starts
 * @param {number} duration - Animation duration in seconds
 * @param {boolean} once - If true, animation only plays once
 * @param {number} threshold - How much of element must be visible (0-1)
 * @param {string} className - Additional CSS classes
 */

const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

export default function AnimateOnScroll({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  once = true,
  threshold = 0.2,
  className = "",
  as = "div",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const MotionComponent = motion[as] || motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[variant] || variants.fadeUp}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1], // Custom easing for luxury feel
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * Stagger container — For staggered children animations
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = "",
  once = true,
  threshold = 0.2,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger item — Child of StaggerContainer
 */
export function StaggerItem({
  children,
  variant = "fadeUp",
  duration = 0.5,
  className = "",
}) {
  return (
    <motion.div
      variants={variants[variant] || variants.fadeUp}
      transition={{
        duration,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

