import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCaseStudyData, getProjectSlugs, getAdjacentProject } from "@/lib/keystatic";
import { absoluteUrl, projectPath, projectLastModified, ogImageUrl } from "@/lib/site";
import { caseStudySchema, breadcrumbSchema } from "@/lib/structured-data";
import JsonLd from "@/components/seo/JsonLd";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import PreviewRail from "@/components/case-study/PreviewRail";
import NextCaseRail from "@/components/case-study/NextCaseRail";
import { adaptSections } from "@/lib/case-studies/adapter";
import { railItems } from "@/lib/case-studies/rail-items";
import type { CaseStudy } from "@/lib/case-studies/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  // Slugs with a literal bespoke route (e.g. boat-crest) are served by that route,
  // not this dynamic one — exclude them to avoid a build-time path collision.
  // Every study is content now, so none is filtered out — the exclusion existed only to
  // avoid colliding with boat-crest's literal route, which #292 removed.
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  if (!data) return {};
  const path = projectPath(slug);
  const ogImage = ogImageUrl(slug);
  const ogAlt = `${data.title} — case study by Akshita Singh`;
  return {
    title: data.title,
    description: data.summary,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: absoluteUrl(path),
      title: data.title,
      description: data.summary,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: { images: [ogImage] },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  if (!data) notFound();

  const path = projectPath(slug);
  const lastModified = projectLastModified(slug);
  // NCR-1 — the next case study for the bottom rail, via the public read (single
  // getHomePageData call on this route). Null when unresolvable → no rail.
  const next = await getAdjacentProject(slug);

  // P4 3(d) step 5 — every content project renders through the ONE bespoke
  // renderer (the 3(c) adapter into CaseStudyView), the same component set the
  // boat-crest literal route uses. A project with no authored sections yet
  // (e.g. a fresh studio-created stub) adapts to an empty array, and
  // CaseStudyView renders its "Coming soon" placeholder — graceful, not a crash.
  const study: CaseStudy = {
    slug,
    title: data.title,
    thesis: data.summary,
    description: data.summary,
    // CS-6b — thread the case-study template so a frame-less image resolves to
    // the template's default frame (web -> browser, else phone), the SAME wiring
    // the studio preview uses. Template-absent content (every migrated project,
    // boat-crest) resolves to phone and renders byte-identically.
    sections: adaptSections(data.rawSections, { template: data.template }),
    // CS-7b — the template also drives the section/block Bold-gallery web treatments.
    template: data.template,
  };

  return (
    <>
      <JsonLd
        data={caseStudySchema({
          title: data.title,
          description: data.summary,
          slug,
          datePublished: lastModified,
          dateModified: lastModified,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Projects", url: absoluteUrl("/#work") },
          { name: data.title, url: absoluteUrl(path) },
        ])}
      />
      <CaseStudyView study={study} />
      {/* Public route only — the rail is chrome derived from the sections. The studio
          preview reuses CaseStudyView WITHOUT this, so it never collides with the
          studio's own right-hand Selected rail. */}
      <PreviewRail items={railItems(study.sections)} />
      {/* NCR-1 — public route only, same exclusion as PreviewRail. */}
      {next && (
        <NextCaseRail
          allWorkHref="/#work"
          nextHref={projectPath(next.slug)}
          nextTitle={next.title}
        />
      )}
    </>
  );
}
