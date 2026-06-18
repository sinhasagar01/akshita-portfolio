import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import type { GoalsBlockData } from "@/lib/keystatic";

type Props = { data: GoalsBlockData["value"] };

export default function GoalsBlock({ data }: Props) {
  if (!data.northStar && !data.goals.length) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel>Goals</SectionLabel>
          {data.northStar && (
            <p className="font-display italic text-[--text-2xl] text-[--color-text-primary] leading-[--leading-snug] tracking-[--tracking-snug] mt-4 max-w-[52ch]">
              {data.northStar}
            </p>
          )}
        </Reveal>
        {data.goals.length > 0 && (
          <ol className="list-none p-0 m-0 mt-10 flex flex-col gap-4">
            {data.goals.map((goal, i) => (
              <Reveal key={i} delay={Math.min(i * 0.06, 0.24)}>
                <li className="flex gap-6 items-start border-t border-[--color-border] pt-4">
                  <span className="font-display italic text-[--text-xl] text-[--color-text-muted] w-8 shrink-0 leading-none mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base text-[--color-text-secondary] leading-[--leading-relaxed]">
                    {goal}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        )}
      </Container>
    </SectionWrapper>
  );
}
