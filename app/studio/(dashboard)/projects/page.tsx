import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ProjectsEditPanel from "@/components/studio/ProjectsEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { ListDetailLayout } from "@/components/studio/ListDetailLayout";
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
        <ListDetailLayout sections={projects.map((p) => ({ id: p.slug, name: p.title }))}>
          {projects.map((p) => (
            <ProjectsEditPanel
              key={p.slug}
              itemId={p.slug}
              slug={p.slug}
              title={p.title}
              summary={p.summary}
              facts={p.facts}
            />
          ))}
        </ListDetailLayout>
      )}
    </>
  );
}
