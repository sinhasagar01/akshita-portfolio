import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "./ProjectCard";
import type { ProjectListItem } from "@/lib/keystatic";

type Props = { projects: ProjectListItem[] };

export default function ProjectsSection({ projects }: Props) {
  if (projects.length === 0) return null;

  return (
    <RevealSection id="work" className="scroll-mt-20">
      <Container>
        <SectionHeading
          index="02"
          title="Work"
          subtext="A few projects from the last couple of years, from first sketch to shipped screen."
          variant="bleed"
          tone="warm"
        />
        <div className="mt-8 sm:mt-[52px]">
          <Grid cols={12} as="ul" className="list-none p-0 m-0">
            {projects.map((project) => (
              <li key={project.slug} className="col-span-4 md:col-span-6 reveal-card">
                <ProjectCard project={project} />
              </li>
            ))}
          </Grid>
        </div>
      </Container>
    </RevealSection>
  );
}
