import RevealSection from "@/components/motion/RevealSection";
import type { Section } from "@/lib/case-studies/types";
import CaseSectionHeader from "./CaseSectionHeader";
import GlowWord from "./GlowWord";
import BlockRenderer from "./BlockRenderer";
import { isWideFrame } from "./DeviceImage";
import { renderRich } from "./rich";

/**
 * One section = one card. The hero variant renders statically (above the fold);
 * every other section rides RevealSection's clip-path reveal. The optional header
 * and glow ride the panel; repeating block items stagger via `.reveal-card`.
 */
export default function SectionRenderer({
  section,
  web = false,
}: {
  section: Section;
  /** CS-7b — template=web opts this section's blocks into the Bold-gallery
   *  treatments, and drives section-level treatments (e.g. a standalone pullQuote
   *  dark band). false → the existing mobile composition, byte-identical. */
  web?: boolean;
}) {
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
            <BlockRenderer key={i} block={block} web={web} />
          ))}
        </div>
      </div>
    </>
  );

  // "bare" — no card and no `overflow-hidden` (which would break a sticky pin). The
  // block owns its own card, track, sticky panel, and header (e.g. BeforeAfterStory's
  // scroll-pinned story). Just an anchor wrapper for the header-nav offset.
  if (section.variant === "bare") {
    return (
      <div id={section.id} className="scroll-mt-20">
        {section.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} web={web} />
        ))}
      </div>
    );
  }

  // CS-7a — the Bold-gallery web hero (template=web resolves the heroCover devices to
  // a wide browser/MacBook frame) renders on a DARK section card and owns its whole
  // identity, so the section-level header is suppressed here. Only the bg is overridden
  // (inline, since .section-card's cream bg is unlayered and wins over a utility); the
  // card geometry — margin, padding, radius, overflow clip — is reused as-is. Every
  // other hero/section is untouched and renders byte-identically.
  const heroBlock = section.blocks[0];
  const isWebHero =
    section.variant === "hero" &&
    heroBlock?.kind === "heroCover" &&
    (isWideFrame(heroBlock.devices[0]?.frame) || isWideFrame(heroBlock.devices[1]?.frame));

  if (isWebHero) {
    return (
      <section
        id={section.id}
        className="section-card py-section relative overflow-hidden scroll-mt-20"
        style={{ backgroundColor: "var(--color-band-dark)" }}
      >
        {section.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} web={web} />
        ))}
      </section>
    );
  }

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
