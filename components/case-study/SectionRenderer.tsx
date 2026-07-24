import RevealSection from "@/components/motion/RevealSection";
import CursorGlow from "@/components/motion/CursorGlow";
import type { Section } from "@/lib/case-studies/types";
import CaseSectionHeader from "./CaseSectionHeader";
import GlowWord from "./GlowWord";
import BlockRenderer from "./BlockRenderer";
import PullQuote from "./blocks/PullQuote";
import { isWideFrame } from "./DeviceImage";
import { renderRich } from "./rich";
import { EDIT_AFFORD } from "./editable";

/**
 * One section = one card. The hero variant renders statically (above the fold);
 * every other section rides RevealSection's clip-path reveal. The optional header
 * and glow ride the panel; repeating block items stagger via `.reveal-card`.
 */
export default function SectionRenderer({
  section,
  web = false,
  noReveal = false,
  editable = false,
  asGround = false,
  heroGlow,
}: {
  section: Section;
  /** Hero-as-ground: the public page renders the hero as the page's full-bleed floor
   *  (a sibling of <main>), not a card. Only the hero variant honours it; the studio
   *  canvas never passes it, so the editor panel keeps the card treatment unchanged. */
  asGround?: boolean;
  /** CS-7b — template=web opts this section's blocks into the Bold-gallery
   *  treatments, and drives section-level treatments (e.g. a standalone pullQuote
   *  dark band). false → the existing mobile composition, byte-identical. */
  web?: boolean;
  /** CS-7c — the studio inline canvas renders a single section in a static panel
   *  where RevealSection's in-view clip would never trigger, so the section would
   *  stay hidden. `noReveal` renders the standard section as a plain always-visible
   *  card instead. Defaults off, so the public site is byte-identical. */
  noReveal?: boolean;
  /** CS-7d — studio inline canvas: tag plain-string text (section eyebrow/title,
   *  pullQuote/closingLine text) as in-place editable. Off by default → public
   *  render byte-identical. */
  editable?: boolean;
  /** The behind-the-phones hero glow theme, set per study by CaseStudyView on the
   *  public hero only (asGround). Drives the aura inside HeroCover and suppresses the
   *  generic CursorGlow here, so a themed hero owns its own light. */
  heroGlow?: "pulse" | "signal";
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
            editable={editable}
          />
        )}
        {section.northStar && (
          <p
            {...(editable
              ? {
                  contentEditable: true,
                  suppressContentEditableWarning: true,
                  tabIndex: 0,
                  role: "textbox",
                  "aria-label": "Edit north star",
                  "data-edit": "northStar",
                  "data-edit-rich": "",
                }
              : {})}
            className={`font-display italic font-normal text-3xl text-ink-950 leading-[1.3] max-w-[850px] mt-6${editable ? EDIT_AFFORD : ""}`}
          >
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
            <BlockRenderer key={i} block={block} web={web} editable={editable} blockIndex={i} heroGlow={heroGlow} />
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
          <BlockRenderer key={i} block={block} web={web} editable={editable} blockIndex={i} />
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
    // As ground (public page): the dark full-bleed floor. As a card (studio canvas):
    // the original dark band, byte-identical.
    return (
      <section
        id={section.id}
        className={
          asGround
            ? "hero-ground hero-ground--peek is-dark scroll-mt-20"
            : "section-card py-section relative overflow-hidden scroll-mt-20"
        }
        style={asGround ? undefined : { backgroundColor: "var(--color-band-dark)" }}
      >
        {asGround && <CursorGlow />}
        {section.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} web={web} editable={editable} blockIndex={i} />
        ))}
      </section>
    );
  }

  // "hero" (above the fold) and "static" (e.g. the Work story, which manages its own
  // in-view start) render as a plain card — no RevealSection clip reveal. The hero, on
  // the public page, is the full-bleed ground instead (asGround); the studio canvas keeps
  // the card.
  if (section.variant === "hero" || section.variant === "static") {
    const ground = asGround && section.variant === "hero";
    return (
      <section
        id={section.id}
        className={
          ground
            ? "hero-ground hero-ground--peek scroll-mt-20"
            : "section-card py-section relative overflow-hidden scroll-mt-20"
        }
      >
        {/* A themed hero carries its own behind-the-phones aura (HeroAura), so the
            generic cursor-follow glow steps aside; un-themed heroes keep it. */}
        {ground && !heroGlow && <CursorGlow />}
        {inner}
      </section>
    );
  }

  // CS-7b — a STANDALONE pullQuote (the only block in its section) under template=web
  // becomes a Bold-gallery dark quote band: the section identity on-dark, the quote in
  // on-dark-quote serif, and a giant faint numeral from the section index. A paired
  // pullQuote (with siblings) stays inline (BlockRenderer's web serif variant). Mobile
  // and non-standalone are untouched — the standard cream card below.
  const soleBlock = section.blocks.length === 1 ? section.blocks[0] : undefined;
  if (web && soleBlock?.kind === "pullQuote") {
    return (
      <section
        id={section.id}
        className="section-card py-section relative overflow-hidden scroll-mt-20"
        style={{ backgroundColor: "var(--color-band-dark)" }}
      >
        {section.index && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 right-6 z-0 select-none font-display leading-[0.8]"
            style={{
              color: "color-mix(in oklch, var(--color-accent-500) 13%, transparent)",
              fontSize: "clamp(6rem, 14vw, 10rem)",
            }}
          >
            {section.index}
          </span>
        )}
        <div className="relative z-[1]">
          {section.eyebrow && (
            <p className="text-eyebrow tracking-[0.16em] uppercase font-semibold text-on-dark-muted">
              {section.eyebrow}
            </p>
          )}
          {section.title && (
            <h2 className="font-display font-normal text-[clamp(1.75rem,3vw,2.25rem)] text-on-dark leading-[1.12] tracking-tight mt-3 whitespace-pre-line">
              {section.title}
            </h2>
          )}
          <div className={section.eyebrow || section.title ? "mt-6" : ""}>
            <PullQuote text={soleBlock.text} web dark editable={editable} blockIndex={0} />
          </div>
        </div>
      </section>
    );
  }

  // CS-7c — the inline canvas renders in a static panel, so skip RevealSection's
  // in-view clip (which would leave the section hidden) and render a plain card.
  if (noReveal) {
    return (
      <section id={section.id} className="section-card py-section relative overflow-hidden scroll-mt-20">
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
