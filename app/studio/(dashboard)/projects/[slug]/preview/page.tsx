// P4 4(a) — the case-study preview. Inside (dashboard), so it inherits the
// owner gate; this is the ONLY surface that renders draft `sections`.
//
// Draft-preferring: getCaseStudyDraftState reads this slug's sections from the
// draft branch when it changed there, else live. The public case-study page is
// untouched and stays main-only — the read-split invariant.
//
// Adapts in PREVIEW mode, so a half-authored draft renders with a placeholder
// for the offending block instead of throwing. The public SSG path keeps the
// fail-loud default.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCaseStudyData } from "@/lib/keystatic";
import { getCaseStudyDraftState } from "@/lib/studio/case-study-draft";
import { makeDraftSrcRewriter } from "@/lib/studio/draft-image";
import { adaptSections } from "@/lib/case-studies/adapter";
import type { CaseStudy } from "@/lib/case-studies/types";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import { projectPath } from "@/lib/site";
import { IconArrowUpRight } from "@/components/studio/icons";
import { STUDIO_PAGE } from "@/lib/studio/page-class";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function CaseStudyPreviewPage({ params }: Props) {
  const { slug } = await params;
  const live = await getCaseStudyData(slug);
  if (!live) notFound();

  const draft = await getCaseStudyDraftState(slug);
  const rawSections = draft.source === "draft" ? draft.rawSections : live.rawSections;
  // Same branch as the sections above (see the body editor for why).
  const template = draft.source === "draft" ? (draft.template ?? "") : live.template;

  const study: CaseStudy = {
    slug,
    title: live.title,
    thesis: live.summary,
    description: live.summary,
    // CS-6a — pass the case-study template so a frame-less image resolves to the
    // template's default frame (web -> browser, else phone) in the preview. The
    // public render path stays unwired until CS-6b (live layout).
    sections: adaptSections(rawSections, {
      mode: "preview",
      template,
      // An image uploaded since the last publish lives only on the draft branch,
      // so its public path 404s here. Route those — and only those — through the
      // owner-gated proxy, so the preview shows the image the owner just added.
      rewriteSrc: makeDraftSrcRewriter(draft.draftImages),
    }),
    // CS-7b — the template also drives the Bold-gallery web treatments, so preview
    // and live move together.
    template,
  };

  const isDraft = draft.source === "draft";

  return (
    <div className={`${STUDIO_PAGE} flex flex-col gap-4`}>
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-display text-base text-ink-950">{live.title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              isDraft
                ? "border border-accent-500/40 bg-accent-500/10 text-accent-600"
                : "border border-ink-950/15 text-ink-500"
            }`}
          >
            {isDraft ? "Showing your draft" : "Showing live"}
          </span>
          <span className="text-[11px] text-text-subtle">
            {isDraft
              ? "Unpublished. The public page still shows live until you publish."
              : "No unpublished changes to this case study."}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/studio/projects"
            // Colour on the span, not the Link — hazard 22. See BlogPostList for the note.
            className="group rounded-[var(--studio-radius-control,4px)] px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-cream-200"
          >
            <span className="text-ink-600 transition-colors group-hover:text-ink-950">
              Back to projects
            </span>
          </Link>
          <a
            href={projectPath(slug)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 [&>svg]:size-3"
          >
            View live <IconArrowUpRight />
          </a>
        </div>
      </header>

      {/* The real renderer, so the preview is the thing itself, not a mock. */}
      <div className="overflow-hidden rounded-[var(--studio-radius-card,8px)] border border-ink-950/12">
        <CaseStudyView study={study} />
      </div>
    </div>
  );
}
