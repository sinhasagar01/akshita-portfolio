import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import ExperienceEntry from "./ExperienceEntry";
import type { ExperienceListItem } from "@/lib/keystatic";

type Props = { experience: ExperienceListItem[] };

export default function ExperienceSection({ experience }: Props) {
  if (experience.length === 0) return null;

  return (
    <SectionWrapper className="border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">Experience</SectionLabel>
        </Reveal>
        <ul className="flex flex-col divide-y divide-[--color-border] list-none p-0 m-0">
          {experience.map((entry, i) => (
            <li key={entry.slug}>
              <Reveal delay={Math.min(i * 0.06, 0.18)}>
                <ExperienceEntry entry={entry} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </SectionWrapper>
  );
}
