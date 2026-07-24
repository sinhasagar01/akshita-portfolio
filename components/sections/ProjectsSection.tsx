import Container from "@/components/layout/Container";
import RevealSection from "@/components/motion/RevealSection";
import SectionHeading from "@/components/ui/SectionHeading";
import CursorGlow from "@/components/motion/CursorGlow";
import ProjectCard from "./ProjectCard";
import WorkGridGlow from "./WorkGridGlow";
import type { ProjectListItem } from "@/lib/keystatic";

type Props = { projects: ProjectListItem[] };

export default function ProjectsSection({ projects }: Props) {
  if (projects.length === 0) return null;

  return (
    <RevealSection id="work" className="scroll-mt-20 glow-host glow-tan">
      {/* The same ONE cursor glow, in the tan tone (--glow-on-tan). */}
      <CursorGlow />
      <Container>
        <SectionHeading
          index="02"
          title="Work"
          subtext="A few projects from the last couple of years, from first sketch to shipped screen."
          variant="default"
          tone="warm"
        />
        <div className="mt-8 sm:mt-[52px]">
          {/* Overlay grid — two columns above lg, one below (the site's single mobile
              breakpoint), NOT the reference's 760px. Cards keep the reveal-card
              scroll-in. See app/globals.css .work-grid / .work-card. */}
          <ul className="work-grid list-none p-0 m-0">
            {projects.map((project) => (
              <li key={project.slug} className="reveal-card">
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
          {/* Client-only enhancer: the dock cascade (glow + recede). No-ops on touch and
              under reduced motion, where the CSS :hover glow stands in. */}
          <WorkGridGlow />
        </div>
      </Container>
    </RevealSection>
  );
}
