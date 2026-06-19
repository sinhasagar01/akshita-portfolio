import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import type { ClosingLineData } from "@/lib/keystatic";

type Props = { data: ClosingLineData["value"] };

export default function ClosingLineBlock({ data }: Props) {
  if (!data.line) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <p className="font-display italic text-[--text-4xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[28ch]">
            {data.line}
          </p>
        </Reveal>
      </Container>
    </SectionWrapper>
  );
}
