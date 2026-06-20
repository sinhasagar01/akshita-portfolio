import Container from "@/components/layout/Container";
import RevealSection from "@/components/motion/RevealSection";
import SectionLabel from "@/components/ui/SectionLabel";
import type { SkillsEntry } from "@/lib/keystatic";

type Props = { skills: SkillsEntry | null };

export default function SkillsSection({ skills }: Props) {
  if (!skills || skills.categories.length === 0) return null;

  return (
    <RevealSection className="">
      <Container>
        <SectionLabel className="mb-12">Skills</SectionLabel>
        <div className="flex flex-col gap-10">
          {skills.categories.map((cat) => (
            <div key={cat.category} className="flex flex-col gap-3 md:flex-row md:items-baseline md:gap-8 reveal-card">
              <div className="md:w-28 md:shrink-0">
                <p className="text-[11px] tracking-[.14em] uppercase leading-none" style={{ color: 'var(--color-accent-500)' }}>
                  {cat.category}
                </p>
              </div>
              <ul className="flex flex-wrap gap-[9px] list-none p-0 m-0">
                {cat.items.map((item) => (
                  <li key={item}>
                    <span className="skill-pill">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </RevealSection>
  );
}
