import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import Reveal from "@/components/motion/Reveal";
import SectionLabel from "@/components/ui/SectionLabel";
import ProjectCard from "./ProjectCard";
import type { ProjectListItem } from "@/lib/keystatic";

type Props = { projects: ProjectListItem[] };

export default function ProjectsSection({ projects }: Props) {
  if (projects.length === 0) return null;

  return (
    <SectionWrapper id="work" className="scroll-mt-20 border-t border-[--color-border]">
      <Container>
        <Reveal>
          <SectionLabel className="mb-12">Work</SectionLabel>
        </Reveal>
        <Grid cols={12} as="ul" className="list-none p-0 m-0">
          {projects.map((project, i) => (
            <li key={project.slug} className="col-span-4 md:col-span-6">
              <Reveal delay={Math.min(i * 0.08, 0.24)}>
                <ProjectCard project={project} />
              </Reveal>
            </li>
          ))}
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
