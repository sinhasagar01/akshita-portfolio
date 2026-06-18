import Image from "next/image";
import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function HeroSection({ settings }: Props) {
  if (!settings) return null;

  return (
    <section
      id="hero"
      className="min-h-svh flex flex-col justify-center py-[--spacing-section]"
    >
      <Container>
        <Grid cols={12} className="items-center gap-y-16">
          <div className="col-span-4 md:col-span-7 flex flex-col gap-8">
            <Reveal>
              <div className="flex flex-col gap-6">
                <SectionLabel>Product Designer</SectionLabel>
                <h1 className="font-display italic text-5xl text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[16ch]">
                  {settings.heroCopy}
                </h1>
                {settings.positioningLine && (
                  <p className="text-xl text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[46ch]">
                    {settings.positioningLine}
                  </p>
                )}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <a
                href="#work"
                className="inline-flex items-center gap-2 text-sm font-medium text-[--color-accent] underline underline-offset-4 decoration-1 hover:text-[--color-accent-600] transition-colors w-fit"
              >
                View work
              </a>
            </Reveal>
          </div>

          {settings.photo && (
            <div className="col-span-4 md:col-span-5">
              <Reveal delay={0.2}>
                <div className="relative aspect-[3/4] rounded-[--radius-lg] overflow-hidden bg-[--color-surface]">
                  <Image
                    src={settings.photo}
                    alt="Portrait of Akshita"
                    fill
                    className="object-cover object-top"
                    priority
                    sizes="(max-width: 768px) 100vw, 42vw"
                  />
                </div>
              </Reveal>
            </div>
          )}
        </Grid>
      </Container>
    </section>
  );
}
