import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ProjectsEditPanel from "@/components/studio/ProjectsEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { collectionListHref } from "@/lib/keystatic-links";

export default async function StudioProjects() {
  const { projects } = await getStudioData();

  return (
    <>
      <AreaHeader
        title="Projects"
        sub="Case studies, sorted by order. Edit the summary and facts inline."
      />

      {projects.length === 0 ? (
        <StudioEmptyState href={collectionListHref("projects")}>
          No projects yet. Open the Projects collection in Keystatic to add one.
        </StudioEmptyState>
      ) : (
        <div className="flex flex-col gap-3.5">
          {projects.map((p) => (
            <ProjectsEditPanel
              key={p.slug}
              slug={p.slug}
              title={p.title}
              summary={p.summary}
              facts={p.facts}
            />
          ))}
        </div>
      )}
    </>
  );
}
