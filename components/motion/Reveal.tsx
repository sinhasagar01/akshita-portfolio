"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  /** Accepted for call-site compatibility. Reveal is used only for above-the-fold hero
   *  content, so it animates on mount rather than on scroll — these are ignored. */
  once?: boolean;
  amount?: number | "some" | "all";
  className?: string;
};

/**
 * A mount entrance for above-the-fold hero content. Ships VISIBLE in SSR (opacity:1,
 * only a translateY offset) so the content — including the home page's largest-
 * contentful text — paints at FCP instead of waiting on hydration, and no-JS visitors
 * see it. The old version shipped opacity:0 and revealed after hydration, which gated
 * LCP by ~1.8s. Only the slide is animated; opacity is never 0. Reduced motion rests.
 */
export default function Reveal({ children, delay = 0, className }: Props) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? { y: 0 } : { y: 14 }}
      animate={{ y: 0 }}
      transition={
        prefersReduced ? { duration: 0 } : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
