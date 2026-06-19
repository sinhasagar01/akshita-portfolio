import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function AboutSection({ settings }: Props) {
  if (!settings || !settings.aboutCopy) return null;

  const paragraphs = settings.aboutCopy
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <SectionWrapper
      id="about"
      className="scroll-mt-20 border-t border-[--color-border]"
    >
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">About</SectionLabel>
        </Reveal>
        <Grid cols={12} className="items-start gap-y-16">
          <div className="col-span-4 md:col-span-6 flex flex-col gap-6">
            {paragraphs[0] && (
              <Reveal delay={0.05}>
                <p className="font-display italic text-[--text-2xl] text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] max-w-[38ch]">
                  {paragraphs[0]}
                </p>
              </Reveal>
            )}
            {paragraphs.slice(1).map((para, i) => (
              <Reveal key={i} delay={0.1 + i * 0.05}>
                <p className="text-[--text-base] text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[52ch]">
                  {para}
                </p>
              </Reveal>
            ))}
          </div>

          <div className="col-span-4 md:col-span-4 md:col-start-9">
            <Reveal delay={0.1}>
              <div className="relative aspect-[3/4] rounded-[--radius-lg] overflow-hidden bg-[--color-surface]">
                {settings.photo ? (
                  <Image
                    src={settings.photo}
                    alt="Portrait of Akshita"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 34vw"
                  />
                ) : (
                  <ImagePlaceholder label="900 × 1200" />
                )}
              </div>
            </Reveal>
          </div>
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
