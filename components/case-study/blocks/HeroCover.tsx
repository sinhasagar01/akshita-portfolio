"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useAnimationControls } from "motion/react";
import type { HeroCover as HeroCoverData } from "@/lib/case-studies/types";
import DeviceImage, { isWideFrame } from "../DeviceImage";
import GlowWord from "../GlowWord";
import HeroAura from "../HeroAura";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

/* Hero mount entrance, once on mount. The two phones do a stacked-card opening, a
   squared-up deck that fans open to the resting tilt, while the copy resolves up in
   sync. Every "from" value is an offset on a wrapper that composes over each element's
   existing resting transform, so the static composition is unchanged. Hero only. */

const EXPO = [0.16, 1, 0.3, 1] as const; // easeOutExpo — phones
const CUBIC = [0.33, 1, 0.68, 1] as const; // easeOutCubic — text/stack
const BACK = [0.34, 1.56, 0.64, 1] as const; // easeOutBack — chip pop

export default function HeroCover({
  data,
  editable = false,
  blockIndex,
  heroGlow,
}: {
  data: HeroCoverData;
  /** CS-7e — studio inline canvas: make the hero device images replaceable. */
  editable?: boolean;
  blockIndex?: number;
  /** The behind-the-phones glow theme, set per study by CaseStudyView (public hero
   *  only). Absent → no aura (the studio canvas and un-themed studies). */
  heroGlow?: "pulse" | "signal";
}) {
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
  // STACKED-CARD OPENING. The pair begins squared-up and overlapping at centre (rotate 0,
  // slid toward each other), then fans open to its RESTING tilt (front +4°, back -6°). `show`
  // is the unchanged resting composition — the overlap is still composed by the layout — so
  // only the entrance differs. The fan (x + rotate) rides BACK for a light overshoot while
  // scale/y settle on EXPO; the back leads by a beat so it slips out from under the front.
  const frontV = {
    hidden: { x: m ? -28 : -44, y: m ? 8 : 10, rotate: 0, scale: 0.97 },
    show: {
      x: 0, y: 0, rotate: 4, scale: 1,
      transition: tr({
        default: { delay: 0.12, duration: m ? 0.72 : 0.85, ease: EXPO },
        x: { delay: 0.12, duration: m ? 0.72 : 0.85, ease: BACK },
        rotate: { delay: 0.12, duration: m ? 0.72 : 0.85, ease: BACK },
      }),
    },
  };
  const backV = {
    hidden: { x: m ? 28 : 44, y: m ? 6 : 8, rotate: 0, scale: 0.95 },
    show: {
      x: 0, y: 0, rotate: -6, scale: 1,
      transition: tr({
        default: { delay: 0.05, duration: m ? 0.78 : 0.9, ease: EXPO },
        x: { delay: 0.05, duration: m ? 0.78 : 0.9, ease: BACK },
        rotate: { delay: 0.05, duration: m ? 0.78 : 0.9, ease: BACK },
      }),
    },
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

  // CS-7a — under template=web the hero devices resolve to a wide (browser/MacBook)
  // frame, and the hero renders the Bold-gallery web composition (a dark band, serif
  // title + tagline + facts on one side, one wide dashboard on the other) instead of
  // the two rotated phones. `wide` is that web signal; a phone hero falls through to
  // the exact two-phone composition below, byte-identically.
  const wide = isWideFrame(data.devices[0]?.frame) || isWideFrame(data.devices[1]?.frame);

  const mp = { initial: "hidden" as const, animate: controls };
  // Every plain string in the hero is tagged for in-place editing. The watermark is
  // deliberately NOT: it is aria-hidden, pointer-events-none and select-none by
  // design, so making it clickable would mean undoing all three on the public render
  // for one decorative word. It stays in the form.
  const aff = editable ? EDIT_AFFORD : "";
  const edit = (path: string, label: string) => inlineEditProps(editable, blockIndex, path, label);

  if (wide) {
    // The single primary dashboard (device[1], the front phone in the mobile hero).
    // GUARDRAIL — device[0], the section-level lead, and data.position stay in the
    // sections data untouched; the Bold-gallery web hero is intentionally lean
    // (eyebrow, serif title, tagline, one dashboard, facts, watermark) so they are
    // simply UNRENDERED here. Switching a study back to template=mobile shows both
    // phones and the full copy again, byte-identically. The dark card + padding come
    // from SectionRenderer's web-hero branch; this block just lays out the content.
    const dashIdx = data.devices[1] ? 1 : 0;
    const dashboard = data.devices[dashIdx];
    return (
      // SINGLE centred column, exactly 100svh (the faded-peek hero): eyebrow → title →
      // script watermark behind the tagline → tagline → FACTS → the framed dashboard, which
      // is masked so it dissolves into the ground at the seam.
      <div className="relative flex flex-col items-center text-center">
        {data.eyebrow && (
          <motion.div
            {...mp}
            variants={fadeUp(0.09)}
            {...edit("eyebrow", "Edit hero eyebrow")}
            className={`text-[12px] md:text-eyebrow tracking-[0.14em] uppercase font-semibold text-on-dark-muted${aff}`}
          >
            {data.eyebrow}
          </motion.div>
        )}

        <h1 className="font-display font-normal text-[clamp(2.75rem,5vw,3.75rem)] text-accent-on-dark leading-[0.98] tracking-tight mt-4">
          <span className="block overflow-hidden">
            <motion.span
              {...mp}
              variants={titleV}
              {...edit("title", "Edit hero title")}
              className={`block${aff}`}
            >
              {data.title}
            </motion.span>
          </span>
        </h1>

        {/* Tagline with the script watermark centred behind it (re-treated from the old
            corner font-display italic watermark — an intentional published-page change). */}
        <div className="relative mt-6 flex w-full items-center justify-center">
          {data.watermark && (
            <motion.span
              aria-hidden="true"
              {...mp}
              variants={glowV}
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-script leading-[0.8] lg:block"
              style={{ color: "var(--hero-word-dark)", fontSize: "clamp(5.5rem, 11vw, 9rem)" }}
            >
              {data.watermark}
            </motion.span>
          )}
          <motion.h2
            {...mp}
            variants={fadeUp(0.385)}
            {...edit("thesis", "Edit hero thesis")}
            className={`relative z-[1] font-display italic text-[clamp(1.25rem,2.2vw,1.5rem)] text-on-dark leading-[1.35] max-w-[36ch]${aff}`}
          >
            {data.thesis}
          </motion.h2>
        </div>

        {/* Facts — a hairline grid ABOVE the visual, contained to 920px and centred. Web
            is 3 columns × 2 rows (six facts), collapsing to 2 columns below 900px. */}
        <motion.dl {...mp} variants={fadeUp(0.7)} className="hero-facts hero-facts--six mx-auto mt-[26px]">
          {data.meta.map((item, i) => (
            <div key={i}>
              <dt
                {...edit(`meta.${i}.label`, "Edit fact label")}
                className={`text-[9.5px] tracking-[0.15em] uppercase text-on-dark-quote mb-[3px]${aff}`}
              >
                {item.label}
              </dt>
              <dd
                {...edit(`meta.${i}.value`, "Edit fact value")}
                className={`text-[14px] font-medium text-on-dark leading-[1.35]${aff}`}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </motion.dl>

        {/* Visual — the framed browser dashboard, masked so it dissolves into the ground
            before the fold; the first card rides up over the faded tail (the seam). */}
        <motion.div {...mp} variants={stackV} className="hero-visual mt-[30px] flex w-full justify-center">
          <DeviceImage image={dashboard} editable={editable} blockIndex={blockIndex} editPath={`devices.${dashIdx}`} priority />
        </motion.div>
      </div>
    );
  }

  // Two-phone hero pair — flatten the specs (drop the old wide-column rotate/translate that
  // pushed a phone out of the narrow centred column) and size them down to the column; the
  // overlap and tilt are composed by the wrappers below, not by the image transforms.
  const backPhone = { ...data.devices[0], rotate: undefined, translate: undefined, width: 158 };
  const frontPhone = { ...data.devices[1], rotate: undefined, translate: undefined, width: 176 };

  return (
    // SINGLE centred column, exactly 100svh (the faded-peek hero): eyebrow → title →
    // script watermark behind the tagline → tagline → blurb → rating chip → FACTS → the
    // two phones, masked so they dissolve into the ground at the seam.
    <div className="relative flex flex-col items-center text-center">
      {data.eyebrow && (
        <motion.div {...mp} variants={fadeUp(0.09)} className="flex items-center justify-center gap-3">
          <span aria-hidden="true" className="h-[2px] w-[34px] bg-accent-500" />
          <span
            {...edit("eyebrow", "Edit hero eyebrow")}
            className={`text-[12px] md:text-eyebrow tracking-[0.2em] uppercase font-semibold text-text-subtle${aff}`}
          >
            {data.eyebrow}
          </span>
        </motion.div>
      )}

      <h1 className="font-display font-normal text-6xl text-accent-600 leading-[1] tracking-tight mt-3">
        <span className="block overflow-hidden">
          <motion.span
            {...mp}
            variants={titleV}
            {...edit("title", "Edit hero title")}
            className={`block${aff}`}
          >
            {data.title}
          </motion.span>
        </span>
      </h1>

      {/* Tagline with the script watermark centred behind it (re-treated from the old
          corner font-display italic watermark — an intentional published-page change). */}
      <div className="relative mt-3 flex w-full items-center justify-center">
        {data.watermark && (
          <motion.span
            aria-hidden="true"
            {...mp}
            variants={glowV}
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-script leading-[0.8] lg:block"
            style={{ color: "var(--hero-word-light)", fontSize: "clamp(6rem, 13vw, 11rem)" }}
          >
            {data.watermark}
          </motion.span>
        )}
        <motion.h2
          {...mp}
          variants={fadeUp(0.385)}
          {...edit("thesis", "Edit hero thesis")}
          className={`relative z-[1] font-display italic text-[34px] text-text-primary leading-[1.15]${aff}`}
        >
          {data.thesis}
        </motion.h2>
      </div>

      <motion.p
        {...mp}
        variants={fadeUp(0.56)}
        {...edit("position", "Edit hero position statement")}
        className={`text-lg text-text-secondary leading-normal mt-4 max-w-[42ch]${aff}`}
      >
        {data.position}
      </motion.p>

      {data.ratingChip && (
        <motion.p
          {...mp}
          variants={chipV}
          className="inline-flex items-center gap-2.5 rounded-full border bg-cream-200 px-4 py-2 text-[0.9rem] font-semibold text-ink-950 mt-4"
          style={{ borderColor: "color-mix(in oklch, var(--color-ink-950) 12%, transparent)" }}
        >
          <span
            {...edit("ratingChip.stat", "Edit rating stat")}
            className={`font-bold text-accent-500${aff}`}
          >
            {data.ratingChip.stat}
          </span>
          {/* Wrapped ONLY when editable: on the public site this stays a bare text
              node, so the rendered markup is unchanged. */}
          {editable ? (
            <span {...edit("ratingChip.rest", "Edit rating chip text")} className={aff}>
              {data.ratingChip.rest}
            </span>
          ) : (
            data.ratingChip.rest
          )}
        </motion.p>
      )}

      {/* Facts — a hairline grid ABOVE the phones, contained to 920px and centred. Mobile
          is 4 columns × 1 row (four facts), collapsing to 2 columns below 900px. */}
      <motion.dl
        {...mp}
        variants={fadeUp(0.7)}
        className="hero-facts hero-facts--four mx-auto mt-[16px]"
      >
        {data.meta.map((item, i) => (
          <div key={i}>
            <dt
              {...edit(`meta.${i}.label`, "Edit fact label")}
              className={`text-[9.5px] tracking-[0.15em] uppercase text-text-subtle mb-[3px]${aff}`}
            >
              {item.label}
            </dt>
            <dd
              {...edit(`meta.${i}.value`, "Edit fact value")}
              className={`text-[14px] font-medium text-text-primary leading-[1.35]${aff}`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </motion.dl>

      {/* Two-phone composition — an intentional overlapping pair sized to the centred column.
          The back phone tilts counter-clockwise and sits left; the front phone tilts clockwise
          and sits right, overlapping in the middle via a negative margin (layout, not the old
          absolute offsets). Masked so the pair dissolves into the ground at the seam; both
          phones stay fully contained from 390 to 1920. */}
      <motion.div
        {...mp}
        variants={stackV}
        className={`hero-phones${heroGlow ? ` hero-phones--${heroGlow}` : ""} relative mx-auto mt-[14px] flex items-end justify-center`}
      >
        {heroGlow && <HeroAura theme={heroGlow} />}
        {data.glow && <GlowWord word={data.glow} />}
        <motion.div {...mp} variants={backV} className="relative z-[1] origin-bottom">
          <DeviceImage image={backPhone} editable={editable} blockIndex={blockIndex} editPath="devices.0" priority />
        </motion.div>
        <motion.div {...mp} variants={frontV} className="relative z-[2] -ml-[54px] origin-bottom">
          <DeviceImage image={frontPhone} editable={editable} blockIndex={blockIndex} editPath="devices.1" priority />
        </motion.div>
      </motion.div>
    </div>
  );
}
