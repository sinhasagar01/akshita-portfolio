"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
};

export default function RevealSection({
  as: Tag = "section",
  id,
  className,
  children,
}: Props) {
  const ref = useRef<Element>(null);
  const prefersReduced = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: "-20% 0px" });

  // null pre-hydration → wait for scroll; true → reveal immediately; false → animate on scroll
  const revealed = prefersReduced === true || isInView;

  return (
    <Tag
      ref={ref}
      id={id}
      className={`py-section section-card reveal-panel${revealed ? " is-revealed" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Tag>
  );
}
