import Container from "@/components/layout/Container";
import RevealSection from "@/components/motion/RevealSection";
import SheetSectionHead from "@/components/sheet/SheetSectionHead";
import CursorGlow from "@/components/motion/CursorGlow";
import ProjectCard from "./ProjectCard";
import WorkGridGlow from "./WorkGridGlow";
import WorkFilter from "./WorkFilter";
import type { ProjectListItem } from "@/lib/keystatic";

type Props = { projects: ProjectListItem[] };

export default function ProjectsSection({ projects }: Props) {
  if (projects.length === 0) return null;

  // Counts DERIVE from the rendered list (never authored). An "" (uncategorised) study
  // counts only in `all`, so web + mobile need not sum to all — see WorkFilter (A4).
  const counts = {
    all: projects.length,
    web: projects.filter((p) => p.category === "web").length,
    mobile: projects.filter((p) => p.category === "mobile").length,
  };

  return (
    <RevealSection id="work" className="scroll-mt-20 glow-host glow-tan">
      {/* The same ONE cursor glow, in the tan tone (--glow-on-tan). */}
      <CursorGlow />
      <Container>
        {/* ⚠ THE RULE'S LABEL DERIVES ITS COUNT, because an authored "four studies" is the
            fixed-list defect waiting for a fifth case study. The same `counts` the filter
            already derives from the rendered list feeds it, so the label and the chips cannot
            disagree about how many studies exist. */}
        <SheetSectionHead
          sheet="01"
          title="Work"
          mark={`Plate schedule · ${counts.all} studies`}
          lede="A few projects from the last couple of years, from first sketch to shipped screen."
        />
        {/* Platform filter (PR 4) — its per-bucket counts double as the live count, so the
            section head stays (no separate "N case studies" line). */}
        <WorkFilter counts={counts} />
        <div className="mt-6 sm:mt-8">
          {/* Overlay grid — two columns above lg, one below (the site's single mobile
              breakpoint), NOT the reference's 760px. Cards keep the reveal-card
              scroll-in. See app/globals.css .work-grid / .work-card. */}
          <ul className="work-grid list-none p-0 m-0">
            {/* ⚠ THE PLATE NUMBER COMES FROM THIS LIST, WHICH IS THE FULL ORDERED ONE. The filter
                hides and repacks cards client-side without re-rendering this map, so the number is
                fixed to the study rather than to its position on screen — `PL 01` is the same
                piece whichever chip is pressed. Numbering the visible set would renumber every
                plate on every press, and a plate number is an identity. */}
            {projects.map((project, i) => (
              <li key={project.slug} className="reveal-card">
                <ProjectCard project={project} plate={String(i + 1).padStart(2, "0")} />
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
