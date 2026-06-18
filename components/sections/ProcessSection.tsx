import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

const STEPS = [
  { label: "Discover", key: "discoverText" },
  { label: "Define", key: "defineText" },
  { label: "Develop", key: "developText" },
  { label: "Deliver", key: "deliverText" },
] as const;

export default function ProcessSection({ settings }: Props) {
  if (!settings) return null;

  const hasAnyStep = STEPS.some((s) => settings[s.key]);
  if (!hasAnyStep) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">Process</SectionLabel>
        </Reveal>
        <Grid cols={12}>
          {STEPS.map((step, i) => (
            <Reveal
              key={step.label}
              delay={Math.min(i * 0.07, 0.21)}
              className="col-span-4 md:col-span-3"
            >
              <div className="flex flex-col gap-3">
                <p className="font-display italic text-xl text-[--color-text-primary]">
                  {step.label}
                </p>
                {settings[step.key] && (
                  <p className="text-sm text-[--color-text-secondary] leading-[--leading-relaxed]">
                    {settings[step.key]}
                  </p>
                )}
              </div>
            </Reveal>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
