import Container from "@/components/layout/Container";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeading from "@/components/ui/SectionHeading";
import SkillsBody from "@/components/sections/SkillsBody";
import type { SkillsEntry } from "@/lib/keystatic";

type Props = { skills: SkillsEntry | null };

export default function SkillsSection({ skills }: Props) {
  if (!skills || skills.categories.length === 0) return null;

  return (
    <RevealSection id="skills" className="overflow-hidden scroll-mt-20">
      <Container>
        <SectionHeading
          index="05"
          title="Skills"
          subtext="Design, research, and the craft to carry an idea to a shipped screen."
          variant="default"
          tone="grey"
        />
        <SkillsBody categories={skills.categories} />
      </Container>
    </RevealSection>
  );
}
