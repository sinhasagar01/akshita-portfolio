import Image from "next/image";
import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function AboutSection({ settings }: Props) {
  if (!settings || !settings.aboutCopy) return null;

  return (
    <SectionWrapper
      id="about"
      className="scroll-mt-20 border-t border-[--color-border]"
    >
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">About</SectionLabel>
        </Reveal>
        <Grid cols={12} className="items-center gap-y-16">
          <div className="col-span-4 md:col-span-7 flex flex-col gap-6">
            <Reveal delay={0.05}>
              <p className="font-display italic text-3xl text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[32ch]">
                {settings.aboutCopy}
              </p>
            </Reveal>
          </div>

          {settings.photo && (
            <div className="col-span-4 md:col-span-4 md:col-start-9">
              <Reveal delay={0.15}>
                <div className="relative aspect-[3/4] rounded-[--radius-lg] overflow-hidden bg-[--color-surface]">
                  <Image
                    src={settings.photo}
                    alt="Portrait of Akshita"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 34vw"
                  />
                </div>
              </Reveal>
            </div>
          )}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
