// The case-study editor — one study, full width.
//
// WHY ITS OWN ROUTE. The editor used to be a detail pane beside a list of all four
// case studies, and that rail cost most of the horizontal room the canvas needs to
// render a page faithfully. The list moves to /studio/projects (an index) and the
// editing happens here, where nothing competes for width.
//
// It also replaces the orphaned [slug]/body route, which nothing linked to. That
// route being unreachable is exactly how it drifted from the surface people used —
// it kept getting the fixes while the real editor did not. One editor, one URL.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudioData } from "@/lib/studio/data";
import ProjectsEditPanel from "@/components/studio/ProjectsEditPanel";
import CaseStudySwitcher from "@/components/studio/CaseStudySwitcher";
import { projectPath } from "@/lib/site";
import { IconArrowUpRight } from "@/components/studio/icons";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function CaseStudyEditorPage({ params }: Props) {
  const { slug } = await params;
  // The SAME draft-preferring read the index uses, so a draft edit shows here too.
  const { projects } = await getStudioData();
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/studio/projects"
            className="shrink-0 rounded-md border border-ink-950/8 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
          >
            ← Case studies
          </Link>
          {/* Jump between studies without going back to the index — the common move
              when applying the same change across more than one. */}
          <CaseStudySwitcher
            current={slug}
            options={projects.map((p) => ({ slug: p.slug, title: p.title }))}
          />
        </div>
        <a
          href={projectPath(slug)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-950/8 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 [&>svg]:size-3"
        >
          View live <IconArrowUpRight />
        </a>
      </div>

      <ProjectsEditPanel
        itemId={slug}
        slug={slug}
        title={project.title}
        summary={project.summary}
        heroImage={project.heroImage}
        facts={project.facts}
        template={project.template}
      />
    </>
  );
}
