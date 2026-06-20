import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import ExperienceEntry from "./ExperienceEntry";
import type { ExperienceListItem } from "@/lib/keystatic";

type Props = { experience: ExperienceListItem[] };

export default function ExperienceSection({ experience }: Props) {
  if (experience.length === 0) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <SectionHeading
          index="04"
          title="Experience"
          subtext="Where I have shaped products, the most recent first."
          variant="default"
          tone="warm"
        />
        <div className="mt-8 sm:mt-[52px]">
        <ul className="flex flex-col divide-y divide-[--color-border] list-none p-0 m-0">
          {experience.map((entry, i) => (
            <li key={entry.slug}>
              <Reveal delay={Math.min(i * 0.06, 0.18)}>
                <ExperienceEntry entry={entry} />
              </Reveal>
            </li>
          ))}
        </ul>
        </div>
      </Container>
    </SectionWrapper>
  );
}
