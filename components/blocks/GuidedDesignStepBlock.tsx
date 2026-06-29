import Image from "next/image";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { GuidedDesignStepData } from "@/lib/keystatic";

type Props = { data: GuidedDesignStepData["value"] };

export default function GuidedDesignStepBlock({ data }: Props) {
  if (!data.title) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Grid cols={12} className="items-center">
          <Reveal className="col-span-4 md:col-span-5">
            <SectionLabel>Design</SectionLabel>
            <h3 className="font-body font-semibold text-2xl text-[--color-text-primary] leading-[--leading-snug] mt-2">
              {data.title}
            </h3>
            {data.caption && (
              <p className="text-base text-[--color-text-secondary] leading-[--leading-relaxed] mt-4 max-w-[44ch]">
                {data.caption}
              </p>
            )}
          </Reveal>
          <Reveal delay={0.05} className="col-span-4 md:col-span-7">
            <div className="relative aspect-[4/3] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
              {data.image ? (
                <Image
                  src={data.image}
                  alt={data.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
              ) : (
                <ImagePlaceholder label="1200 × 900" />
              )}
            </div>
          </Reveal>
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
