"use client";

import { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { ReactLenis } from "lenis/react";

export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, autoRaf: true }}>
      {children}
    </ReactLenis>
  );
}
