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
            /* ⚠ `on-dark-muted` WAS PAINTING 1.99 ON A LIGHT HERO, MEASURED ON PRODUCTION. This
               branch was authored for a dark full-bleed hero. That ground came from
               `data-ground="dark"`, which the `:root` prefix correctly killed on 2026-08-09 because
               a section can never match `:root` — the declaration went and the FOREGROUND stayed.
               `.hero-ground.is-dark` resolves to `oklch(0.985 0 0)`, near-white; `is-dark` sets
               `--glow-color` and has never set a ground.

               THE SIBLING BRANCH IS THE EVIDENCE, NOT MY READING OF IT. The two-phone hero below
               draws this same element with `text-text-subtle`, a page-following ROLE. One component,
               one job, two branches, and only one of them names a colour that cannot remap.

               ⚠ AND `--hero-facts-line` IN THIS SAME HERO GOT IT RIGHT, WHICH IS WHAT MAKES THE
               DIFFERENCE INSTRUCTIVE RATHER THAN UNLUCKY. Its dark answer is declared inside
               `:root[data-ground="dark"]` with a light FALLBACK at the use site, so when the page
               ground went away the hairline fell back and stayed visible. A dark value belongs in
               the ground block; these two put theirs in the component.

               `sheet-mono-label` rather than a recoloured version of the old string: tracked
               uppercase IS the mono label register, so this is a conversion INTO the vocabulary.
               `font-semibold` goes with it — the grammar's marks are regular weight, and hierarchy
               here rides on register and case, which survive a change of ground.

               THE BREAKPOINT HALF OF THE OLD SIZE PAIR WAS INERT AND IS NOT MOURNED: the eyebrow
               token is 0.75rem, so both halves resolved to 12px and the `md` step changed nothing.

               ⚠ AND THAT SENTENCE SPELLED THE RETIRED UTILITY ON ITS FIRST DRAFT, WHICH TURNED THE
               COMMENT INTO THE ONLY THING GENERATING IT. `css-comment-trap` A5 went red naming this
               file — the seventh instance of explaining-it-requires-writing-it in this repository,
               caught by the gate written for it. Describe a retired utility; never transcribe it. */
            className={`sheet-mono-label${aff}`}
          >
            {data.eyebrow}
          </motion.div>
        )}

        <h1 className="text-[clamp(2.75rem,5vw,3.75rem)] text-accent-text leading-[0.98] tracking-tight mt-4">
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
            className={`relative z-[1] italic text-[clamp(1.25rem,2.2vw,1.5rem)] leading-[1.35] max-w-[36ch]${aff}`}
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
                /* ⚠ `on-dark-quote` AT 9.5px MEASURED 1.71 ON THIS HERO'S 250,250,250 GROUND — the
                   smallest text on the page, six labels of it, in the first thing a visitor sees.
                   Same cause as the eyebrow above. `sheet-mono-micro` is the grammar's smallest
                   label size and carries the mark colour.

                   THE VALUE BELOW SETS NO COLOUR AND THAT IS FINE, CHECKED RATHER THAN ASSUMED. It
                   inherits from the page, which DOES follow the ground — unlike the rung this label
                   named. That is the difference between the two halves of the rating chip's
                   recorded defect, and here only one half was ever wrong. */
                className={`sheet-mono-micro mb-[3px]${aff}`}
              >
                {item.label}
              </dt>
              <dd
                {...edit(`meta.${i}.value`, "Edit fact value")}
                className={`text-[14px] font-medium leading-[1.35]${aff}`}
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

        {/* ⚠ THIS BRANCH NEVER RENDERED `data.glow` AND TWO STUDIES AUTHORED ONE — authorable and
            inert, on two live pages, for as long as the branch has existed. The mobile hero below
            draws it; the wide hero drew `watermark` and silently dropped `glow`, so `guided` on
            fosfor-ai and `trust` on fosfor-data-profiling have never appeared on the site.

            ⚠ FOUND BY ARITHMETIC RATHER THAN BY READING, WHICH IS THE ONLY REASON IT WAS FOUND. The
            stamp census derived 30 rendered elements and the browser measured 28. Two short, both on
            the two `template: web` studies, both the hero. A count that reconciles is evidence the
            population was understood; this one did not, and the gap was the defect. */}
        {data.glow && <GlowWord word={data.glow} />}
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
            /* ⚠ THIS BRANCH WAS NEVER BROKEN AND IT MOVES ANYWAY, WHICH IS THE POINT. `text-subtle`
               is a role and it measured fine. Converting only the failing branch would leave the
               component speaking two languages — two studies with mono labels and two with sans —
               so a legibility fix would have shipped a typographic split. The tracking collapses
               0.2em and 0.14em to the grammar's single value, and `sheet-mark-text`'s wider 0.2em is
               deliberately NOT reached for: its own declaration says the exception is named there so
               it cannot spread by imitation.

               THE 34px ACCENT HAIRLINE BESIDE IT STAYS AND IS NAMED SO IT IS NOT MISTAKEN FOR AN
               OVERSIGHT. It is 2px of `accent-500` with no text on it, so no pair can fail, and 2px
               of accent is the boundary weight the readout device already uses. It is still a RUNG
               rather than the role, so it does not remap on a dark ground — a latent question with
               no measured failure, which is why it is not repaired inside a fix for measured ones. */
            className={`sheet-mono-label${aff}`}
          >
            {data.eyebrow}
          </span>
        </motion.div>
      )}

      <h1 className="text-6xl text-accent-text leading-[1] tracking-tight mt-3">
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
          className={`relative z-[1] italic text-[34px] text-text-primary leading-[1.15]${aff}`}
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

      {/* ⚠ THE RATING CHIP KEEPS RAW RUNGS ON BOTH HALVES — A PAIR MIGRATES WHOLE OR NOT AT ALL.
          Its ground is `cream-200`, which `role-layer` measured and REFUSED a role: gradient
          endpoints in four of nine sites, one highlighted card, one illustration constant, no
          single job. Migrating only the FOREGROUND would put a page-following text role on a
          ground that does not follow — so under a dark page this chip would draw light text on a
          light pill. It moves when cream-200 earns a role, and not before. */}
      {data.ratingChip && (
        <motion.p
          {...mp}
          variants={chipV}
          /* ⚠ TWO RAW RUNGS, AND THE CHIP'S OWN SPLIT IS WHAT PROVED IT. `★ 4.2` takes
             `text-accent-text`, a ROLE, and stayed legible on a dark palette; the label beside it
             sets NO colour and inherited the ink-950 text utility, a rung that cannot remap — so one element
             carried two foregrounds and only one followed the ground. The ground was `cream-200`,
             also a rung, so this is a two-part repair like `.next-rail`'s.

             `text-secondary` ON ITS JOB, NOT ITS DISTANCE: supporting text beside a figure is that
             role's stated work. `text-subtle` is the quiet layer the population test kept separate,
             and reaching for it here would collapse the distinction that test protected. */
          className="inline-flex items-center gap-2.5 border bg-surface px-4 py-2 text-[0.9rem] font-semibold text-text-secondary mt-4"
          style={{ borderColor: "color-mix(in oklch, var(--color-etch) 12%, transparent)" }}
        >
          <span
            {...edit("ratingChip.stat", "Edit rating stat")}
            /* ⚠ `accent-600`, NOT `accent-500` — THIS IS TEXT AND IT WAS FAILING AA. 14.4px at
               weight 700 on `cream-200` needs 4.5; accent-500 measured 4.07 on cream, 4.21 on
               harbour, 3.66 on cerise, 3.67 on fern. Only orchid cleared. accent-600 lands at
               6.25 / 6.14 / 7.36 / 6.09 / 5.45 — and orchid IMPROVES rather than regressing.
               The chip is accent-500's only text consumer on this rung, which is why the ELEMENT
               moved rather than the token: accent-500 is correct everywhere else it lands. */
            className={`font-bold text-accent-text${aff}`}
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
              /* ⚠ THIS ONE CHANGES COLOUR AND THE STEP IS STATED RATHER THAN ROUNDED AWAY. It went
                 `text-subtle` and the grammar's mark colour is `text-secondary`, one step stronger.
                 That is TWO ELEMENTS adopting a label role, not the quiet layer being folded into
                 the secondary one — the fold this repository refused, on a population test that
                 counted 49 elements becoming 89. Two is not a fold. */
              className={`sheet-mono-micro mb-[3px]${aff}`}
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
