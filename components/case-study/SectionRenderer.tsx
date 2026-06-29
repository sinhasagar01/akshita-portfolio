import RevealSection from "@/components/motion/RevealSection";
import type { Section } from "@/lib/case-studies/types";
import CaseSectionHeader from "./CaseSectionHeader";
import GlowWord from "./GlowWord";
import BlockRenderer from "./BlockRenderer";
import { renderRich } from "./rich";

/**
 * One section = one card. The hero variant renders statically (above the fold);
 * every other section rides RevealSection's clip-path reveal. The optional header
 * and glow ride the panel; repeating block items stagger via `.reveal-card`.
 */
export default function SectionRenderer({ section }: { section: Section }) {
  const hasHeader = Boolean(
    section.index || section.eyebrow || section.title || section.lead,
  );

  const inner = (
    <>
      {section.glow && <GlowWord word={section.glow} />}
      <div className="relative z-[1]">
        {hasHeader && (
          <CaseSectionHeader
            index={section.index}
            eyebrow={section.eyebrow}
            title={section.title}
            lead={section.lead}
          />
        )}
        {section.northStar && (
          <p className="font-display italic font-normal text-3xl text-ink-950 leading-[1.3] max-w-[850px] mt-6">
            {renderRich(section.northStar)}
          </p>
        )}
        <div
          className={`${
            section.layout === "split"
              ? "grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
              : "flex flex-col gap-12"
          } ${hasHeader || section.northStar ? "mt-10" : ""}`}
        >
          {section.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      </div>
    </>
  );

  // "hero" (above the fold) and "static" (e.g. the Work story, which manages its own
  // in-view start) render as a plain card — no RevealSection clip reveal.
  if (section.variant === "hero" || section.variant === "static") {
    return (
      <section
        id={section.id}
        className="section-card py-section relative overflow-hidden scroll-mt-20"
      >
        {inner}
      </section>
    );
  }

  return (
    <RevealSection id={section.id} className="relative overflow-hidden scroll-mt-20">
      {inner}
    </RevealSection>
  );
}
