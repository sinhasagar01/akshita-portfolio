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
      className="scroll-mt-20"
    >
      <Container>
        <Grid cols={12}>
          <div className="col-span-4 md:col-span-8 flex flex-col gap-10">
            <Reveal>
              <h2 className="font-display italic text-[--text-4xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[20ch]">
                Get in touch
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex flex-col gap-8">
                {settings.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="group inline-flex items-center gap-2 font-display italic text-[--text-2xl] text-[--color-text-primary] hover:text-[--color-accent] transition-colors duration-[--duration-base] w-fit"
                  >
                    {settings.email}
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-[--duration-base] ease-[--ease-out-expo] group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </a>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  {settings.resumeUrl && (
                    <a
                      href={settings.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 px-5 py-2.5 bg-[--color-ink-950] text-[--color-cream-50] rounded-[--radius-md] text-sm font-medium tracking-[--tracking-wide] hover:bg-[--color-ink-800] transition-colors duration-[--duration-base]"
                    >
                      Resume
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-[--duration-base] ease-[--ease-out-expo] group-hover:translate-x-0.5"
                      >
                        ↗
                      </span>
                    </a>
                  )}
                  {settings.linkedinUrl && (
                    <a
                      href={settings.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors duration-[--duration-base]"
                    >
                      LinkedIn
                    </a>
                  )}
                  {settings.dribbbleUrl && (
                    <a
                      href={settings.dribbbleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors duration-[--duration-base]"
                    >
                      Dribbble
                    </a>
                  )}
                  {settings.behanceUrl && (
                    <a
                      href={settings.behanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link text-sm text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors duration-[--duration-base]"
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
