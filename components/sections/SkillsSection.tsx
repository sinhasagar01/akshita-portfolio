import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SkillsEntry } from "@/lib/keystatic";

type Props = { skills: SkillsEntry | null };

export default function SkillsSection({ skills }: Props) {
  if (!skills || skills.categories.length === 0) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">Skills</SectionLabel>
        </Reveal>
        <div className="flex flex-col gap-10">
          {skills.categories.map((cat, i) => (
            <Reveal key={cat.category} delay={Math.min(i * 0.07, 0.21)}>
              <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8">
                <div className="md:w-28 md:shrink-0">
                  <p className="text-[11px] tracking-[.14em] uppercase text-[--color-accent] leading-none">
                    {cat.category}
                  </p>
                </div>
                <ul className="flex flex-wrap gap-[9px] list-none p-0 m-0">
                  {cat.items.map((item) => (
                    <li key={item}>
                      <span className="inline-flex items-center px-4 py-[9px] text-[14px] text-[--color-text-secondary] bg-[--color-cream-200] border border-[--color-border] rounded-full cursor-default select-none transition-[background-color,border-color,color,transform] duration-[250ms] hover:bg-white hover:border-[--color-accent]/45 hover:text-[--color-accent] motion-safe:hover:-translate-y-0.5">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  );
}
