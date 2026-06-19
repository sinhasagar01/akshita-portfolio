import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function HeroSection({ settings }: Props) {
  if (!settings) return null;

  const hasHeadline = Boolean(settings.heroCopy);

  return (
    <section
      id="hero"
      className="min-h-[calc(100svh-4.5rem)] py-20 md:py-28"
    >
      <Container>
        <Grid cols={12} className="items-start gap-y-16">
          <div className="col-span-4 md:col-span-7 flex flex-col gap-8">
            <Reveal>
              <div className="flex flex-col gap-5">
                <SectionLabel>Product Designer</SectionLabel>

                {hasHeadline ? (
                  <>
                    <h1 className="font-display italic text-[--text-5xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[14ch]">
                      {settings.heroCopy}
                    </h1>
                    {settings.positioningLine && (
                      <p className="text-[--text-lg] text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[44ch]">
                        {settings.positioningLine}
                      </p>
                    )}
                  </>
                ) : (
                  settings.positioningLine && (
                    <p className="font-display italic text-[--text-4xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[20ch]">
                      {settings.positioningLine}
                    </p>
                  )
                )}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <a
                href="#work"
                className="group inline-flex items-center gap-2 text-sm font-medium text-[--color-accent] hover:text-[--color-accent-600] transition-colors duration-[--duration-base] w-fit"
              >
                View work
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-[--duration-base] ease-[--ease-out-expo] group-hover:translate-x-1"
                >
                  →
                </span>
              </a>
            </Reveal>
          </div>

          <div className="col-span-4 md:col-span-4 md:col-start-9">
            <Reveal delay={0.15}>
              <div className="relative aspect-[3/4] rounded-[--radius-lg] overflow-hidden bg-[--color-surface]">
                {settings.photo ? (
                  <Image
                    src={settings.photo}
                    alt="Portrait of Akshita"
                    fill
                    className="object-cover object-top"
                    priority
                    sizes="(max-width: 768px) 100vw, 36vw"
                  />
                ) : (
                  <ImagePlaceholder label="900 × 1200" />
                )}
              </div>
            </Reveal>
          </div>
        </Grid>
      </Container>
    </section>
  );
}
