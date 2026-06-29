import type { CaseStudy } from "@/lib/case-studies/types";
import SectionRenderer from "./SectionRenderer";

/**
 * The one shared renderer. Maps a study's sections to cards. An empty `sections`
 * array (a scaffolded study) renders a clearly-marked "Coming soon" placeholder.
 */
export default function CaseStudyView({ study }: { study: CaseStudy }) {
  return (
    <>
      {/* Route-scoped warm sand background (spec A1) — see .case-study-bg in globals.css. */}
      <div aria-hidden className="case-study-bg" />
      <main className="container-x">
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
            {study.sections.map((section, i) => (
              <SectionRenderer key={section.id ?? i} section={section} />
            ))}
          </article>
        )}
      </main>
    </>
  );
}
