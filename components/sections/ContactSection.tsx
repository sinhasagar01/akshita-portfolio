import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

export default function ContactSection({ settings }: Props) {
  if (!settings) return null;

  return (
    <SectionWrapper
      id="contact"
      className="scroll-mt-20 border-t border-[--color-border]"
    >
      <Container>
        <Grid cols={12}>
          <div className="col-span-4 md:col-span-8 flex flex-col gap-10">
            <Reveal>
              <h2 className="font-display italic text-4xl text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[20ch]">
                Get in touch
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col gap-6">
                {settings.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="font-display italic text-2xl text-[--color-text-primary] underline underline-offset-4 decoration-1 hover:text-[--color-accent] transition-colors w-fit"
                  >
                    {settings.email}
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-6">
                  {settings.resumeUrl && (
                    <a
                      href={settings.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-[--color-accent] text-[--color-cream-50] rounded-[--radius-md] text-sm font-medium tracking-[--tracking-wide] hover:bg-[--color-accent-600] transition-colors"
                    >
                      View resume
                    </a>
                  )}
                  {settings.linkedinUrl && (
                    <a
                      href={settings.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                  {settings.dribbbleUrl && (
                    <a
                      href={settings.dribbbleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                    >
                      Dribbble
                    </a>
                  )}
                  {settings.behanceUrl && (
                    <a
                      href={settings.behanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                    >
                      Behance
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
