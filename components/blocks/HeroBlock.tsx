import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import type { HeroBlockData } from "@/lib/keystatic";

type Props = { data: HeroBlockData["value"] };

export default function HeroBlock({ data }: Props) {
  if (!data.thesis) return null;

  return (
    <SectionWrapper>
      <Container>
        <Reveal>
          <h1 className="font-display italic text-[--text-4xl] md:text-[--text-5xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] max-w-[24ch]">
            {data.thesis}
          </h1>
        </Reveal>
      </Container>
    </SectionWrapper>
  );
}
