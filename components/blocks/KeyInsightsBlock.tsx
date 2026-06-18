import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { KeyInsightsData } from "@/lib/keystatic";

type Props = { data: KeyInsightsData["value"] };

export default function KeyInsightsBlock({ data }: Props) {
  if (!data.insights.length) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel>Key insights</SectionLabel>
        </Reveal>
        <ul className="list-none p-0 m-0 mt-10 flex flex-col divide-y divide-[--color-border]">
          {data.insights.map((item, i) => (
            <Reveal key={i} delay={Math.min(i * 0.06, 0.24)}>
              <li className="py-8 grid grid-cols-4 md:grid-cols-12 gap-8 md:gap-12">
                <div className="col-span-1 md:col-span-2">
                  <p className="font-display italic text-[--text-3xl] text-[--color-text-muted] leading-none">
                    {item.number}
                  </p>
                </div>
                <div className="col-span-3 md:col-span-9">
                  <p className="text-base text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[60ch]">
                    {item.insight}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </Container>
    </SectionWrapper>
  );
}
