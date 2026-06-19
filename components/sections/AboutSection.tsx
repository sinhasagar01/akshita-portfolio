import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function AboutSection({ settings }: Props) {
  if (!settings || !settings.aboutCopy) return null;

  const paragraphs = settings.aboutCopy
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const lead = paragraphs[0];
  const body = paragraphs[1];
  const note = settings.aboutNote || null;
  const chips = settings.aboutFocusChips ?? [];

  return (
    <SectionWrapper
      id="about"
      className="scroll-mt-20 overflow-hidden py-0! px-0!"
    >
      <div className="grid grid-cols-1 md:grid-cols-[.92fr_1.08fr] items-stretch">

        {/* Photo column — full-bleed left, warm grade at rest */}
        <div className="ab-photo min-h-[480px] lg:min-h-[560px]">
          <div className="ab-img">
            {settings.photo ? (
              <Image
                src={settings.photo}
                alt="Portrait of Akshita"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 46vw"
              />
            ) : (
              <ImagePlaceholder label="900 × 1200" />
            )}
          </div>
          {settings.photo && <div className="ab-tint" aria-hidden="true" />}
          <div className="ab-hint" aria-hidden="true">hover &#8594;</div>
          <div className="ab-cap">off the clock, painting under a tree</div>
        </div>

        {/* Bio column */}
        <div className="px-10 py-12 lg:px-14 lg:py-16 flex flex-col justify-center gap-5">

          <Reveal>
            <p
              className="text-[--color-text-muted] uppercase"
              style={{ fontSize: "var(--text-eyebrow)", letterSpacing: "var(--tracking-eyebrow)" }}
            >
              About
            </p>
          </Reveal>

          {lead && (
            <Reveal delay={0.05}>
              <p
                className="font-display italic text-[--color-text-primary]"
                style={{ fontSize: "var(--text-2xl)", lineHeight: "var(--leading-snug)", letterSpacing: "var(--tracking-snug)" }}
              >
                {lead}
              </p>
            </Reveal>
          )}

          {body && (
            <Reveal delay={0.1}>
              <p
                className="text-[--color-text-secondary] max-w-[50ch]"
                style={{ fontSize: "var(--text-base)", lineHeight: "var(--leading-relaxed)" }}
              >
                {body}
              </p>
            </Reveal>
          )}

          {note && (
            <Reveal delay={0.15}>
              <p
                className="font-display italic text-[--color-accent-500] max-w-[44ch]"
                style={{ fontSize: "var(--text-lg)", lineHeight: "var(--leading-snug)" }}
              >
                {note}
              </p>
            </Reveal>
          )}

          {chips.length > 0 && (
            <Reveal delay={0.2}>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="text-[11px] text-[--color-text-secondary] bg-[--color-cream-200] border border-[--color-border] rounded-full px-3 py-1.5"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </Reveal>
          )}

        </div>
      </div>
    </SectionWrapper>
  );
}
