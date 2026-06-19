import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { ProblemBlockData } from "@/lib/keystatic";

type Props = { data: ProblemBlockData["value"] };

export default function ProblemBlock({ data }: Props) {
  if (!data.statement) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <SectionLabel>Problem</SectionLabel>
          <p className="font-display italic text-[--text-3xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] mt-4 max-w-[36ch]">
            {data.statement}
          </p>
        </Reveal>
        <Reveal delay={0.08} className="mt-12">
          <div className="relative aspect-[16/9] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
            {data.image ? (
              <Image
                src={data.image}
                alt="Problem context"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 85vw"
              />
            ) : (
              <ImagePlaceholder label="1920 × 1080" />
            )}
          </div>
        </Reveal>
      </Container>
    </SectionWrapper>
  );
}
