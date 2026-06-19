import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { ProcessStepsData } from "@/lib/keystatic";

type Props = { data: ProcessStepsData["value"] };

export default function ProcessStepsBlock({ data }: Props) {
  if (!data.steps.length) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <SectionLabel>Process</SectionLabel>
        </Reveal>
        <Grid cols={12} className="mt-8">
          {data.steps.map((step, i) => (
            <Reveal key={i} delay={Math.min(i * 0.07, 0.28)} className="col-span-4 md:col-span-3">
              <p className="font-display italic text-[--text-xl] text-[--color-text-primary] leading-[--leading-snug]">
                {step.phase}
              </p>
              {step.description && (
                <p className="text-sm text-[--color-text-secondary] leading-[--leading-relaxed] mt-2">
                  {step.description}
                </p>
              )}
            </Reveal>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
