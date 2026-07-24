import type { CaseStudy } from "@/lib/case-studies/types";
import SectionRenderer from "./SectionRenderer";

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
  return (
    <>
      {/* Route-scoped warm sand background (spec A1) — see .case-study-bg in globals.css. */}
      <div aria-hidden className="case-study-bg" />
      {heroSection && (
        <SectionRenderer section={heroSection} web={web} asGround />
      )}
      <main id="main-content" tabIndex={-1} className="container-x outline-none">
        {study.sections.length === 0 ? (
          <section className="case-study section-card py-section relative overflow-hidden text-center">
            <p className="text-eyebrow tracking-[0.2em] uppercase font-semibold text-text-subtle">
              {study.title}
            </p>
            <h1 className="font-display italic font-normal text-4xl text-ink-950 mt-4">
              Coming soon
            </h1>
            <p className="text-lg text-ink-600 mt-4 max-w-[52ch] mx-auto">
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
