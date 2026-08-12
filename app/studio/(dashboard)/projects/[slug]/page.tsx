// The case-study editor — one study, list beside canvas beside inspector.
//
// WHY ITS OWN ROUTE. The editor used to be a detail pane beside a list of all four
// case studies, and that rail cost most of the horizontal room the canvas needs to
// render a page faithfully. The list moves to /studio/projects (an index) and the
// editing happens here.
//
// AND THAT REASONING WAS ARITHMETIC THAT WAS NEVER DONE, the same error the blog route
// records against #174. A rail costs 264. The shell's fit threshold is 236 + 264 + 640 +
// 320 = 1460, and below it the rail collapses to 26 on its own, so the canvas keeps 640 —
// half of the 1280 it renders at, which is PR 6's floor exactly. The list did not cost the
// canvas what this note claimed. It is kept rather than deleted because a reversed decision
// whose reasoning is deleted leaves two contradictory rationales and no record of which won.
//
// It replaces [slug]/body, now deleted. That route was reachable only by typing the
// URL, and being unreachable is exactly how it drifted from the surface people
// actually used — it kept receiving the fixes while the real editor did not. One
// editor, one URL, so there is no second copy to fix the wrong one of.
//
// NO PADDING WRAPPER, for the reason the blog route gives at length: the shell is a
// full-height layout whose panes scroll internally and which must reach the viewport
// edges, so it takes no STUDIO_PAGE. The back link, the switcher and View live moved
// into the panel's crumb row, because a bar above an edge-to-edge shell would be a
// second header competing with the one the shell already sits under.
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getStudioData } from "@/lib/studio/data";
import ProjectsEditPanel from "@/components/studio/ProjectsEditPanel";
import { projectPath } from "@/lib/site";
import { clampInspectorWidth, INSPECTOR_BOUNDS } from "@/lib/studio/inspector-width";
import { clampZoom, ZOOM_COOKIE } from "@/lib/studio/canvas-zoom";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function CaseStudyEditorPage({ params }: Props) {
  const { slug } = await params;
  // The SAME draft-preferring read the index uses, so a draft edit shows here too.
  const { projects } = await getStudioData();
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  // ⚠ READ ON THE SERVER SO THE FIRST PAINT IS CORRECT RATHER THAN CORRECTED — #237's rule, and
  // the reason the sidebar's width does not flash. `localStorage` would guarantee the opposite:
  // the server cannot read it, so every load would render 320 and jump on mount.
  // CLAMPED ON THE READ, not merely on the write. A cookie stored while the bounds were wider
  // outlives the build that allowed it; clamping here makes whatever is in the jar ADVISORY.
  const jar = await cookies();
  const inspectorWidth = clampInspectorWidth(jar.get(INSPECTOR_BOUNDS.cs.cookie)?.value, "cs");
  // Same rule as the widths: clamped on the READ, so a level stored under a different set of
  // steps resolves inside today's rather than smuggling itself back in.
  const canvasZoom = clampZoom(jar.get(ZOOM_COOKIE.cs)?.value);

  return (
    <ProjectsEditPanel
      itemId={slug}
      slug={slug}
      title={project.title}
      summary={project.summary}
      heroImage={project.heroImage}
      facts={project.facts}
      template={project.template}
      category={project.category}
      imagePreview={project.imagePreview}
      // Resolved HERE, on the server. `lib/site.ts` imports node:fs at module scope, so a
      // client component importing projectPath would pull fs into the client bundle — the
      // same reason the blog route resolves livePath rather than passing the slug.
      livePath={projectPath(slug)}
      // Feeds the crumb row's switcher, so it and /studio/projects agree about which
      // studies exist.
      studies={projects.map((p) => ({ slug: p.slug, title: p.title }))}
      inspectorWidth={inspectorWidth}
      canvasZoom={canvasZoom}
    />
  );
}
