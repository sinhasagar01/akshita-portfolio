import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SkillsEntry } from "@/lib/keystatic";

type Props = { skills: SkillsEntry | null };

export default function SkillsSection({ skills }: Props) {
  if (!skills || skills.categories.length === 0) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">Skills</SectionLabel>
        </Reveal>
        <div className="flex flex-col gap-10">
          {skills.categories.map((cat, i) => (
            <Reveal key={cat.category} delay={Math.min(i * 0.07, 0.21)}>
              <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8">
                <div className="md:w-28 md:shrink-0">
                  <SectionLabel>{cat.category}</SectionLabel>
                </div>
                <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                  {cat.items.map((item) => (
                    <li key={item}>
                      <span className="inline-flex items-center px-[1.125rem] py-[0.625rem] text-[--text-sm] text-[--color-text-secondary] border border-[--color-border] rounded-[--radius-full] bg-[--color-background] cursor-default select-none hover:border-[--color-accent] hover:text-[--color-accent] hover:bg-[--color-accent]/8 motion-safe:transition-all motion-safe:duration-[--duration-fast] motion-safe:hover:-translate-y-px">
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
