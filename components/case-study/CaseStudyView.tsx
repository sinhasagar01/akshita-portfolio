import type { CaseStudy } from "@/lib/case-studies/types";
import SectionRenderer from "./SectionRenderer";
import ImagePreview from "./ImagePreview";

/** Per-study behind-the-phones hero glow (see HeroAura). Only the two mobile studies
 *  are themed; every other slug is absent and keeps the generic hero glow. */
/* ⚠ A PER-SLUG MAP WITH NO REMOVAL CONDITION — hazard 22's shape, recorded rather than fixed.
 *
 * It now chooses a BLUR AND AN ANIMATION and nothing else. #334 read it as product branding and
 * built a boundary ruling on that reading; the map does not follow the product — `elevate-one-view`
 * carried the violet treatment — so the colours collapsed onto the accent and this map's colour
 * meaning went with them.
 *
 * IT IS A SMALLER HAZARD THAN IT WAS AND A MORE HONEST ONE. Which treatment a study gets is an
 * editorial choice, and a hand-typed list may be the truthful form of that. What it must not become
 * again is a thing other reasoning rests on: a rule that cites this map is citing a list, not a
 * property of anything. */
const HERO_GLOW: Record<string, "pulse" | "signal"> = {
  "boat-crest": "pulse",
  "elevate-one-view": "signal",
};

/**
 * The one shared renderer. Maps a study's sections to cards. An empty `sections`
 * array (a scaffolded study) renders a clearly-marked "Coming soon" placeholder.
 */
export default function CaseStudyView({ study }: { study: CaseStudy }) {
  // CS-7b — the one place the template resolves to a boolean. Threaded down to every
  // section/block so the Bold-gallery web treatments key off it. "web" opts in;
  // everything else (mobile / absent) keeps the existing composition.
  const web = study.template === "web";
  // Hero as ground: the hero is the page's full-bleed floor, a SIBLING of <main>, so it
  // escapes the container's max-width + padding without a 100vw trick. The body sections
  // keep the card + gutter inside <main>. The rail is derived from the same body split
  // (railItems filters the hero), so its positional resolution stays aligned.
  const heroSection = study.sections.find((s) => s.variant === "hero") ?? null;
  const bodySections = study.sections.filter((s) => s.variant !== "hero");
  // The two mobile studies carry a themed behind-the-phones hero glow, keyed off the
  // slug (the one signal that reaches this public renderer for both routes). Absent →
  // the hero keeps the generic cursor-follow glow. Public hero only; the studio canvas
  // renders sections without this, so it stays un-themed like CursorGlow.
  const heroGlow = HERO_GLOW[study.slug];
  return (
    <>
      {/* Route-scoped warm sand background (spec A1) — see .case-study-bg in globals.css. */}
      <div aria-hidden className="case-study-bg" />
{/* ⚠ ONE PROVIDER FOR THE WHOLE PAGE, mounted unconditionally. It renders null until
          something is clicked, and the per-image switch lives on the images: an image with the
          preview off emits no `data-preview-src`, so it is neither clickable nor badged.

          ⚠ IT WAS GATED ON A PER-STUDY FLAG FOR ONE UNIT AND THAT WAS THE WRONG GRAIN. One control
          for thirty images can only answer for all of them at once, and it sat in the Details panel
          beside Template and Category — nowhere near any image it governed. The gate is gone rather
          than kept alongside, because two controls for one question is the shape that leaves nobody
          able to say which one won.

          The alternative — a prop threaded through `SectionRenderer` and every block — would have
          been six files of plumbing for a boolean, with six chances to miss one. */}
      <ImagePreview />
      {heroSection && (
        <SectionRenderer section={heroSection} web={web} asGround heroGlow={heroGlow} />
      )}
      {/* When no hero renders (a scaffolded study with zero sections), this <main> is the
          page's first element under the now-fixed nav, so reserve the nav's runway on it —
          the hero-ground routes do this in their own top padding. */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`container-x outline-none${heroSection ? "" : " pt-[var(--hero-nav-runway)]"}`}
      >
        {study.sections.length === 0 ? (
          <section className="case-study section-card py-section relative overflow-hidden text-center">
            <p className="text-eyebrow tracking-[0.2em] uppercase font-semibold text-text-subtle">
              {study.title}
            </p>
            {/* ⚠ THE ONE MEMBER OF THE ITALIC CENSUS NOBODY HAS EVER SEEN. This renders only for a
                study with zero sections, and all four have some — so it has been unreachable for as
                long as it has existed, which is precisely the kind that decays without a gate.
                `typography` E1 names it, which is how it got converted at all. */}
            <h1 className="sheet-h2 mx-auto mt-4">
              Coming soon
            </h1>
            <p className="text-lg text-text-secondary mt-4 max-w-[52ch] mx-auto">
              This case study is being written. Check back shortly.
            </p>
          </section>
        ) : (
          <article className="case-study">
            {bodySections.map((section, i) => (
              <SectionRenderer key={section.id ?? i} section={section} web={web} />
            ))}
          </article>
        )}
      </main>
    </>
  );
}
