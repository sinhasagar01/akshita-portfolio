"use client";

import { useEffect, ReactNode } from "react";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { ScrollTrigger } from "@/lib/gsap";

export default function GSAPProvider({ children }: { children: ReactNode }) {
  const lenis = useLenis();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!lenis || prefersReduced) return;

    const update = () => ScrollTrigger.update();
    lenis.on("scroll", update);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", update);
    };
  }, [lenis, prefersReduced]);

  return <>{children}</>;
}
