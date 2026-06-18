import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
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
        <Grid cols={12}>
          {skills.categories.map((cat, i) => (
            <Reveal
              key={cat.category}
              delay={Math.min(i * 0.07, 0.21)}
              className="col-span-4 md:col-span-4"
            >
              <div className="flex flex-col gap-3">
                <SectionLabel>{cat.category}</SectionLabel>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 list-none p-0 m-0">
                  {cat.items.map((item) => (
                    <li
                      key={item}
                      className="text-sm text-[--color-text-secondary]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
