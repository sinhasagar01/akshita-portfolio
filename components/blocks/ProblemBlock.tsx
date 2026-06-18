import Image from "next/image";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { ProblemBlockData } from "@/lib/keystatic";

type Props = { data: ProblemBlockData["value"] };

export default function ProblemBlock({ data }: Props) {
  if (!data.statement) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel>Problem</SectionLabel>
          <p className="font-display italic text-[--text-3xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] mt-4 max-w-[36ch]">
            {data.statement}
          </p>
        </Reveal>
        {data.image && (
          <Reveal delay={0.08} className="mt-12">
            <div className="relative aspect-[16/9] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
              <Image
                src={data.image}
                alt="Problem context"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 85vw"
              />
            </div>
          </Reveal>
        )}
      </Container>
    </SectionWrapper>
  );
}
