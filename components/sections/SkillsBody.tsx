"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ⚠ THE GLOW WORD IS CONTENT NOW, AND IT WAS AN 18-ENTRY MAP IN THIS FILE UNTIL IT MOVED.
   `WORD_MAP` keyed a skill's display name to the ghost word behind the pills. It worked and it
   could only ever describe the skills that existed when it was written — so a skill added through
   /studio produced a pill whose hover DID NOTHING, with no error and nothing to read.

   ⚠ AND TWO SUCH SKILLS WERE ALREADY LIVE. Migrating the map into `content/skills.yaml` matched 18
   of 20 entries; "Claude Design" and "Claude Code" had none, and had been hovering to silence since
   they were added. That is the defect the field fixes, found by counting rather than by looking.

   An empty glow is a DEFINED state, not a hole: the previous word stays. That is what the old
   `?? activeWord` did for an unmapped skill, kept deliberately so a half-filled category degrades
   the way it always did. */

type Skill = { name: string; glow: string };
type Category = { category: string; items: Skill[] };

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
            background: "radial-gradient(closest-side,color-mix(in oklch, var(--color-accent) 17%, transparent),transparent 70%)",
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
            /* ⚠ TEXTURE, DECLARED. This word is a 150px ghost behind the section at 11% alpha —
               it is not read, it is felt, and a 4.5 reading floor does not apply to it. The sweep
               previously excluded it by an OPACITY THRESHOLD, which was wrong twice over: it hid
               genuine low-alpha failures, and it excluded this by accident rather than by intent.

               ⚠ AND `aria-hidden` CANNOT CARRY THIS. It is already here for its own reason — a giant
               ghost word should not be announced — but the population check found 17 nodes wearing
               it, EIGHT OF THEM REAL PROSE (the work cards' hover veils) and one a whole labelled
               control. `aria-hidden` means "not announced", not "not read", and overloading it would
               have silently excluded the entire hover state from every contrast sweep. */
            data-texture="true"
            className="text-[92px] sm:text-[150px]"
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 400,
              lineHeight: 1,
              color: "color-mix(in oklch, var(--color-accent) 11%, transparent)",
              textShadow: "0 0 34px color-mix(in oklch, var(--color-accent) 14%, transparent)",
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
                className="text-[12px] tracking-[.14em] uppercase leading-none"
                style={{ color: "var(--color-accent)" }}
              >
                {cat.category}
              </p>
            </div>
            <ul className="flex flex-wrap gap-[9px] list-none p-0 m-0">
              {cat.items.map((item) => (
                <li key={item.name}>
                  <span
                    className="skill-pill"
                    onMouseEnter={() => {
                      /* Empty glow leaves the previous word — see the note at the top. */
                      setActiveWord(item.glow || activeWord);
                      setHovering(true);
                    }}
                  >
                    {item.name}
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
