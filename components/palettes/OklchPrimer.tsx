"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { PaletteCompatibility } from "@/lib/palettes/compatibility";
import { PREVIEW_MAX_AGE_SECONDS, startPreview } from "@/lib/palettes/preview-cookie";
import PaletteSwitcher from "@/components/palettes/PaletteSwitcher";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionLabel from "@/components/ui/SectionLabel";
import StatCard from "@/components/case-study/StatCard";
import PrincipleCard from "@/components/case-study/PrincipleCard";

/* ============================================================================================
   `/oklch` — THE PRIMER. Seven sections, and the lab is the middle three's whole point.

   ---- ⚠ THE LAB IS LOCAL, AND THE RULING IS FORCED BY A MECHANISM RATHER THAN CHOSEN --------

   The sliders write a colour that is not a palette, which is a state neither existing door has.
   Asked what happens if somebody drags the hue and then presses `Try across the portfolio`, the
   answer is measured rather than designed:

     `decodePreview` requires `/^[a-z-]+$/` on the theme name. An OKLCH function contains digits, a
     percent, parentheses and dots, so IT CANNOT BE WRITTEN TO THE COOKIE AT ALL.

     ⚠ AND THAT SENTENCE ORIGINALLY SPELLED AN EXAMPLE VALUE OUT, WHICH `colour-census` READ AS AN
     AUTHORED COLOUR IN THIS FILE. Sixth instance of explaining-it-requires-writing-it and the
     second in an OKLCH literal, committed one unit after the fifth was recorded. Describe the
     form; never transcribe it.

     And if it somehow were, `resolveTheme` fails closed to `cream` for any name outside
     `THEME_NAMES`, so the visitor would silently get the published palette instead.

   ⚠ SO AN OFF-PALETTE PREVIEW IS UNREPRESENTABLE, NOT MERELY UNSUPPORTED. There is no design
   question here to answer, and building a "share your tuned colour" path would mean widening the
   cookie's grammar — a change to the one piece of state four surfaces already share, for a feature
   nobody asked for. The lab therefore touches NOTHING outside its own sample: no cookie, no
   `data-theme`, no `data-ground`.

   ⚠ AND THE COPY SAYS SO AT THE TRY BUTTON, because the surprising case is real. A visitor who has
   dragged the hue to something they like and presses Try gets the PALETTE, not their colour, and
   being told that beforehand is the difference between a boundary and a bug.

   ---- ⚠ THE SAMPLE IS REAL COMPONENTS UNDER OVERRIDDEN ROLES, AND THAT NEEDED MEASURING -------

   `PaletteConsole`'s header records that container-scoping a PALETTE does not work: a
   `[data-theme]` block declares RUNGS, the roles are `var()` aliases resolved at `:root`, and a
   container redeclaring `--color-cream-50` never moves `--color-surface`.

   ⚠ SO THIS FILE AND THAT ONE APPEAR TO CONTRADICT EACH OTHER, AND SOMEBODY WILL EVENTUALLY "FIX"
   ONE AGAINST THE OTHER. One says container scoping cannot work; the other is a working container
   scope. Both are correct, because they are different operations:

       PaletteConsole   redeclare a RUNG      `--color-cream-50`   the role's `var()` alias ALREADY
                                                                    resolved at `:root` — nothing moves
       this lab         set the ROLE itself   `--color-surface`    a direct value, no alias to have
                                                                    resolved early — it lands

   THE DISCRIMINATOR IS WHETHER THE PROPERTY BEING SET IS THE ONE THE CONSUMER READS. Components read
   ROLES. A rung is what a role points at, and the pointing happens once, early, on `:root`, which is
   why moving a rung underneath a container changes nothing.

   ⚠ AND IT DOES NOT MAKE PALETTE SCOPING POSSIBLE, WHICH IS THE PART THAT MATTERS FOR ANYONE
   TEMPTED. A palette is thirty-five rungs plus derived helpers plus a dark-ground block at 0-2-0;
   this sets EIGHT ROLES BY HAND from three numbers. It is a demonstration of a colour, not a
   preview of a theme — which is exactly why pressing a palette here still writes `data-theme` on
   `<html>` the way `/palettes` does, rather than scoping it. The same note sits in
   `PaletteConsole.tsx` so whichever file a reader opens first carries the distinction.

   The consequence is that the lab shows the site's OWN components responding to three sliders,
   rather than a hand-drawn card imitating them. It is the no-facsimile rule surviving into a
   surface where the colour is deliberately not a palette.

   ⚠ WHAT IT THEREFORE CANNOT SHOW, RECORDED RATHER THAN HIDDEN: anything driven by a token this
   container does not override. The derived helpers declared at `:root` — the glass fills, the
   vessel tints — keep the page's palette inside the sample. The components mounted here draw from
   roles alone, which is why they were the ones chosen.
============================================================================================ */

type Props = {
  palettes: PaletteCompatibility[];
  /** The palette the visitor arrived on, so the switcher opens on the site they are actually on. */
  initialSlug: string;
};

/** The lab's three numbers. Seeded from a palette, then owned by the sliders. */
type Lab = { l: number; c: number; h: number };

/* ⚠ THE FOUR ROLE LIGHTNESSES ARE THE LADDER, AND THEY ARE THE ONE THING THE SLIDERS DO NOT MOVE.
   That is the lesson the whole page is built to deliver: hue is the theme, and the ladder is what
   survives it. Exposing them as a fourth control would let a visitor break the very property the
   sample exists to demonstrate. */
const LADDER = {
  light: { surface: 99, lead: 16, body: 32, subtle: 48, well: 97.6, onAccent: 98 },
  dark: { surface: 23, lead: 96, body: 84, subtle: 66, well: 20, onAccent: 14 },
} as const;

/**
 * The teaching ratio. A GAMMA PROXY OVER OKLCH LIGHTNESS, NOT THE WCAG COMPUTATION.
 *
 * ⚠ THE CAVEAT IS NOT DECORATION AND IT APPEARS TWICE ON PURPOSE — beside this number at the
 * readout, and again as the last of the three questions in section 07. `/palettes` publishes
 * measured pairs precisely because perceptual lightness and WCAG relative luminance are DIFFERENT
 * MEASURES, and a page that teaches OKLCH while implying its lightness IS contrast would undercut
 * the page it links to in its own hero.
 *
 * It is the right number for the lab anyway. What the sliders teach is that moving L moves contrast
 * and moving C and H barely does — a relationship this reproduces faithfully, on a quantity a
 * visitor can watch respond in real time. What it must never be read as is a pass mark.
 */
function teachingRatio(aL: number, bL: number): number {
  const lum = (x: number) => Math.pow(x / 100, 2.2);
  const a = lum(aL) + 0.05, b = lum(bL) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

/** An oklch literal from three numbers, at the precision the readout shows. */
const css = (l: number, c: number, h: number) => `oklch(${l.toFixed(1)}% ${c.toFixed(3)} ${h})`;

/**
 * The three OKLCH components of a palette's accent, for seeding the lab.
 *
 * ⚠ SEEDED FROM THE REAL TOKEN, so pressing a palette in the switcher drops that palette's actual
 * accent into the sliders rather than an approximation of it. A seeded value a visitor then drags
 * is a comparison against something true.
 */
function seedFrom(p: PaletteCompatibility): Lab {
  const m = /^\s*oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/.exec(p.tokens["accent-500"] ?? "");
  if (!m) return { l: 62, c: 0.15, h: 42 };
  return {
    l: m[2] === "%" ? Number(m[1]) : Number(m[1]) * 100,
    c: Number(m[3]),
    h: Number(m[4]),
  };
}

export default function OklchPrimer({ palettes, initialSlug }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const active = palettes.find((p) => p.name === slug) ?? palettes[0];
  const heroRef = useRef<HTMLElement | null>(null);
  const labRef = useRef<HTMLElement | null>(null);

  const [lab, setLab] = useState<Lab>(() => seedFrom(active));
  const [dark, setDark] = useState(active.groundClass === "dark");
  /* ⚠ TRACKED SO THE PAGE CAN SAY THE SLIDERS HAVE LEFT THE PALETTE. The switcher goes on showing
     the palette that themes the PAGE, which stays true — but a visitor who has dragged the hue is
     looking at two different colours in two places, and an interface that shows both without
     saying which is which is the unattached-number defect in a control. */
  const seeded = useMemo(() => seedFrom(active), [active]);
  const offPalette =
    Math.abs(lab.l - seeded.l) > 0.05 || Math.abs(lab.c - seeded.c) > 0.0005 || lab.h !== seeded.h;

  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  /* ⚠ PRESSING A PALETTE RESEEDS THE LAB, WHICH IS THE ONE COUPLING BETWEEN THEM AND IT RUNS ONE
     WAY. The switcher drives the lab; the lab never drives the switcher, because the lab's value
     is frequently not a palette and there would be nothing true to set. */
  const pick = useCallback((p: PaletteCompatibility) => {
    setSlug(p.name);
    setLab(seedFrom(p));
    setDark(p.groundClass === "dark");
  }, []);

  const rung = dark ? LADDER.dark : LADDER.light;
  const groundL = rung.surface;
  const ratio = teachingRatio(lab.l, groundL);

  /* The role overrides the sample container carries. Roles, not rungs — see the header. */
  const sampleVars = {
    "--color-surface": css(rung.surface, dark ? 0.024 : 0.006, lab.h),
    "--color-surface-well": css(rung.well, dark ? 0.023 : 0.014, lab.h),
    "--color-text-primary": css(rung.lead, dark ? 0.008 : 0.02, lab.h),
    "--color-text-secondary": css(rung.body, dark ? 0.015 : 0.02, lab.h),
    "--color-text-subtle": css(rung.subtle, dark ? 0.02 : 0.018, lab.h),
    "--color-accent-500": css(lab.l, lab.c, lab.h),
    "--color-accent-text": css(dark ? 80 : 46, dark ? 0.12 : 0.13, lab.h),
    "--color-on-accent": css(rung.onAccent, dark ? 0.03 : 0.012, lab.h),
  } as React.CSSProperties;

  const band = (fn: (t: number) => string) =>
    Array.from({ length: 8 }, (_, i) => fn(i / 7));

  return (
    <main className="pb-24">
      <div
        aria-live="polite"
        className={`fixed right-6 top-24 z-50 rounded-full bg-text-primary px-4 py-2 text-sm text-surface transition-opacity ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </div>

      <PaletteSwitcher
        palettes={palettes}
        active={slug}
        onPick={pick}
        heroRef={heroRef}
        onPreview={say}
      />

      {/* ══════════ 01 · HERO ══════════ */}
      <header ref={heroRef} className="relative overflow-hidden px-6 pb-16 pt-32 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[120%]"
          style={{
            background:
              "radial-gradient(closest-side at 50% 42%, color-mix(in oklch, var(--color-accent-500) 22%, transparent), transparent 72%)",
          }}
        />
        <div className="relative mx-auto max-w-[960px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-950/8 bg-surface px-3.5 py-1.5">
            <i className="h-[7px] w-[7px] rounded-full bg-accent-500" />
            <SectionLabel>Playground · 02 — Learn OKLCH</SectionLabel>
          </span>
          <h1 className="mt-6 text-6xl leading-[0.94] tracking-tight text-text-primary">
            Three numbers.<br />One of them is the <em className="italic text-accent-text">theme</em>.
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-lg leading-relaxed text-text-secondary">
            A colour written in OKLCH answers three separate questions. How light, how colourful,
            which hue. Change the third and you have a new theme. Change nothing else and the
            hierarchy survives.
          </p>
          <p className="mt-8 inline-flex items-center gap-3 rounded-xl border border-ink-950/8 bg-surface px-4 py-3 font-mono text-sm text-text-primary">
            <span className="text-eyebrow uppercase tracking-eyebrow text-text-subtle">
              the whole idea
            </span>
            <span>oklch(</span>
            <b className="font-medium text-accent-text">L</b>
            <b className="font-medium text-accent-text">C</b>
            <b className="font-medium text-accent-text">H</b>
            <span>)</span>
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <a
              href="#lab"
              /* ⚠ THE ROLE, NOT THE RUNG — AND THAT IS THE WHOLE FIX. `--color-accent` remaps on
                 `[data-ground="dark"]`; `--color-accent-500` does NOT. So `on-accent` against the
                 rung measured 3.24 to 3.65 on the four dark palettes against a 4.5 floor, live on a
                 public page, while the same pairing against the role measures 6.75 to 7.52.
                 ⚠ AND IT MOVES NOTHING ON LIGHT, MEASURED RATHER THAN ARGUED: on all five light
                 palettes the role and the rung resolve to the IDENTICAL PAINT — cream 182,83,41,
                 harbour 0,126,91, orchid 153,63,148, cerise 209,45,107, fern 75,127,32 — so the two
                 columns are the same number and zero pixels change.
                 This site was missed when eight others were moved off the rung. */
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold"
            >
              <span className="text-on-accent">Move the three controls ↓</span>
            </a>
            <Link
              href="/palettes"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-950/8 px-4 py-2.5 text-sm font-medium"
            >
              <span className="text-text-secondary">Playground · 01 — Palettes ↗</span>
            </Link>
          </div>
          {/* ⚠ THE PALETTE COUNT IS DERIVED; THE OTHER THREE ARE CLAIMS ABOUT THE MODEL, NOT
              MEASUREMENTS, AND THEY ARE FIXED BECAUSE THEY ARE NOT COUNTS OF ANYTHING. "Three
              numbers" is what OKLCH is. Deriving a constant would be theatre. */}
          <div className="mt-9 flex flex-wrap justify-center gap-x-9 gap-y-5 border-t border-ink-950/8 pt-6">
            {[
              ["3", "numbers"],
              ["1", "changes per theme"],
              [String(palettes.length), "palettes built on it"],
              ["0", "maths required"],
            ].map(([n, l]) => (
              <div key={l}>
                <b className="block font-mono text-xl font-medium tracking-tight text-text-primary">{n}</b>
                <span className="mt-1.5 block font-mono text-[8.5px] uppercase tracking-[0.18em] text-text-subtle">
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════ 02 · THE MENTAL MODEL ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] px-6">
        <div className="mb-2 flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-accent-text">02</span>
          <h2 className="text-3xl tracking-tight text-text-primary">The mental model.</h2>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
            three questions
          </span>
        </div>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Every colour on this page and on the rest of this site is these three numbers. The bands
          are live and redraw from whatever you set below.
        </p>
        {/* ⚠ THE BANDS DEPICT THE COLOUR SPACE AND MUST NOT THEME — `docs/colour-boundary.yaml`,
            row `oklch-axis-bands`. A themed hue band would be a hue band that lies about hue: it
            has to run the whole circle to show that hue is the only thing differing across the
            palettes, and a palette recolouring it would destroy the claim it illustrates. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              k: "L · lightness", t: "How much light?",
              d: "Zero is black, one hundred is white. Perceptual rather than mathematical, so fifty actually looks halfway, which is the part HSL gets wrong.",
              u: "Use it for hierarchy.", n: "Contrast is almost entirely a lightness question.",
              s: band((t) => css(15 + t * 82, lab.c, lab.h)),
            },
            {
              k: "C · chroma", t: "How colourful?",
              d: "Zero is grey. Around 0.1 to 0.2 is vivid. Push further and the colour leaves what a screen can actually show.",
              u: "Use it for energy.", n: "Hold it steady so no palette shouts louder than another.",
              s: band((t) => css(lab.l, t * 0.3, lab.h)),
            },
            {
              k: "H · hue", t: "Which family?",
              d: "A position on the wheel, zero to three hundred and sixty. The only number that says which colour this is.",
              u: "Use it for identity.", n: "This is the number a theme changes, and the only one.",
              s: band((t) => css(lab.l, lab.c, Math.round(t * 360))),
            },
          ].map((q) => (
            <article key={q.k} className="overflow-hidden rounded-xl border border-ink-950/8 bg-surface">
              <div className="flex h-[58px]" aria-hidden="true">
                {q.s.map((c, i) => <i key={i} className="flex-1" style={{ background: c }} />)}
              </div>
              <div className="p-5">
                <p className="text-eyebrow uppercase tracking-eyebrow text-accent-text">{q.k}</p>
                <h3 className="mt-2 text-xl tracking-tight text-text-primary">{q.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-subtle">{q.d}</p>
                <p className="mt-3 border-t border-ink-950/8 pt-3 text-xs leading-relaxed text-text-subtle">
                  <b className="font-semibold text-text-primary">{q.u}</b> {q.n}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══════════ 03 · THE LAB ══════════ */}
      <section ref={labRef} id="lab" className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] scroll-mt-28 border-t border-ink-950/8 px-6 pt-11">
        <div className="mb-2 flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-accent-text">03</span>
          <h2 className="text-3xl tracking-tight text-text-primary">Move one at a time.</h2>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
            interactive
          </span>
        </div>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Drag a slider and watch what changes, and more usefully what does not. The sample is the
          site&rsquo;s own components with their role tokens driven by these three numbers.
        </p>

        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-ink-950/8 bg-surface lg:grid-cols-[360px_1fr]">
          <div className="border-b border-ink-950/8 bg-surface-well p-5 lg:border-b-0 lg:border-r">
            {[
              { id: "l", label: "Lightness", sym: "L", v: lab.l, min: 15, max: 97, step: 0.5,
                out: `${lab.l.toFixed(1)}%`,
                hint: "Move this and the contrast moves with it. Hue and intensity hold exactly.",
                track: `linear-gradient(90deg, ${css(15, lab.c, lab.h)}, ${css(97, lab.c, lab.h)})` },
              { id: "c", label: "Chroma", sym: "C", v: lab.c, min: 0, max: 0.32, step: 0.005,
                out: lab.c.toFixed(3),
                hint: "More or less intense, at the same weight. Notice the contrast barely moves.",
                track: `linear-gradient(90deg, ${css(lab.l, 0, lab.h)}, ${css(lab.l, 0.32, lab.h)})` },
              { id: "h", label: "Hue", sym: "H", v: lab.h, min: 0, max: 360, step: 1,
                out: `${lab.h}°`,
                hint: "Sweep this. The identity changes completely and the hierarchy does not move at all.",
                track: `linear-gradient(90deg, ${[0, 72, 144, 216, 288, 360].map((h) => css(lab.l, lab.c, h)).join(", ")})` },
            ].map((s) => (
              <div key={s.id} className="mb-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <b className="text-sm font-semibold text-text-primary">
                    {s.label}
                    <em className="ml-2 font-mono text-[9.5px] font-medium not-italic text-accent-text">{s.sym}</em>
                  </b>
                  <output className="font-mono text-xs font-medium text-text-primary">{s.out}</output>
                </div>
                <input
                  type="range"
                  aria-label={`${s.label} — ${s.sym}`}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={s.v}
                  onChange={(e) => setLab((p) => ({ ...p, [s.id]: Number(e.target.value) }))}
                  className="h-2.5 w-full appearance-none rounded-md outline-none"
                  style={{ background: s.track }}
                />
                <p className="mt-2 text-xs leading-relaxed text-text-subtle">{s.hint}</p>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-950/8 bg-surface px-3 py-3">
              <span className="font-mono text-xs font-medium text-text-primary">
                {css(lab.l, lab.c, lab.h)}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(css(lab.l, lab.c, lab.h));
                  say("Value copied");
                }}
                className="font-mono text-[10px] font-medium text-accent-text"
              >
                Copy
              </button>
            </div>

            <div className="mt-4 rounded-r-lg border-l-[3px] border-accent-500 bg-surface p-3">
              <b className="mb-1 block text-xs font-semibold text-text-primary">Try this</b>
              <p className="text-xs leading-relaxed text-text-subtle">
                Hold lightness and chroma where they are, then sweep hue end to end. That single drag
                is what a theme change costs when the ladder is fixed.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-0.5 rounded-full border border-ink-950/8 bg-surface-well p-1">
                {[["Light", false], ["Dark", true]].map(([label, isDark]) => (
                  <button
                    key={String(label)}
                    type="button"
                    aria-pressed={dark === isDark}
                    onClick={() => setDark(Boolean(isDark))}
                    className={`rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] ${
                      dark === isDark ? "bg-accent font-medium text-on-accent" : "text-text-subtle"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ⚠ THE CAVEAT SITS AT THE READOUT, NOT ONLY IN SECTION 07. A number labelled
                  "accent on surface" beside a familiar-looking ratio is read as a WCAG figure by
                  anyone who has ever checked one, and this is not that computation. Saying so once
                  at the bottom of the page would be saying it where nobody is looking at the
                  number. */}
              {/* ⚠ NOT `ml-auto`, AND THE MEASUREMENT IS WHY. The switcher is fixed at the right
                  edge from 1200px up, and at 1440 it covered 84.5px of this readout — the number
                  and the whole of the caveat under it. A caveat the switcher hides is not a caveat
                  at the readout, which is the one thing this element has to be.

                  ⚠ THE OTHER FIX WAS TO REPAD BOTH PLAYGROUND PAGES AWAY FROM THE GUTTER, AND IT
                  WAS REFUSED. The switcher is a translucent floating panel and the contract has it
                  overlapping content deliberately; reserving 220px on every section at every width
                  above 1200 would relayout two pages to protect one span. Moving the span is the
                  change that fits the defect. */}
              <div className="text-right">
                <span className="font-mono text-xs text-text-subtle">
                  accent on surface{" "}
                  <b className="font-medium text-text-primary">{ratio.toFixed(2)}</b>
                </span>
                <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.14em] text-text-subtle">
                  teaching estimate · not WCAG
                </span>
              </div>
            </div>

            {offPalette && (
              /* ⚠ SAID RATHER THAN LEFT TO BE NOTICED. The switcher goes on showing the palette
                 that themes the PAGE, which stays true — but a visitor who has dragged a slider is
                 looking at two different colours in two places. An off-palette value is
                 unrepresentable in the preview cookie, so Try applies the palette and not this. */
              <p className="rounded-lg border border-ink-950/8 bg-surface-well px-3 py-2.5 text-xs leading-relaxed text-text-subtle">
                These three numbers are yours now, not {active.name}&rsquo;s. They stay in this
                sample — trying a palette across the portfolio applies{" "}
                <b className="font-medium text-text-primary">{active.name}</b>, not this colour.
              </p>
            )}

            {/* ⚠ REAL COMPONENTS UNDER OVERRIDDEN ROLES. See the header for why this works where
                container-scoping a PALETTE does not: these are direct role values, not rungs with
                an alias that already resolved at `:root`. */}
            <div
              className="canvas-static flex-1 rounded-xl border p-6"
              style={{ ...sampleVars, background: "var(--color-surface)", borderColor: "var(--color-text-subtle)" }}
            >
              <SectionHeading
                index="01"
                title="Colour should explain the hierarchy before you read a word"
                subtext="One controlled lightness ladder makes emphasis predictable in every theme."
              />
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PrincipleCard
                  principle={{
                    index: "02",
                    title: "One surface, three personas",
                    body: "Analysts, leads and admins reading the same data at different depths.",
                  }}
                />
                <StatCard
                  stat={{
                    value: "40%",
                    tag: "faster to insight",
                    body: "The number the redesign moved, drawn in whatever you have set.",
                  }}
                />
              </div>
              <button
                type="button"
                className="mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={{ background: "var(--color-accent-500)", color: "var(--color-on-accent)" }}
              >
                Explore the work →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 04 · THE PROBLEM ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] border-t border-ink-950/8 px-6 pt-11">
        <div className="mb-2 flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-accent-text">04</span>
          <h2 className="text-3xl tracking-tight text-text-primary">The problem it fixes.</h2>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
            hsl against oklch
          </span>
        </div>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          In HSL every colour below says fifty percent lightness. They are not remotely the same
          brightness, which is why a scale built in HSL has to be corrected by eye, per colour,
          forever.
        </p>
        {/* ⚠ SIXTEEN FIXED COLOURS THAT MUST NOT THEME — `docs/colour-boundary.yaml`, row
            `hsl-oklch-comparison`. The whole demonstration is that these SPECIFIC values behave
            the way they do; a palette recolouring them would destroy the comparison rather than
            skin it. Their foregrounds are fixed for the same reason. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            {
              h: "HSL · every one at 50% L", e: "wildly uneven",
              cells: [["Yellow", "hsl(55 100% 50%)"], ["Green", "hsl(140 100% 50%)"],
                      ["Blue", "hsl(240 100% 50%)"], ["Pink", "hsl(300 100% 50%)"]],
              ink: ["#111", "#111", "#fff", "#fff"],
              cap: <>Yellow shouts, blue sinks. <b className="font-semibold text-text-primary">The number lied</b>, and any rule you write against it is wrong for most hues.</>,
            },
            {
              h: "OKLCH · every one at 72% L", e: "even weight",
              cells: [["Yellow", "oklch(72% 0.16 95)"], ["Green", "oklch(72% 0.16 145)"],
                      ["Blue", "oklch(72% 0.16 255)"], ["Pink", "oklch(72% 0.16 325)"]],
              ink: ["#111", "#111", "#111", "#111"],
              cap: <>Same perceived weight at every hue. <b className="font-semibold text-text-primary">Now a rule holds</b>, and one ladder works for the whole wheel.</>,
            },
          ].map((card) => (
            <div key={card.h} className="overflow-hidden rounded-xl border border-ink-950/8 bg-surface">
              <div className="flex items-baseline justify-between gap-3 border-b border-ink-950/8 px-4 py-3">
                <b className="text-sm font-semibold text-text-primary">{card.h}</b>
                <em className="font-mono text-[9px] not-italic text-text-subtle">{card.e}</em>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 overflow-hidden rounded-lg sm:grid-cols-4">
                  {card.cells.map(([name, value], i) => (
                    <div
                      key={name}
                      className="flex h-[108px] flex-col justify-end p-3"
                      style={{ background: value, color: card.ink[i] }}
                    >
                      <b className="text-xs font-semibold">{name}</b>
                      <code className="mt-1 font-mono text-[8px] opacity-85">{value}</code>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-subtle">{card.cap}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ 05 · ONE COLOUR BECOMES A SYSTEM ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] border-t border-ink-950/8 px-6 pt-11">
        <div className="mb-2 flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-accent-text">05</span>
          <h2 className="text-3xl tracking-tight text-text-primary">One colour becomes a system.</h2>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
            from your hue
          </span>
        </div>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Take the hue you set above, hold chroma, step lightness. That is a full scale, and the four
          role tokens under it are all a component ever needs to name.
        </p>
        <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-ink-950/8 sm:grid-cols-8">
          {[97, 90, 80, 68, 56, 44, 32, 20].map((l, i) => (
            <div
              key={l}
              className="flex h-[118px] flex-col justify-between p-3"
              style={{
                /* Chroma is pulled in at the extremes because sRGB holds very little of it there —
                   the same reason every shipped palette's `cream-50` and `ink-950` sit near-neutral. */
                background: css(l, l > 88 || l < 26 ? Math.min(lab.c, 0.05) : lab.c, lab.h),
                color: css(l > 52 ? 18 : 97, 0.02, lab.h),
              }}
            >
              <b className="font-mono text-xs font-medium">{(i + 1) * 100}</b>
              <small className="font-mono text-[8px] opacity-80">L {l}</small>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-3">
          {[
            ["Text lead", css(rung.lead, dark ? 0.008 : 0.02, lab.h), "headings and core copy"],
            ["Text subtle", css(rung.subtle, dark ? 0.02 : 0.018, lab.h), "body and support"],
            ["Accent", css(lab.l, lab.c, lab.h), "links, focus, marks"],
            ["Surface", css(rung.surface, dark ? 0.024 : 0.006, lab.h), "cards and panels"],
          ].map(([name, value, note]) => (
            <div key={name} className="overflow-hidden rounded-xl border border-ink-950/8 bg-surface">
              <i className="block h-[58px]" style={{ background: value }} />
              <div className="p-3">
                <b className="block text-xs font-semibold text-text-primary">{name}</b>
                <code className="mt-1 block font-mono text-[8.5px] text-text-subtle">{value}</code>
                <small className="mt-1.5 block text-xs text-text-subtle">{note}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ 06 · DARK MODE ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] border-t border-ink-950/8 px-6 pt-11">
        <div className="mb-2 flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-accent-text">06</span>
          <h2 className="text-3xl tracking-tight text-text-primary">
            Dark mode stops being a second design.
          </h2>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
            the payoff
          </span>
        </div>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Mirror the lightness values around the midpoint and leave hue alone. The identity survives,
          the relationships survive, and there is no second palette to maintain.
        </p>
        {/* ⚠ BOTH BLOCKS SHOW **YOUR** HUE, which is what makes the claim checkable rather than
            illustrative. The right-hand block is not a picture of dark mode; it is the same four
            declarations with only their lightness moved, at the hue the sliders are on. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            { title: "Light", note: "hue and chroma unchanged", rows: LADDER.light, isDark: false },
            { title: "Dark — the same block, lightness mirrored", note: "only the L values moved", rows: LADDER.dark, isDark: true },
          ].map((side) => (
            <div
              key={side.title}
              className="overflow-hidden rounded-xl border"
              style={{
                background: css(side.isDark ? 20 : 99, side.isDark ? 0.022 : 0.006, lab.h),
                borderColor: css(side.isDark ? 96 : 16, 0.01, lab.h),
              }}
            >
              <div
                className="border-b px-4 py-3 text-sm font-semibold"
                style={{
                  color: css(side.isDark ? 96 : 16, side.isDark ? 0.008 : 0.02, lab.h),
                  borderColor: css(side.isDark ? 96 : 16, 0.01, lab.h),
                }}
              >
                {side.title}
              </div>
              <div className="p-4">
                <pre
                  className="m-0 whitespace-pre-wrap font-mono text-[10.5px] leading-[1.9]"
                  style={{ color: css(side.isDark ? 84 : 32, side.isDark ? 0.015 : 0.02, lab.h) }}
                >
                  <span style={{ color: css(side.isDark ? 66 : 48, 0.018, lab.h) }}>{`/* ${side.note} */`}</span>
                  {"\n"}
                  {([
                    ["--surface", side.rows.surface],
                    ["--text-lead", side.rows.lead],
                    ["--text-subtle", side.rows.subtle],
                  ] as const).map(([name, l]) => (
                    <span key={name}>
                      <span style={{ color: css(side.isDark ? 80 : 46, side.isDark ? 0.12 : 0.13, lab.h) }}>{name}</span>
                      {`: oklch(`}
                      <b className="font-semibold">{`${l}%`}</b>
                      {` ${lab.c.toFixed(3)} ${lab.h});\n`}
                    </span>
                  ))}
                  <span style={{ color: css(side.isDark ? 80 : 46, side.isDark ? 0.12 : 0.13, lab.h) }}>--accent</span>
                  {`: oklch(`}
                  <b className="font-semibold">{`${(side.isDark ? Math.min(lab.l + 8, 92) : lab.l).toFixed(1)}%`}</b>
                  {` ${lab.c.toFixed(3)} ${lab.h});`}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ 07 · CHECK YOUR MODEL ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] border-t border-ink-950/8 px-6 pt-11">
        <div className="mb-2 flex flex-wrap items-baseline gap-4">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-accent-text">07</span>
          <h2 className="text-3xl tracking-tight text-text-primary">Check your model.</h2>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-text-subtle">
            three questions
          </span>
        </div>
        <p className="mb-4 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          You understand OKLCH when these three feel obvious rather than clever.
        </p>
        <div>
          {[
            {
              q: "New theme, same hierarchy. Which number changes?",
              a: <>
                <b className="font-semibold text-text-primary">Hue, and only hue.</b> Keep the
                lightness roles exactly as they are, then tune chroma only if the new hue reads weak
                or leaves the display gamut. If you find yourself changing lightness, you are
                rebuilding rather than retheming.
              </>,
              open: true,
            },
            {
              q: "Muted text is too faint. Should I raise chroma?",
              a: <>
                <b className="font-semibold text-text-primary">Almost never.</b> Faintness is a
                lightness problem, because the gap between the text and its background is too small.
                Raising chroma makes it more colourful and no more legible, and on a dark ground it
                usually makes it worse.
              </>,
            },
            {
              /* ⚠ THIS IS THE ONE THE LAB'S READOUT DEPENDS ON, AND IT NAMES THE READOUT. The
                 caveat appears at the number and again here, and neither placement replaces the
                 other: the first catches somebody reading the figure, the second catches somebody
                 reading the page. Removing either would let this page imply that OKLCH lightness
                 IS contrast, which is the claim `/palettes` exists to disprove. */
              q: "Does equal OKLCH lightness guarantee WCAG contrast?",
              a: <>
                <b className="font-semibold text-text-primary">No, and this is the one people get
                wrong.</b> OKLCH is an authoring model, not a contrast certificate. Perceptual
                lightness and WCAG relative luminance are different measures, computed differently.
                The ratio in the lab above is a teaching estimate built from lightness alone, so it
                tracks the right relationship and is not a pass mark. Test every real
                text-on-background pair, which is exactly why the palettes page publishes{" "}
                {active.rows.length} measured pairs per palette instead of asserting that the maths
                holds.
              </>,
            },
          ].map((item) => (
            <details key={item.q} open={item.open} className="border-t border-ink-950/8 last:border-b">
              <summary className="cursor-pointer list-none py-4 text-lg tracking-tight text-text-primary">
                {item.q}
              </summary>
              <p className="mb-4 max-w-[74ch] pl-7 text-sm leading-[1.7] text-text-subtle">{item.a}</p>
            </details>
          ))}
        </div>

        {/* ⚠ THE SECOND TRY CONTROL, FOR THE REASON THE PALETTES PAGE ESTABLISHED. The switcher is
            `display: none` below 1200px, so without this the primer has no try control on a phone.
            Same `startPreview`, no third spelling — two buttons onto one mechanism. */}
        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-ink-950/8 bg-surface p-6">
          <div>
            <h3 className="text-2xl tracking-tight text-text-primary">Now go use it.</h3>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-text-subtle">
              {palettes.length} palettes built on exactly this — the same ladder at{" "}
              {palettes.length} hues — with every pair measured and the tokens ready to copy.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                startPreview(active.name, active.groundClass === "dark", Date.now());
                say(`${active.name} applied across the site`);
              }}
              className="rounded-full border border-ink-950/8 px-4 py-2.5 text-sm font-medium text-text-secondary"
            >
              Try {active.name} for {PREVIEW_MAX_AGE_SECONDS / 60} minutes
            </button>
            <Link
              href="/palettes"
              /* ⚠ THE ROLE, NOT THE RUNG — AND THAT IS THE WHOLE FIX. `--color-accent` remaps on
                 `[data-ground="dark"]`; `--color-accent-500` does NOT. So `on-accent` against the
                 rung measured 3.24 to 3.65 on the four dark palettes against a 4.5 floor, live on a
                 public page, while the same pairing against the role measures 6.75 to 7.52.
                 ⚠ AND IT MOVES NOTHING ON LIGHT, MEASURED RATHER THAN ARGUED: on all five light
                 palettes the role and the rung resolve to the IDENTICAL PAINT — cream 182,83,41,
                 harbour 0,126,91, orchid 153,63,148, cerise 209,45,107, fern 75,127,32 — so the two
                 columns are the same number and zero pixels change.
                 This site was missed when eight others were moved off the rung.

                 ⚠ AND `rounded-full` STAYS — IT IS THE SAME PIXELS AS THE `rounded-xl` BUTTONS
                 ABOVE. CSS clamps border-radius to half the box, and this button is 42px tall, so
                 9999px and 24px BOTH resolve to 21px. The page is uniform at 21px and these are two
                 spellings of one result.

                 ⚠ DO NOT UNIFY THE SPELLINGS. A class edit with no observable effect is churn — the
                 ruling this repo already made against changing `display: flex` to `inline-flex` on
                 the work filter. The reason lives here rather than in a commit body precisely so the
                 next person to notice the mismatch does not pay a diff to discover it.

                 They diverge only if this button ever exceeds 48px tall, at which point `xl` would
                 show 24px corners and `full` would still be a pill. THAT is the trigger, and it is a
                 height change rather than a radius one. */
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium"
            >
              <span className="text-on-accent">Playground · 01 — Palettes ↗</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
