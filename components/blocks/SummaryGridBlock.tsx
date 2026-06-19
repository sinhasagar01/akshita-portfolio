import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { SummaryGridData } from "@/lib/keystatic";

type Props = { data: SummaryGridData["value"] };

const cells: { key: keyof SummaryGridData["value"]; label: string }[] = [
  { key: "product", label: "Product" },
  { key: "problem", label: "Problem" },
  { key: "details", label: "Details" },
  { key: "solution", label: "Solution" },
  { key: "result", label: "Result" },
];

export default function SummaryGridBlock({ data }: Props) {
  const hasContent = cells.some(({ key }) => !!data[key]);
  if (!hasContent) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <SectionLabel>Overview</SectionLabel>
        </Reveal>
        <Grid cols={12} className="mt-8">
          {cells.map(({ key, label }, i) => (
            <Reveal key={key} delay={Math.min(i * 0.06, 0.24)} className="col-span-4 md:col-span-2">
              <SectionLabel>{label}</SectionLabel>
              <p className="text-base text-[--color-text-primary] leading-[--leading-normal] mt-2">
                {data[key]}
              </p>
            </Reveal>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
