"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useAnimationControls } from "motion/react";
import type { HeroCover as HeroCoverData } from "@/lib/case-studies/types";
import DeviceImage from "../DeviceImage";
import GlowWord from "../GlowWord";

/* "Rise / calm" — one-time mount entrance (docs/case-study-page/hero-motion-spec.md).
   Phones rise from a soft blur with a front-leads parallax; copy resolves in sync.
   Every "from" value is an offset on a wrapper that composes over each element's
   existing resting transform — the static composition is unchanged. Hero only. */

const EXPO = [0.16, 1, 0.3, 1] as const; // easeOutExpo — phones
const CUBIC = [0.33, 1, 0.68, 1] as const; // easeOutCubic — text/stack
const BACK = [0.34, 1.56, 0.64, 1] as const; // easeOutBack — chip pop

export default function HeroCover({ data }: { data: HeroCoverData }) {
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  // Detect viewport after mount (default desktop, so SSR and first client render
  // match — no hydration mismatch).
  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 1023px)").matches);
    setReady(true);
  }, []);

  // Trigger once on mount. set("hidden") snaps to the resolved (mobile/desktop)
  // offsets before playing, so the gentler mobile rise starts from the right place.
  useEffect(() => {
    if (!ready) return;
    if (reduce) {
      controls.set("show"); // reduced motion → resting state instantly
      return;
    }
    controls.set("hidden");
    controls.start("show");
  }, [ready, reduce, controls]);

  const m = isMobile;
  const tr = (o: object) => (reduce ? { duration: 0 } : o);
  const fadeUp = (delay: number) => ({
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: tr({ delay, duration: 0.65, ease: CUBIC }) },
  });

  const stackV = {
    hidden: { opacity: 0, filter: m ? "blur(4px)" : "blur(8px)" },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      transition: tr({
        opacity: { duration: m ? 0.42 : 0.49, ease: CUBIC },
        filter: { duration: m ? 0.6 : 0.875, ease: CUBIC },
      }),
    },
  };
  const frontV = {
    hidden: { y: m ? 32 : 56, rotate: m ? 0 : -2, scale: m ? 0.96 : 0.94 },
    show: { y: 0, rotate: 0, scale: 1, transition: tr({ delay: 0.09, duration: m ? 1.0 : 1.435, ease: EXPO }) },
  };
  const backV = {
    hidden: { x: m ? 0 : 130, y: m ? 32 : 64, rotate: m ? 0 : 6, scale: m ? 0.96 : 0.93 },
    show: { x: 0, y: 0, rotate: 0, scale: 1, transition: tr({ delay: 0.09, duration: m ? 1.1 : 1.57, ease: EXPO }) },
  };
  const glowV = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: tr({ delay: 0.175, duration: 1.225, ease: CUBIC }) },
  };
  const titleV = {
    hidden: { y: "108%" },
    show: { y: 0, transition: tr({ delay: 0.175, duration: 0.7, ease: CUBIC }) },
  };
  const chipV = {
    hidden: { opacity: 0, y: 14, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: tr({ delay: 0.77, duration: 0.65, ease: BACK }) },
  };

  const mp = { initial: "hidden" as const, animate: controls };

  return (
    <div className="relative grid items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14">
      {/* "crest" watermark — relocated here (from section.glow) so its fade-in is part
          of the hero entrance. calc() reproduces the section-level top:-12px / right:34px
          by compensating the section's py-section top padding and 3.25rem inline padding.
          Sits behind the content; clipped at the card edge by the section's overflow. */}
      <motion.span
        aria-hidden="true"
        {...mp}
        variants={glowV}
        className="pointer-events-none absolute -z-10 hidden select-none font-display italic leading-[0.8] tracking-[-0.02em] lg:block"
        style={{
          color: "color-mix(in oklch, var(--color-accent-500) 10%, transparent)",
          top: "calc(-1 * clamp(3.5rem, 7vw, 6rem) - 12px)",
          right: "calc(34px - 3.25rem)",
          fontSize: "clamp(7rem, 15vw, 13.75rem)",
        }}
      >
        crest
      </motion.span>

      {/* Text column */}
      <div>
        <motion.div {...mp} variants={fadeUp(0.09)} className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-[34px] bg-accent-500" />
          <span className="text-eyebrow tracking-[0.2em] uppercase font-semibold text-text-subtle">
            Case study · Product design
          </span>
        </motion.div>

        <h1 className="font-display font-normal text-6xl text-ink-950 leading-[1] tracking-tight mt-5">
          <span className="block overflow-hidden">
            <motion.span {...mp} variants={titleV} className="block">
              {data.title}
            </motion.span>
          </span>
        </h1>

        <motion.h2
          {...mp}
          variants={fadeUp(0.385)}
          className="font-display italic text-[34px] text-accent-600 leading-[1.15] mt-3"
        >
          {data.thesis}
        </motion.h2>

        <motion.p {...mp} variants={fadeUp(0.56)} className="text-lg text-ink-600 leading-normal mt-6 max-w-[42ch]">
          {data.position}
        </motion.p>

        {data.ratingChip && (
          <motion.p
            {...mp}
            variants={chipV}
            className="inline-flex items-center gap-2.5 rounded-full border bg-cream-200 px-4 py-2 text-[0.9rem] font-semibold text-ink-950 mt-6"
            style={{ borderColor: "color-mix(in oklch, var(--color-ink-950) 12%, transparent)" }}
          >
            <span className="font-bold text-accent-500">{data.ratingChip.stat}</span>
            {data.ratingChip.rest}
          </motion.p>
        )}

        <motion.dl
          {...mp}
          variants={fadeUp(0.7)}
          className="grid grid-cols-2 gap-x-10 gap-y-5 mt-9 max-w-[470px]"
        >
          {data.meta.map((item) => (
            <div key={item.label}>
              <dt className="text-eyebrow tracking-[0.16em] uppercase font-semibold text-text-subtle">
                {item.label}
              </dt>
              <dd className="text-[1rem] font-semibold text-ink-950 mt-1.5">{item.value}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      {/* Device cluster — stack fades up out of blur; phones rise with parallax. The
          entrance wrappers compose over each DeviceImage's resting transform. */}
      <motion.div
        {...mp}
        variants={stackV}
        className="relative flex items-center justify-center gap-4 lg:min-h-[560px] lg:gap-0"
      >
        {data.glow && <GlowWord word={data.glow} />}
        <motion.div {...mp} variants={backV} className="lg:absolute">
          <DeviceImage image={data.devices[0]} />
        </motion.div>
        <motion.div {...mp} variants={frontV}>
          <DeviceImage image={data.devices[1]} />
        </motion.div>
      </motion.div>
    </div>
  );
}
