"use client";

// The Details canvas — the work card, previewed in both of its states.
//
// WHY THE WORK CARD AND NOT SOMETHING ELSE. Selecting Details gave an empty canvas beside a full
// inspector. The five fields it edits — title, hero image, summary, type, platform — are exactly
// what ONE public element renders: the project card in the work section. Nothing else on the site
// shows all five and nothing else shows only these. So the canvas is not being given "something
// to display"; it is being given the thing those fields are FOR.
//
// THE SAME COMPONENT, NOT A COPY. This renders `ProjectCard` itself with values from the draft
// form rather than from disk — #178's rule. A hand-built lookalike would drift the first time the
// card changed, and it would drift SILENTLY, which is the failure this project has spent the most
// gates on.
//
// BOTH STATES, SIDE BY SIDE AND LABELLED, because the summary is INVISIBLE AT REST. The card
// shows its image, its title and its category; the summary lives only in the hover veil. A canvas
// drawing one state cannot show a field the inspector spends a whole textarea on, and the author
// is editing that text while looking at it. Not a hover to be discovered — #198's shape, a defect
// that lives in the COMPARISON rather than in either state.
//
// TWO FIELDS DO NOT RENDER, AND THAT IS STATED RATHER THAN PAPERED OVER.
//   category — not on the card. It becomes `data-cat` and decides which filter tab the card
//              appears under, so its preview is the FILTER ROW below.
//   type     — renders NOWHERE, on any public surface this canvas could draw. Confirmed from
//              source: it exists in the schema, the reader and this editor, and no component
//              under components/case-study, components/sections, components/blocks or
//              app/(portfolio) reads it. No surface is invented for it.
//
// INLINE EDITING IS NOT IN THIS PASS. `inlineEditProps` is proven, but the card's title sits
// inside a block-level `<Link>` — locked in #160 — and editable text inside a link is a real
// interaction problem rather than an attribute. The canvas tracks the inspector live; the
// inspector stays the one place these fields are written, the posture #190 chose for the blog head.
import { useEffect, useRef, useState } from "react";
import type { ProjectListItem } from "@/lib/keystatic";
import ProjectCard from "@/components/sections/ProjectCard";
// COLLECTION-AGNOSTIC DESPITE THE PATH. `resolveHeroSrc` is a pure precedence function over
// {previewUrl, rewriteSrc, heroImage} with nothing blog-shaped in it, and ProjectsEditPanel
// already cites it by name in a comment. Imported rather than re-implemented; the blog-named
// directory is worth moving one day and is not this PR's to move.
import { resolveHeroSrc } from "@/lib/blog/hero-fill";

/** The legal category values, from the sanitiser. `""` means unset and matches only "All". */
const FILTERS = ["all", "web", "mobile"] as const;

/**
 * The real slot, MEASURED ON THE PUBLIC PAGE rather than derived from the container.
 *
 * THE DERIVATION SAID 600 AND THE PAGE SAYS 516. `container-x` caps at 1280 and pads 24 a side,
 * leaving 1232, and `(1232 - 32) / 2` is 600 — which is what the arithmetic gives and what I
 * built first. It skips a step: the grid is not in the container, it is inside `.section-card`,
 * which takes its own `margin-inline` and then 52px of `padding-inline` a side. Measured at 1440:
 * container 1232 -> section 1175 -> grid 1071 -> card 519.5.
 * 516 IS THE CEILING VALUE, not the widest. The section's margin is `clamp(0.75rem, 2vw, 2rem)`,
 * so it grows with the viewport until it pins at 32 — which means the card gets NARROWER as the
 * window widens, 519.5 at 1440 and 516 from 1600 up. 516 is what a desktop reader actually sees.
 * A preview at 600 would have reflowed the veil body the author is here to edit, at a width
 * nobody's browser produces.
 */
const CARD_W = 516;
/** Two cards and the gap between them. */
const PAIR_W = CARD_W * 2 + 24;

/**
 * Render the pair at TRUE size and scale it to whatever the pane is.
 *
 * THE CONTRACT DRAWS THE TWO STATES AS `1fr 1fr`, which makes each card HALF THE PANE rather than
 * 600px — adjacency bought with size. That trade is real: the veil's body is `max-width: 42ch` and
 * its title is 27px, so a narrower card reflows the very text the author is here to edit, and the
 * preview would be of a card nobody sees.
 * BUT STACKING IS NOT THE ANSWER EITHER, and the contract says why: the author is editing the
 * hover text, so the hover has to be visible WHILE THEY TYPE. Two 600px cards need 1224px and the
 * pane is ~856, so at true size they wrap and the hover card leaves the fold.
 * SCALING KEEPS BOTH, and it is the answer this codebase already reached for the section canvas —
 * render at the live width, scale to fit, cap at 1 so a wide pane shows true size rather than a
 * blown-up one. Only ever scales DOWN.
 */
function useFitPair() {
  const paneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;
    // ⚠ THE CONTENT BOX, NOT `clientWidth`. `clientWidth` INCLUDES PADDING, and the pane carries
    // `px-6` — so measuring it claimed 682px of room where only 634 existed, and the pair was
    // scaled 48px too wide before anything else went wrong. `getBoundingClientRect()` minus the
    // resolved padding is the width the child can actually occupy.
    const measure = () => {
      const cs = getComputedStyle(pane);
      const avail =
        pane.getBoundingClientRect().width -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
      setScale(Math.min(1, avail / PAIR_W));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pane);
    return () => ro.disconnect();
  }, []);
  return { paneRef, scale };
}

export default function DetailsCanvas({
  slug,
  title,
  heroImage,
  heroPreview,
  summary,
  platform,
  category,
  rewriteSrc,
}: {
  slug: string;
  title: string;
  heroImage: string | null;
  /** A session-only object URL for a hero picked but not yet reloaded from the draft branch. */
  heroPreview?: string | null;
  summary: string;
  platform: string;
  category: string;
  rewriteSrc?: (src: string) => string;
}) {
  const { paneRef, scale } = useFitPair();
  const pairRef = useRef<HTMLDivElement>(null);
  const [pairHeight, setPairHeight] = useState(0);
  useEffect(() => {
    const el = pairRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPairHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const src = resolveHeroSrc({ heroImage, previewUrl: heroPreview, rewriteSrc });

  // THE OPTIMIZER IS SKIPPED ONLY WHEN THE SRC IS NOT A PLAIN PUBLIC PATH. A committed path is
  // 200 through `/_next/image`; the draft proxy and a `blob:` both fail. The server log is what
  // names the cause — the optimizer's own refetch of the proxy url returns 401, because it does
  // not carry the owner cookie, and the 400 the browser sees is its outward response to that.
  // `src !== heroImage` is true only when resolveHeroSrc returned a proxy or a blob, which is
  // exactly the set that cannot be optimized.
  const unoptimized = src !== heroImage;

  // The card reads five of these; the rest exist because `ProjectListItem` is the whole type and
  // a partial would be a second shape to keep in step. `orderIndex`, `sectionCount`, `role` and
  // `timeline` are not rendered by the card on any surface.
  const project: ProjectListItem = {
    slug,
    title,
    summary,
    orderIndex: 0,
    heroImage: src,
    facts: { role: "", type: "", platform, timeline: "" },
    template: "",
    category,
    sectionCount: 0,
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-studio-cream-100">
      <div ref={paneRef} className="flex flex-col gap-6 px-6 py-6">
        {/* THE TWO STATES, each at the width a desktop reader actually gets — see CARD_W, which
            is measured on the page rather than derived from the container. */}
        {/* ⚠ THE SCALED BOX TAKES THE SCALED WIDTH *AND* HEIGHT, AND ONLY THE HEIGHT WAS DONE.
            A CSS transform does not change LAYOUT size: the pair below is `width: 1056px` however
            it is scaled, so it kept reserving 1056px of layout width and pushed a horizontal
            scrollbar onto the canvas — measured, the pane overflowed by 24px and the second card
            was clipped at the right edge.
            The height was corrected for exactly this reason and the comment said so; the same
            argument applies to the width and it was not applied. Both are stated now. */}
        <div
          style={{
            width: pairHeight ? PAIR_W * scale : undefined,
            height: pairHeight ? pairHeight * scale : undefined,
          }}
        >
        <div
          ref={pairRef}
          className="flex gap-6"
          style={{ width: PAIR_W, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {(
            [
              ["rest", "At rest", "What the work section shows."],
              ["hover", "On hover", "Where the summary appears."],
            ] as const
          ).map(([state, label, hint]) => (
            <div key={state} className="flex min-w-0 flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-bold uppercase tracking-eyebrow text-studio-ink-600">
                  {label}
                </span>
                <span className="text-[11px] text-studio-text-subtle">{hint}</span>
              </div>
              {/* THE ATTRIBUTE IS ON THE WRAPPER, NEVER ON THE CARD, so the two copies are the
                  same component with the same props and only an ancestor differs. The rule that
                  draws the hover lives in globals.css beside the public one it mirrors. */}
              <div
                data-card-state={state}
                style={{ width: CARD_W }}
                className="[&_.work-card]:pointer-events-none"
              >
                <ProjectCard project={project} unoptimized={unoptimized} />
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* CATEGORY'S PREVIEW IS THE FILTER ROW, because category is genuinely not on the card —
            it becomes `data-cat` and decides which tab the card appears under. Cheap to show and
            it has a real public consequence, which is why it gets a surface where `type` does
            not. The counts are the live work section's, not invented: this draws WHICH TAB, not
            how many. */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-bold uppercase tracking-eyebrow text-studio-ink-600">
            Filter row
          </span>
          <div className="flex items-center gap-1.5" role="group" aria-label="Filter preview">
            {FILTERS.map((f) => {
              const on = f === "all" || f === category;
              return (
                <span
                  key={f}
                  className={`rounded-full border px-3 py-1 text-[12px] font-semibold capitalize ${
                    on
                      ? "border-studio-accent-500/40 bg-studio-accent-500/10 text-studio-accent-600"
                      : "border-studio-ink-950/12 text-studio-text-subtle"
                  }`}
                >
                  {f}
                </span>
              );
            })}
            <span className="ml-1 text-[11px] text-studio-text-subtle">
              {category
                ? `This card appears under All and ${category}.`
                : "No category set — this card appears under All only."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
