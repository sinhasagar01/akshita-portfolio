import { getCaseStudyData, getProjectSlugs } from "@/lib/keystatic";
import { BESPOKE_SLUGS } from "@/lib/case-studies/types";
import { renderOgImage } from "@/lib/og";

// Stable OG-card URL (`/projects/<slug>/og`) referenced identically by og:image,
// twitter:image, and the JSON-LD image so they never diverge. The file-convention
// `opengraph-image` route was avoided because its generated URL carries an unpredictable
// suffix that JSON-LD can't reference.
export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.filter((slug) => !BESPOKE_SLUGS.has(slug)).map((slug) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  return renderOgImage({
    eyebrow: "Case study",
    title: data?.title ?? "Case study",
    subtitle: data?.summary ?? "",
  });
}
