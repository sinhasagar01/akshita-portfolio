"use client";

import { useLenis } from "lenis/react";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";

export default function FooterBackToTop() {
  const lenis       = useLenis();
  const smoothScroll = useSmoothScroll();

  function handleClick() {
    if (smoothScroll) {
      smoothScroll.scrollToTarget(0, { duration: 1.2 });
    } else if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs text-[--color-text-secondary] hover:text-[--color-accent-500] transition-colors duration-[--duration-base] cursor-pointer bg-transparent border-0 p-0"
    >
      Back to top ↑
    </button>
  );
}
