import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { ImpactNumbersData } from "@/lib/keystatic";

type Props = { data: ImpactNumbersData["value"] };

export default function ImpactNumbersBlock({ data }: Props) {
  const stats = [
    { number: data.stat1Number, label: data.stat1Label },
    { number: data.stat2Number, label: data.stat2Label },
    { number: data.stat3Number, label: data.stat3Label },
  ];
  if (stats.every((s) => !s.number)) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <SectionLabel>Impact</SectionLabel>
        </Reveal>
        <Grid cols={12} className="mt-8">
          {stats.map((stat, i) => (
            <Reveal key={i} delay={i * 0.08} className="col-span-4 md:col-span-4">
              <p className="font-display italic text-[--text-5xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight]">
                {stat.number}
              </p>
              {stat.label && (
                <p className="text-sm text-[--color-text-muted] mt-2 leading-[--leading-normal]">
                  {stat.label}
                </p>
              )}
            </Reveal>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
