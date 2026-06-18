import Image from "next/image";
import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { ComparisonData } from "@/lib/keystatic";

type Props = { data: ComparisonData["value"] };

export default function ComparisonBlock({ data }: Props) {
  if (!data.beforeImage && !data.afterImage) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel>Before and after</SectionLabel>
        </Reveal>
        <Grid cols={12} className="mt-8">
          {[
            { src: data.beforeImage, label: "Before" },
            { src: data.afterImage, label: "After" },
          ].map(({ src, label }) => (
            <Reveal key={label} className="col-span-4 md:col-span-6">
              <p className="text-xs tracking-[--tracking-widest] uppercase text-[--color-text-muted] mb-3">
                {label}
              </p>
              <div className="relative aspect-[4/3] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
                {src && (
                  <Image
                    src={src}
                    alt={label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}
              </div>
            </Reveal>
          ))}
        </Grid>
        {data.caption && (
          <Reveal delay={0.08}>
            <p className="text-sm text-[--color-text-muted] leading-[--leading-normal] mt-4">
              {data.caption}
            </p>
          </Reveal>
        )}
      </Container>
    </SectionWrapper>
  );
}
