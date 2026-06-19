import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import type { QuoteBlockData } from "@/lib/keystatic";

type Props = { data: QuoteBlockData["value"] };

export default function QuoteBlock({ data }: Props) {
  if (!data.text) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <blockquote className="max-w-[50ch]">
            <p className="font-display italic text-[--text-2xl] text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug]">
              {data.text}
            </p>
            {data.attribution && (
              <footer className="mt-6">
                <cite className="text-sm text-[--color-text-muted] not-italic">
                  {data.attribution}
                </cite>
              </footer>
            )}
          </blockquote>
        </Reveal>
      </Container>
    </SectionWrapper>
  );
}
