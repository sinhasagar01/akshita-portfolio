"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const WORD_MAP: Record<string, string> = {
  "Product Design": "vision",
  "UX Design": "experience",
  "UI Design": "craft",
  "Interaction Design": "flow",
  "Design Systems": "scale",
  "UX Research": "insight",
  "Journey Mapping": "journeys",
  "Usability Testing": "proof",
  "Split Testing": "signal",
  "Wireframing": "clarity",
  "Rapid Prototyping": "speed",
  "Information Architecture": "structure",
  "Figma": "canvas",
  "Sketch": "lines",
  "Adobe XD": "layers",
  "Framer": "motion",
  "Miro": "maps",
  "Azure DevOps": "ship",
};

type Category = { category: string; items: string[] };

export default function SkillsBody({ categories }: { categories: Category[] }) {
  const [activeWord, setActiveWord] = useState("design");
  const [hovering, setHovering] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <div className="mt-8 sm:mt-[52px] relative" style={{ minHeight: 200 }}>
      {/* Word layer — absolute centered, z-0, pointer-events none */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <motion.div
          animate={{ opacity: hovering && prefersReduced !== true ? 0.78 : 0.28 }}
          transition={{ duration: prefersReduced === true ? 0 : 0.55, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 560,
            height: 280,
            borderRadius: "50%",
            background: "radial-gradient(closest-side,rgba(181,97,60,.17),transparent 70%)",
            filter: "blur(42px)",
          }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={activeWord}
            initial={prefersReduced === true ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced === true ? {} : { opacity: 0, scale: 0.9 }}
            transition={
              prefersReduced === true
                ? { duration: 0 }
                : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-[92px] sm:text-[150px]"
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 400,
              lineHeight: 1,
              color: "rgba(181,97,60,.11)",
              textShadow: "0 0 34px rgba(181,97,60,.14)",
              whiteSpace: "nowrap",
              position: "relative",
            }}
          >
            {activeWord}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Rows — above word layer, onMouseLeave resets hovering */}
      <div
        className="flex flex-col gap-10 relative"
        style={{ zIndex: 2 }}
        onMouseLeave={() => setHovering(false)}
      >
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8 reveal-card"
          >
            <div className="md:w-28 md:shrink-0">
              <p
                className="text-[11px] tracking-[.14em] uppercase leading-none"
                style={{ color: "var(--color-accent-500)" }}
              >
                {cat.category}
              </p>
            </div>
            <ul className="flex flex-wrap gap-[9px] list-none p-0 m-0">
              {cat.items.map((item) => (
                <li key={item}>
                  <span
                    className="skill-pill"
                    onMouseEnter={() => {
                      setActiveWord(WORD_MAP[item] ?? activeWord);
                      setHovering(true);
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
