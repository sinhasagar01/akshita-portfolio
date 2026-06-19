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
      initial={prefersReduced ? false : { opacity: 0, y: 14 }}
      animate={
        prefersReduced ? false : isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
      }
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
