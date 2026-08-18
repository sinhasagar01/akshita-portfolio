"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaletteCompatibility } from "@/lib/palettes/compatibility";
import { render, formatRatio, FORMATS, type CopyFormat } from "@/lib/palettes/formats";
import {
  PREVIEW_MAX_AGE_SECONDS, startPreview, livePreviewTheme,
} from "@/lib/palettes/preview-cookie";
import Link from "next/link";
import StatCard from "@/components/case-study/StatCard";
import PrincipleCard from "@/components/case-study/PrincipleCard";
import PullQuote from "@/components/case-study/blocks/PullQuote";
import SectionHeading from "@/components/ui/SectionHeading";
import PaletteSwitcher from "@/components/palettes/PaletteSwitcher";
import { KIT, KIT_GROUPS, KIT_COUNT, type KitGroup } from "@/lib/palettes/kit";
import { verdictFor, TEXT_FLOOR } from "@/lib/palettes/verdict";

/* ============================================================================================
   `/palettes` — FOUR SECTIONS. Hero, the stage of real components, the kit, how to use it.

   ⚠ IT WAS A CONSOLE — sticky preview left, panel right, thirty contrast rows in a rail — AND THE
   ROWS WERE THE DEFECT. They are a gate's output, which makes them the right EVIDENCE and the wrong
   INTERFACE: a visitor met thirty of them before being told what they were looking at. They still
   exist, behind a disclosure in section 02, under a verdict that says what they add up to.

   ⚠ THE WHOLE PAGE THEMES, NOT A PREVIEW BOX, AND THAT IS THE ARGUMENT RATHER THAN A FLOURISH.
   Pressing a palette writes `data-theme` and `data-ground` on `<html>`, so the nav above, the
   footer below and this panel all move together. A palette that only recoloured a card would prove
   nothing about the system.

   ⚠ AND CONTAINER SCOPING WAS MEASURED AND REFUSED — THE REASON IS INVISIBLE FROM THE MARKUP, SO
   IT IS WRITTEN HERE. Scoping the palette to a `<div>` looks obviously right and does not work.
   A `[data-theme]` block declares 35 tokens and every one is a RUNG; the 11 ROLES are declared
   once in `@theme` as `var()` aliases, and a `var()` inside a custom property is substituted ON
   THE ELEMENT THE DECLARATION APPLIES TO, which is `:root`. So a container that redeclares
   `--color-cream-50` never moves `--color-surface` — the role was already resolved against the
   published palette before the container existed.

   Measured in a browser: a scoped harbour got 11 of 33 sampled tokens right, a scoped sapphire 5
   of 33. The failures split exactly in half — 11 role aliases and 11 derived helpers declared at
   `:root` (`--glass-fill`, `--glow-on-tan`, the vessel tints). And `:root[data-ground="dark"]`
   declares 43 more properties at 0-2-0 specificity, which no container can match at all.

   ⚠ THE FAILURE IS SUBSTITUTION TIMING, NOT SELECTORS, WHICH IS WHY A COMPONENT SWEEP WOULD COME
   BACK CLEAN. Nothing here targets `:root`; the values simply resolved there. The next person to
   reach for container scoping will find no offending rule and conclude it is safe.

   ⚠ AND `/oklch`'s LAB DOES SCOPE TO A CONTAINER AND IT WORKS — THE TWO FACTS LOOK CONTRADICTORY
   AND ARE NOT. Read quickly, this paragraph says container scoping is impossible and the primer's
   lab is a live counter-example, so somebody will eventually "fix" one against the other. They are
   different operations:

       here      redeclare a RUNG      `--color-cream-50`     the role's `var()` alias ALREADY
                                                              resolved at `:root`, so nothing moves
       lab       set the ROLE itself   `--color-surface`      a direct value with no alias to have
                                                              resolved early, so it lands

   THE DISCRIMINATOR IS WHETHER THE PROPERTY BEING SET IS THE ONE THE CONSUMER READS. A role is what
   components read; a rung is what a role points at, and pointing is done once, early, on `:root`.

   ⚠ SO THE LAB CANNOT SCOPE A PALETTE AND DOES NOT TRY. It sets eight roles by hand from three
   slider numbers, which is why its sample is a demonstration of a colour rather than a preview of a
   theme — and why pressing a palette still writes `data-theme` on `<html>` exactly as this page
   does. Neither approach substitutes for the other, and the same note sits in `OklchPrimer.tsx` so
   whichever file a reader opens first carries the distinction.

   ---- ⚠ WHY THE PREVIEW IS NOT `ProjectCard`, WHICH READS LIKE A VIOLATION AND IS NOT ------------

   The rule is REAL COMPONENTS, NO FACSIMILES, and every component below is imported and real. The
   first build of this preview used `ProjectCard`, the most obvious real component on the site, and
   it was replaced — so the reason belongs here before someone restores it on principle.

   ⚠ THE NO-FACSIMILE RULE IS ABOUT DRIFT, NOT ABOUT PHOTOGRAPHS. It exists so this page cannot show
   a system that is not the shipped one. `ProjectCard`'s dominant element is a RASTER, and measured
   across three palette presses the largest thing in the preview did not move at all. A card whose
   biggest element is inert under a palette change demonstrates nothing about tokens — so replacing
   it SERVES the rule rather than bending it.

   What replaced it is still real and still imported: `SectionHeading`, `PrincipleCard`, `StatCard`
   and `PullQuote`, chosen because they are drawn almost entirely from tokens.

   ⚠ AND THE ONE THING THIS PREVIEW THEREFORE CANNOT SHOW, RECORDED RATHER THAN HIDDEN: a themed
   page containing PHOTOGRAPHY. That is a real property of the site — the work cards and the about
   portrait sit on themed grounds — and nothing here demonstrates how a palette sits around an image
   it cannot recolour. A visitor judging "will my photos look right on cerise" gets no answer from
   this page.

   ---- ⚠ AND THE SITE'S OWN NAV IS THE FIFTH REAL COMPONENT, BY NOT BEING HERE -------------------

   `SiteHeader` is `fixed inset-x-0` with document-level listeners and its own `data-nav-tone`
   computation, so a second instance inside this panel would overlay the viewport and double every
   listener. It is NOT rebuilt as a facsimile and NOT imported: the page's own nav sits above the
   console and IS the demonstration. A copy would drift, which is the thing the rule forbids.
============================================================================================ */

type Props = {
  palettes: PaletteCompatibility[];
  initialSlug: string;
  /** True on `/palettes/<slug>`, where an inline script already set the root before paint. */
  ownsRootTheme: boolean;
};

/** The line the preview opens with. A constant, not state — see the note at its render. */
const HEADLINE = "Turning rough ideas into products people use";

/**
 * The accent's three OKLCH components as strings, for the hero formula.
 *
 * ⚠ PARSED FROM THE PUBLISHED TOKEN RATHER THAN TYPED. The contract draws one fixed accent because
 * a static mock has no palette to read. Typing three numbers into the one element whose job is to
 * show that the third number IS the theme would put a figure on screen that describes no palette on
 * this site — the unattached-number defect, in the worst possible place for it.
 *
 * ⚠ AND THE CONTRACT'S EXAMPLE VALUE IS DESCRIBED HERE RATHER THAN QUOTED, WHICH IS NOT FUSSINESS.
 * It was written out in full in this comment and in the one at the render, and `colour-census`
 * read both as authored colour literals in a `.tsx` file — this file's colour count went from
 * nothing to three on prose alone. Fifth instance of explaining-it-requires-writing-it in this
 * repository, and the first in an OKLCH literal inside a note about not typing OKLCH literals.
 *
 * Returns null when the token is not an oklch literal, so a future palette declaring its accent in
 * some other form drops the formula rather than rendering three empty slots. Measured today: all
 * nine declare `accent-500` in OKLCH, so the null branch is unreachable and is written anyway,
 * because "unreachable today" is a property of the content rather than of this function.
 */
function accentParts(css: string | undefined): { l: string; c: string; h: string } | null {
  const m = /^\s*oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/.exec(css ?? "");
  return m ? { l: m[1], c: m[2], h: m[3] } : null;
}

export default function PaletteConsole({ palettes, initialSlug, ownsRootTheme }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const active = palettes.find((p) => p.name === slug) ?? palettes[0];
  /* The hero, so the switcher can watch it leave. Owned here because the page owns the section and
     the switcher is a control over the page — a component that went looking for `.hero` itself
     would be reading a layout it does not own. */
  const heroRef = useRef<HTMLElement | null>(null);
  const verdict = verdictFor(active);
  const accent = accentParts(active.tokens["accent-500"]);

  const [group, setGroup] = useState<"All" | KitGroup>("All");
  const [selected, setSelected] = useState<string>(KIT[0].symbol);
  const shownParts = group === "All" ? KIT : KIT.filter((k) => k.group === group);
  /* ⚠ LOOKED UP IN THE FULL LIST, NOT IN THE FILTERED ONE. Filtering to a group the selected part
     is not in would otherwise close the drawer, which reads as the filter breaking something. The
     drawer keeps showing what was pressed until something else is. */
  const selectedPart = KIT.find((k) => k.symbol === selected);
  /* The theme the visitor arrived on, so leaving the page restores it rather than stranding them
     on whatever they last pressed. Captured once, before any press. */
  const arrivedOn = useRef<{ theme: string; ground: string | null } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!arrivedOn.current) {
      arrivedOn.current = { theme: root.dataset.theme ?? "", ground: root.dataset.ground ?? null };
    }
    return () => {
      /* ⚠ RESTORED ON UNMOUNT ONLY WHEN NO PREVIEW WAS REQUESTED, AND THE UNCONDITIONAL VERSION WAS
         THE DEFECT IN `Try across portfolio`.

         The restore exists so that BROWSING palettes does not leak: pressing dots to look at cerise
         and then navigating to /blog must not carry cerise, because the visitor never asked for it
         and there would be no indicator offering a way back.

         ⚠ BUT PRESSING `Try across portfolio` IS EXACTLY THAT REQUEST, AND THE OLD CLEANUP COULD NOT
         TELL THE TWO APART. It restored whatever the visitor arrived on, so leaving this page put
         the published theme back while the cookie stayed live — a cream page under a banner
         insisting "Previewing nocturne", with an Exit button. The DOM was wrong and the strip was
         the only thing telling the truth.

         ⚠ THE DISCRIMINATOR ALREADY EXISTED AND IS NOT A NEW MECHANISM: the cookie. If one is live,
         the visitor asked for the palette to travel, so the DOM is left alone. If none is, this was
         browsing and the arrival state is restored. Same cookie, same decoder, same single source of
         truth `/palettes`, the teaser and both strips already share.

         ⚠ AND IT IS READ HERE RATHER THAN FROM STATE, because the cookie is what every OTHER surface
         reads. A local flag would be a second answer to "is a preview live" and the two would
         eventually disagree — which is the failure this whole layer is built to avoid. */
      if (livePreviewTheme(Date.now())) return;

      const seen = arrivedOn.current;
      if (!seen) return;
      if (seen.theme) root.dataset.theme = seen.theme;
      if (seen.ground) root.dataset.ground = seen.ground; else delete root.dataset.ground;
    };
  }, []);

  const press = useCallback((next: PaletteCompatibility) => {
    const root = document.documentElement;
    root.dataset.theme = next.name;
    if (next.groundClass === "dark") root.dataset.ground = "dark";
    else delete root.dataset.ground;
    setSlug(next.name);
  }, []);

  /* On the slug route the script already set the root, so the first paint is correct and this only
     keeps the two in step after a press. */
  useEffect(() => {
    if (!ownsRootTheme) return;
    const root = document.documentElement;
    if (root.dataset.theme !== slug) press(active);
  }, [ownsRootTheme, slug, active, press]);

  const [fmt, setFmt] = useState<CopyFormat>("css");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  /* ⚠ THE BLOCK IS RENDERED FROM THE SAME REPORT THE ROWS ABOVE ARE, through `render`. No figure on
     this page is computed twice — `palette-formats` B1 asserts that as an identity rather than
     leaving it to this comment, because a comment saying two things agree cannot fail. */
  const block = render(active, fmt);

  const copy = useCallback(async (text: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); say(msg); }
    catch { say("Copy failed — your browser blocked it"); }
  }, [say]);

  /* ⚠ A DOWNLOAD IS A BLOB, NEVER A ROUTE. The file must be the bytes the visitor is looking at, so
     it is built from the SAME `render` call rather than fetched from an endpoint that would compute
     it again — the second-spelling risk, in a place where the output leaves the site entirely. */
  const download = useCallback((format: CopyFormat) => {
    const meta = FORMATS.find((f) => f.id === format);
    if (!meta) return;
    const text = render(active, format);
    const url = URL.createObjectURL(new Blob([text], { type: meta.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name}.${meta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    say(`Downloading ${active.name}.${meta.ext}`);
  }, [active, say]);

  return (
    <main className="pb-24">
      {/* `aria-live` so a copy is announced rather than only shown — the action has no other
          feedback, and a silent success is indistinguishable from a silent failure. */}
      <div
        aria-live="polite"
        className={`fixed right-6 top-24 z-50 bg-text-primary px-4 py-2 text-sm text-surface transition-opacity ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </div>

      <PaletteSwitcher
        palettes={palettes}
        active={slug}
        onPick={press}
        heroRef={heroRef}
        onPreview={say}
      />

      {/* ══════════ 01 · HERO — ABOUT THE PAGE, NOTHING ELSE ══════════
          ⚠ NO PALETTE CONTROL LIVES HERE, AND THAT IS THE SECTION'S WHOLE DEFINITION. The old page
          opened on a console, so a visitor met thirty contrast rows before they had been told what
          they were looking at. The hero says what the page is; the switcher arrives when the hero
          leaves, which is exactly when a control becomes useful rather than premature. */}
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
          {/* ⚠ A TRACKED-CAPS RUN IN A CAPSULE IS THE CONSTRUCTION THIS DIRECTION RETIRES BY NAME,
              and the accent dot beside it was a use with no job — the rule's object line does that
              work. The page's own numbering already reads as a sheet set, which is why the device
              fits here without inventing anything. */}
          <div className="sheet-rule">
            <span className="sheet-mark-text">Sheet 01</span>
            <span className="sheet-rule-line" aria-hidden="true" />
            <span className="sheet-mark-text">Palettes</span>
          </div>
          {/* ⚠ THE ROLE'S OWN SIZE, MEASURE AND LEADING. The first draft of this line carried
              a measure-clearing utility, a size utility and a leading utility beside the role —
              all three inert,
              because `.sheet-h2` declares those properties and is unlayered. `sheet-role-utilities`
              caught it on the first run after the conversion, which is the gate doing exactly what
              it was built for one unit earlier. What renders is 40px at 24ch, which is what the
              screenshot showed and what reads. */}
          {/* ⚠ `mx-auto` IS LOAD-BEARING HERE AND THE FIRST DRAFT DROPPED IT. `.sheet-h2` caps the
              measure at 24ch, so the heading's BOX is narrower than the centred column around it —
              `text-center` on the header centres the lines INSIDE that box, and the box itself sat
              hard left. Before the role it had no max-width at all and filled the column, which is
              why nothing needed centring. The lede below always carried `mx-auto`; the heading lost
              its centring at the moment it gained a measure.

              It works because the type roles stopped declaring `margin` — an auto margin here would
              have drawn nothing before that change. */}
          <h1 className="sheet-h2 mx-auto mt-6">
            {/* Upright and in ink, on the gallery hero's ruling: the slant is the retired device
                and a headline word is not one of the four sanctioned accent uses. */}
            Nine palettes.<br />One <em className="not-italic">hue</em> apart.
          </h1>
          <p className="sheet-lede mx-auto mt-5">
            Every palette here is the same lightness and chroma ladder at a different hue. That is
            the whole system, and it is why a theme change cannot break the hierarchy, and why dark
            mode stops being a second design.
          </p>

          {/* ⚠ THE FORMULA IS THE ACTIVE PALETTE'S OWN ACCENT, PARSED FROM ITS PUBLISHED TOKEN.
              The contract draws one fixed accent because a static mock has to. Typing three
              numbers here would put a figure on screen that agrees with no palette on
              the site — the unattached-number defect, in the one element whose entire job is to
              show that the third number is the theme. */}
          {accent && (
            <p className="mt-8 inline-flex items-center gap-3 border border-ink-950/8 bg-surface px-4 py-3 font-mono text-sm text-text-primary">
              <span className="sheet-mono-micro">
                {active.name}
              </span>
              <span>oklch(</span>
              <b className="font-medium text-accent-text">{accent.l}</b>
              <b className="font-medium text-accent-text">{accent.c}</b>
              <b className="font-medium text-accent-text">{accent.h}</b>
              <span>)</span>
            </p>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <a
              href="#components"
              /* ⚠ THE COLOUR SITS ON A CHILD SPAN, NOT ON THE ANCHOR. `globals.css` declares an
                 UNLAYERED `a { color: inherit }` so links take their context, and an unlayered
                 element rule beats a utility in `@layer utilities` regardless of specificity. A
                 `text-on-accent` here asks for a colour and draws the inherited one — `cascade-public`
                 counts that as a collision, and it caught both of these on their first run. A span
                 has no reset competing for `color`, so the utility lands. */
              /* ⚠ THE ROLE, NOT THE RUNG — AND THAT IS THE WHOLE FIX. `--color-accent` remaps on
                 `[data-ground="dark"]`; `--color-accent-500` does NOT. So `on-accent` against the
                 rung measured 3.24 to 3.65 on the four dark palettes against a 4.5 floor, live on a
                 public page, while the same pairing against the role measures 6.75 to 7.52.
                 ⚠ AND IT MOVES NOTHING ON LIGHT, MEASURED RATHER THAN ARGUED: on all five light
                 palettes the role and the rung resolve to the IDENTICAL PAINT — cream 182,83,41,
                 harbour 0,126,91, orchid 153,63,148, cerise 209,45,107, fern 75,127,32 — so the two
                 columns are the same number and zero pixels change.
                 This site was missed when eight others were moved off the rung. */
              className="inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-sm font-semibold"
            >
              <span className="text-on-accent">See it on real components ↓</span>
            </a>
            <Link
              href="/oklch"
              className="inline-flex items-center gap-2 border border-ink-950/8 px-4 py-2.5 text-sm font-medium"
            >
              <span className="text-text-secondary">Learn OKLCH in four minutes ↗</span>
            </Link>
          </div>

          {/* ⚠ EVERY FIGURE DERIVED, AND THE THIRD ONE NAMES ITS SUBJECT. "30 pairs" is per palette
              and the row sets differ between light and dark grounds — 23 of 30 keys are shared —
              so the label says "each" and the page never claims one set of thirty across nine. */}
          {/* ⚠ `.sheet-readout`'s SECOND CONSUMER, and the device had zero until the gallery took
              it an hour ago. Four derived figures under a rule is exactly what it draws: a 2px
              accent rule above, a hairline below, equal columns divided by hairlines. The figures
              take the accent because a readout figure is one of the direction's four sanctioned
              uses — this page's only accent, and it is on the numbers it is arguing about. */}
          <div className="sheet-readout mt-9">
            {[
              [String(palettes.length), "palettes"],
              [String(active.rows.length), "pairs each"],
              [String(palettes.filter((p) => p.verdict !== "SHIPPABLE").length), "failing"],
              ["1", "number changes"],
            ].map(([n, l]) => (
              <div key={l}>
                <b className="sheet-readout-value block">{n}</b>
                <span className="sheet-readout-key sheet-mono-micro block">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════ 02 · REAL COMPONENTS ══════════
          ⚠ THE CONTRACT DRAWS A NINE-PANEL BOARD AND NINE OF ITS PANELS ARE FACSIMILES. A work
          card, a contact form, a stepper, toasts, a nav pill and a blog row, all hand-built in the
          mock's own CSS. Building that literally would put nine hand-drawn imitations on a page
          whose stated rule is REAL COMPONENTS, NO FACSIMILES — and four of the things drawn do not
          exist in this repository at all.

          So the stage is composed from the imported parts, arranged the way a page arranges them.
          The contract is authoritative about the SHAPE — a bordered stage with a bar above it
          carrying the verdict — and it is not authoritative about parts that do not exist. */}
      <section id="components" className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] scroll-mt-28 px-6">
        {/* The rule replaces the eyebrow NUMERAL and the status run; the heading stays and takes
            the sheet role beneath it, which is the shape every case-study section uses. */}
        <div className="sheet-rule">
          <span className="sheet-mark-text">Sheet 02</span>
          <span className="sheet-rule-line" aria-hidden="true" />
          <span className="sheet-mark-text">live · real components</span>
        </div>
        {/* ⚠ THE SECTIONS TAKE `.sheet-h3`, NOT `.sheet-h2`, BECAUSE THE PAGE HEADING IS ALREADY
            `.sheet-h2`. The first draft gave both the same role and they rendered at an identical
            40px/600 — the hierarchy cancellation this site records, where size says one thing and
            weight says nothing, and four section heads read as peers of the page title. Two levels
            is what this page needs and two is what the direction declares: 40px for the sheet, 31px
            for each section under it. */}
        <h2 className="sheet-h3 mb-2 mt-[clamp(14px,2vw,22px)]">Pick one. Watch what doesn&rsquo;t change.</h2>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Not swatches. These are the site&rsquo;s own components, imported and rendered in whichever
          palette is live. The nav above this page is one of them and is deliberately not copied in
          here, because a copy would drift from the thing it is arguing about.
        </p>

        <div className="overflow-hidden border border-ink-950/8 bg-surface">
          {/* ⚠ THE VERDICT BAR — THREE FIGURES, EACH NAMING ITS SUBJECT. "Tightest" is ambiguous
              across three quantities on this data and the reader means one of them. See
              `lib/palettes/verdict.ts`, which deliberately exports no function called `tightest`. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink-950/8 bg-surface-well px-4 py-3">
            <span className="flex gap-1.5" aria-hidden="true">
              {/* ⚠ THE DOTS KEEP THEIR CIRCLE AND EVERY CONTROL ON THIS PAGE LOST ITS CAPSULE.
                  The radius ruling is that a box around content loses its corner and a circle keeps
                  it because it IS one — these are 8px dots, not pills with nothing in them. */}
              {[0, 1, 2].map((i) => <i key={i} className="h-2 w-2 rounded-full bg-etch/20" />)}
            </span>
            <span className="sheet-mono-label">
              akshitas.com — {active.name}
            </span>
            <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-text-subtle">
              <span className="flex items-center gap-2">
                <i className={`h-[7px] w-[7px] rounded-full ${verdict.holds ? "bg-accent-500" : "bg-danger-600"}`} />
                {verdict.holds ? "clears every pair" : `${verdict.failing.length} below floor`}
              </span>
              {verdict.tightestText && (
                <span>
                  tightest text pair{" "}
                  <b className="font-medium text-text-primary">{formatRatio(verdict.tightestText.got)}</b>
                  {" "}· {verdict.tightestText.key}
                </span>
              )}
              {verdict.bodyWorst && (
                <span>
                  body worst case{" "}
                  <b className="font-medium text-text-primary">{formatRatio(verdict.bodyWorst.got)}</b>
                </span>
              )}
              <span>{verdict.checked} checked</span>
            </span>
          </div>

          <div className="p-6">
            <div className="border border-ink-950/8 bg-surface-well p-6">
              {/* ⚠ THE HEADLINE IS THE VISITOR'S, AND THAT IS THE POINT OF THE WHOLE STAGE.
                  Everything else here shows the palette holding SOMEBODY ELSE'S words. Typing your
                  own is what turns a demonstration into a test of the thing you actually care
                  about — whether the palette carries YOUR sentence at YOUR length.

                  ⚠ AND THERE IS NO STATE BEHIND IT, WHICH IS THE WHOLE REASON THE CARET IS SAFE.
                  The first version held the text in `useState` and passed it back as `title`, so
                  every keystroke re-rendered the node React was reading from — the classic
                  `contentEditable` caret jump, avoided only by React's diff happening to skip an
                  unchanged string. Nothing needs the edited text: the copy block does not carry it
                  and no gate reads it. The element is genuinely UNCONTROLLED. */}
              <SectionHeading
                index="01"
                title={HEADLINE}
                subtext="Eight years across enterprise data tools and one consumer turnaround."
                titleProps={{
                  contentEditable: true,
                  suppressContentEditableWarning: true,
                  spellCheck: false,
                  role: "textbox",
                  "aria-label": "Preview headline — type your own",
                  tabIndex: 0,
                  className: "outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                }}
              />
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* ⚠ A REAL FIGURE IN A DEMO FIXTURE, AND IT DRIFTED BECAUSE IT LIVES WHERE NOBODY
                    LOOKS FOR CONTENT. This read `2.3 → 4.0` while the case study and the work card
                    said 4.2 — a third spelling of one number, live on two public pages. #615
                    corrected the rating in the content and in the case study, which is where anyone
                    fixing a rating would search; a hardcoded prop inside a design-system page is
                    outside that walk entirely, the same shape as the `app/dev` paths a
                    content-only image sweep would have deleted.
                    `ralph/tests/rating-agreement.mjs` is why it cannot drift a third time. */}
                <StatCard
                  stat={{
                    value: "2.3 → 4.2",
                    tag: "store rating",
                    body: "What the boAt Crest redesign moved, drawn in whichever palette is pressed.",
                  }}
                />
                <PrincipleCard
                  principle={{
                    index: "02",
                    title: "One surface, three personas",
                    body: "Analysts, leads and admins reading the same data at different depths.",
                  }}
                />
              </div>
              <div className="mt-3">
                <PullQuote text="A palette that only recolours a card proves nothing about the system." />
              </div>
            </div>

            {/* ⚠ THE FOUR TIGHTEST **TEXT** PAIRS, AND THE FIRST VERSION OF THIS ROW BROKE THE ONE
                RULE THIS PAGE HAS ABOUT ITS OWN NUMBERS. Sorting every row by ratio and taking four
                surfaced 1.05, 1.10, 1.13 and 1.19 — all four `ground step` rows, which are LADDER
                floors saying two adjacent grounds must be separable. Rendered large and unlabelled
                they read as legibility figures scraping a floor, which is the exact misreading the
                verdict bar above is built to prevent.

                It looked right in source and only the render showed it, because the numbers a sort
                returns depend on the data rather than on the code. Filtering by FLOOR — the same
                predicate `verdictFor` uses, not a second one — is what makes these agree with the
                headline they sit under. */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...active.rows].filter((r) => r.min >= TEXT_FLOOR)
                .sort((a, b) => a.got - b.got).slice(0, 4).map((r) => (
                <div key={r.key} className="border border-ink-950/8 bg-surface p-3">
                  <b className="block font-mono text-lg text-text-primary">{formatRatio(r.got)}</b>
                  <span className="mt-1 block sheet-mono-micro">
                    {r.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ⚠ THE THIRTY ROWS MOVE BEHIND A DISCLOSURE AND ARE NOT DELETED. They are a gate's output,
            which makes them the right EVIDENCE and the wrong INTERFACE — a visitor met thirty rows
            before being told what they were looking at. The verdict above is what the rows add up
            to; this is where somebody who wants to check it goes. */}
        <details className="mt-4 border border-ink-950/8 bg-surface-well">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-text-primary">
            All {verdict.checked} pairs for {active.name}
          </summary>
          <div className="px-4 pb-4">
            {/* ⚠ SAID PER PALETTE, BECAUSE THE THIRTY ARE NOT THE SAME THIRTY. Light and dark
                palettes share 23 keys; the other seven swap `canvas` for `band-dark`, because the
                usage map follows the ground each class actually paints. */}
            <p className="mb-3 text-sm leading-relaxed text-text-subtle">
              Measured at build from {active.name}&rsquo;s own tokens. A palette on the other ground
              checks a different set, because the pairs follow the ground the design actually draws.
            </p>
            {active.rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-2 border-b border-ink-950/8 py-1.5 text-sm"
              >
                <span className="text-text-subtle">{r.key}</span>
                <b className="font-mono text-sm text-text-primary">{formatRatio(r.got)}</b>
                <u className="sheet-mono-micro no-underline">
                  {r.got >= r.min ? "pass" : "fail"}
                </u>
              </div>
            ))}
          </div>
        </details>

        {/* ⚠ THE TRY ACTION LIVES HERE AS WELL AS IN THE SWITCHER, AND THE DUPLICATION IS THE FIX
            RATHER THAN THE DEFECT. The switcher is `display: none` below 1200px because there is no
            gutter for it — which would have made it the page's ONLY try control and then removed it
            from every phone and most tablets. The contract has the same gap, because a mock drawn at
            one width cannot show a control disappearing at another.

            ⚠ AND IT IS NOT A SECOND MECHANISM. Both call `startPreview`; there is one writer, one
            cookie and one indicator. Two BUTTONS onto one mechanism is what "three doors" means. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border border-ink-950/8 bg-surface-well px-4 py-4">
          <div>
            <h3 className="text-base text-text-primary">Try it across the site</h3>
            <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-text-subtle">
              Applies {active.name} to every page for {PREVIEW_MAX_AGE_SECONDS / 60} minutes. It
              expires on its own, and an exit control follows you until it does. Nothing is published.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              startPreview(active.name, active.groundClass === "dark", Date.now());
              say(`${active.name} applied across the site`);
            }}
            className="ml-auto bg-accent px-4 py-2.5 text-sm font-medium text-on-accent"
          >
            Try {active.name} across the portfolio
          </button>
        </div>
      </section>

      {/* ══════════ 03 · THE KIT ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] border-t border-ink-950/8 px-6 pt-11">
        <div className="sheet-rule">
          <span className="sheet-mark-text">Sheet 03</span>
          <span className="sheet-rule-line" aria-hidden="true" />
          {/* ⚠ THE COUNT IS `KIT.length`, NEVER TYPED. The contract carried `38 parts · 10 new` in
              this exact slot beside a list of thirty, and nine of its twenty "shipping" parts do
              not exist in this repository under any spelling. */}
          <span className="sheet-mark-text">{KIT_COUNT} parts · all shipping</span>
        </div>
        <h2 className="sheet-h3 mb-2 mt-[clamp(14px,2vw,22px)]">The kit.</h2>
        <p className="mb-2 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Every part here is imported from the live site and rendered in whichever palette is live.
          Press one for the roles it reads and how to use it.
        </p>
        {/* ⚠ THE CENSUS RULE IS STATED WHERE THE COUNT IS, because the count is smaller than a
            visitor might expect and the reason is the interesting part. */}
        <p className="mb-5 max-w-[66ch] text-xs leading-relaxed text-text-subtle">
          A part is a shipped public component that mounts on its own. That leaves out page-level
          sections, the fixed nav and reading indicator, and everything under the editor, which is
          frozen against the theme and so would sit here not moving.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 border border-ink-950/8 bg-surface p-1">
            {KIT_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={g === group}
                onClick={() => setGroup(g)}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
                  g === group ? "bg-accent font-medium text-on-accent" : "text-text-subtle"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <span className="ml-auto sheet-mono-micro">
            {shownParts.length} shown
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {shownParts.map((k) => (
            <button
              key={k.symbol}
              type="button"
              aria-pressed={k.symbol === selected}
              onClick={() => setSelected(k.symbol)}
              className={`block w-full overflow-hidden border text-left ${
                k.wide ? "sm:col-span-2" : ""
              } ${k.symbol === selected ? "border-accent-500" : "border-ink-950/8"}`}
            >
              {/* ⚠ THE PART IS RENDERED, NOT PICTURED. `overflow-hidden` and a fixed minimum height
                  keep the cells even; nothing is scaled, because a transform would change what the
                  visitor is judging. A part too tall for the cell is clipped and opens in full in
                  the drawer, which is honest in a way a squeezed copy would not be. */}
              {/* ⚠ A FIXED HEIGHT WITH `overflow-hidden`, NOT `min-height`. A minimum lets each
                  cell size to its own part and the grid goes ragged, which reads as broken layout
                  rather than as parts of different sizes. Anything taller is clipped and opens in
                  full in the drawer below — honest in a way a squeezed copy would not be. */}
              {/* ⚠ `canvas-static` IS LOAD-BEARING AND ITS ABSENCE WAS INVISIBLE IN SOURCE. These
                  are case-study block components, and several stagger their items behind
                  `.reveal-card`, which starts at `opacity: 0` and is lifted by `RevealSection`.
                  Nothing runs `RevealSection` inside a grid cell, so Stepper, Glance grid and
                  Issue list painted THREE EMPTY CELLS while every component rendered, every token
                  resolved and both tsc and eslint were clean. The class already existed for the
                  studio canvas, which met the identical bug; this is its third consumer.

                  ⚠ AND `items-start`, NOT `items-center`. Centring shows the MIDDLE of anything
                  taller than the cell, so a clipped section heading opened mid-sentence. A part is
                  read from its top. */}
              <span className="canvas-static flex h-[168px] items-start justify-center overflow-hidden border-b border-ink-950/8 bg-surface-well p-4">
                <span className="w-full [&_*]:pointer-events-none">{k.render}</span>
              </span>
              <span className="flex items-baseline justify-between gap-2 px-3 py-2.5">
                <b className="text-xs font-semibold text-text-primary">{k.name}</b>
                <em className="sheet-mono-micro not-italic">
                  {k.group}
                </em>
              </span>
            </button>
          ))}
        </div>

        {selectedPart && (
          <div className="mt-3 overflow-hidden border border-accent-500 bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-950/8 px-4 py-4">
              <div>
                <h3 className="text-xl tracking-tight text-text-primary">{selectedPart.name}</h3>
                <p className="mt-1 max-w-[56ch] text-sm leading-relaxed text-text-subtle">
                  Shipping on the public site today, in every palette on this page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copy(selectedPart.usage, `${selectedPart.name} usage copied`)}
                className="border border-ink-950/8 px-3.5 py-2 text-xs text-text-secondary"
              >
                Copy usage
              </button>
            </div>
            <div className="grid grid-cols-2 border-b border-ink-950/8 sm:grid-cols-3">
              {[
                [selectedPart.group, "group"],
                [selectedPart.roles.join(" · "), "roles read"],
                [selectedPart.where, "ships from"],
              ].map(([v, l]) => (
                <div key={l} className="border-r border-ink-950/8 px-4 py-3 last:border-r-0">
                  <b className="block break-words font-mono text-[11px] font-medium text-text-primary">{v}</b>
                  <span className="mt-1.5 block sheet-mono-micro">
                    {l}
                  </span>
                </div>
              ))}
            </div>
            {/* ⚠ THE PART AT FULL SIZE, AND THIS IS WHAT MAKES THE GRID'S CLIPPING HONEST. The
                cells are a fixed height so the grid stays even, which clips anything taller —
                acceptable only because the full part is one press away. Without this the page
                would show every part half-read and offer no way to see the rest, which is worse
                than a ragged grid rather than better. */}
            <div className="canvas-static border-b border-ink-950/8 bg-surface-well p-6">
              {selectedPart.render}
            </div>
            <div className="bg-surface p-4">
              <pre className="overflow-auto font-mono text-[10.5px] leading-relaxed text-text-secondary">
                {selectedPart.usage}
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* ══════════ 04 · HOW TO USE IT ══════════ */}
      <section className="mx-auto mt-14 w-full max-w-[1300px] min-[1200px]:max-w-[min(1300px,calc(100vw_-_460px))] border-t border-ink-950/8 px-6 pt-11">
        <div className="sheet-rule">
          <span className="sheet-mark-text">Sheet 04</span>
          <span className="sheet-rule-line" aria-hidden="true" />
          <span className="sheet-mark-text">Four moves</span>
        </div>
        <h2 className="sheet-h3 mb-2 mt-[clamp(14px,2vw,22px)]">How to use it.</h2>
        <p className="mb-6 max-w-[66ch] text-sm leading-relaxed text-text-secondary">
          Role tokens in OKLCH, with the measured contrast riding inside the block as a comment.
        </p>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="flex flex-col gap-3">
            {[
              ["01", "Paste the block.",
                "Everything is a role, so your components never name a colour. Swapping a theme touches this block and nothing else."],
              ["02", "Change one number.",
                "Move the hue and the whole palette moves with it. Lightness and chroma are held, so the contrast you measured still holds."],
              ["03", "Dark mode is the same block.",
                "Mirror the lightness values around the midpoint and leave hue alone. The identity survives and there is no second palette to maintain."],
              ["04", "Check it. Don't trust it.",
                `OKLCH is an authoring model, not a contrast certificate. Perceptual lightness and WCAG luminance are different measures. The ${verdict.checked} pairs above are computed at build from these tokens. Run the same check on yours.`],
            ].map(([n, h, b]) => (
              <div key={n} className="grid grid-cols-[52px_1fr] overflow-hidden border border-ink-950/8 bg-surface">
                <div className="flex justify-center border-r border-ink-950/8 bg-surface-well pt-4 font-mono text-xs font-medium text-accent-text">
                  {n}
                </div>
                <div className="px-4 py-4">
                  <h4 className="text-sm font-semibold text-text-primary">{h}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-subtle">{b}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-hidden border border-ink-950/8 bg-surface lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2 border-b border-ink-950/8 bg-surface-well px-3.5 py-3">
              <div className="flex gap-0.5 border border-ink-950/8 bg-surface p-1">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={f.id === fmt}
                    onClick={() => setFmt(f.id)}
                    className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
                      f.id === fmt ? "bg-accent text-on-accent" : "text-text-subtle"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="ml-auto sheet-mono-micro">
                {fmt === "json" ? "design tokens" : fmt === "tailwind" ? "tailwind v4" : "custom properties"}
              </span>
            </div>
            {/* ⚠ JSON HAS NO COMMENT SYNTAX, SO ITS REPORT IS DATA — AND THE VISITOR IS TOLD, rather
                than left to notice that one of three formats carries less. It carries MORE. */}
            <p className="border-b border-ink-950/8 px-3.5 py-2.5 text-xs leading-relaxed text-text-subtle">
              {fmt === "json"
                ? "JSON has no comments, so the contrast report is data here — every pair with its ratio, its floor and whether that floor is WCAG or ours."
                : "The contrast report rides inside the block as a comment, so the figures travel with the tokens."}
            </p>
            <pre className="max-h-[330px] overflow-auto p-4 font-mono text-[10.5px] leading-relaxed text-text-secondary">
              {block}
            </pre>
            <div className="flex flex-wrap gap-2 border-t border-ink-950/8 bg-surface-well px-3.5 py-3">
              <button
                type="button"
                onClick={() => copy(block, `${active.name} copied as ${fmt}`)}
                className="bg-accent px-4 py-2 text-sm font-medium text-on-accent"
              >
                Copy
              </button>
              <button type="button" onClick={() => download("css")} className="border border-ink-950/8 px-4 py-2 text-sm text-text-secondary">
                .css
              </button>
              <button type="button" onClick={() => download("json")} className="border border-ink-950/8 px-4 py-2 text-sm text-text-secondary">
                .json
              </button>
              <button
                type="button"
                onClick={() => copy(`${window.location.origin}/palettes/${active.name}`, "Link copied")}
                className="border border-ink-950/8 px-4 py-2 text-sm text-text-secondary"
              >
                Link
              </button>
            </div>
          </div>
        </div>

        <p className="mt-9 text-sm text-text-subtle">
          <b className="font-medium text-text-primary">Free to use.</b> No attribution needed.
        </p>
      </section>
    </main>
  );
}
