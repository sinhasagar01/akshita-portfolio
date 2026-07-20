"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

type Props = {
  children: React.ReactNode;
  delay?: number;
  once?: boolean;
  amount?: number | "some" | "all";
  className?: string;
};

export default function Reveal({
  children,
  delay = 0,
  once = true,
  amount = 0.15,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      // Reduced motion resolves to an explicit VISIBLE resting state, not `false`.
      // useReducedMotion is null on SSR/first render, so the wrapper ships with the
      // hidden `initial` (opacity:0). With the old `animate={false}` the reduced-motion
      // client stopped managing the element and it stayed stuck at that hidden SSR
      // state — a blank hero. Driving to {opacity:1,y:0} with a 0s transition snaps it
      // visible instead. The non-reduced branch is unchanged.
      initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      animate={
        prefersReduced
          ? { opacity: 1, y: 0 }
          : isInView
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 14 }
      }
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
