import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { SolutionRevealData } from "@/lib/keystatic";

type Props = { data: SolutionRevealData["value"] };

export default function SolutionRevealBlock({ data }: Props) {
  if (!data.headline) return null;

  return (
    <div>
      <SectionWrapper className="">
        <Container>
          <Reveal>
            <SectionLabel>Solution</SectionLabel>
            <h2 className="font-display italic text-[--text-4xl] text-[--color-text-primary] leading-[--leading-tight] tracking-[--tracking-tight] mt-4 max-w-[28ch]">
              {data.headline}
            </h2>
          </Reveal>
        </Container>
      </SectionWrapper>
      <Container>
        <Reveal>
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-[--color-surface]">
            {data.image ? (
              <Image
                src={data.image}
                alt="Solution visual"
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <ImagePlaceholder label="2100 × 900" />
            )}
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
