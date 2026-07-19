// P4 4(b)-i — the case-study body editor route (pullQuote slice). Inside
// (dashboard), so it inherits the owner gate.
//
// DRAFT-PREFERRING read, reusing 4(a)'s getCaseStudyDraftState — NOT getStudioData,
// whose projects overlay maps entries through mapProjectListItem, which has no
// `sections` (the 4(a) recon finding). Editing must start from the draft the owner
// is building, not from live, or their last edit would silently vanish on reload.
//
// Its own route rather than the projects list page: sections is ~15KB per project,
// and the list page would pay it for every project to edit one. Mirrors the
// sibling /preview route.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCaseStudyData } from "@/lib/keystatic";
import { getCaseStudyDraftState } from "@/lib/studio/case-study-draft";
import SectionsEditPanel from "@/components/studio/SectionsEditPanel";
import type { RawSection } from "@/lib/case-studies/sections-raw";
import AreaHeader from "@/components/studio/AreaHeader";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function CaseStudyBodyPage({ params }: Props) {
  const { slug } = await params;
  const live = await getCaseStudyData(slug);
  if (!live) notFound();

  const draft = await getCaseStudyDraftState(slug);
  const rawSections = draft.source === "draft" ? draft.rawSections : live.rawSections;
  const sections = Array.isArray(rawSections) ? rawSections : [];

  return (
    <>
      <AreaHeader
        title={live.title}
        sub="Edit the case study's content block by block. A few deep block types are coming; they are preserved untouched."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/studio/projects"
          className="rounded-md px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Back to projects
        </Link>
        <Link
          href={`/studio/projects/${slug}/preview`}
          className="rounded-md border border-ink-950/8 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Preview
        </Link>
        {draft.source === "draft" && (
          <span className="rounded-full border border-accent-500/40 bg-accent-500/10 px-2 py-0.5 text-[10px] text-accent-600">
            Editing your unpublished draft
          </span>
        )}
      </div>
      <SectionsEditPanel slug={slug} sections={sections as RawSection[]} template={live.template} />
    </>
  );
}
