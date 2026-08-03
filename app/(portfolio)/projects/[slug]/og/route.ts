import { getCaseStudyData, getProjectSlugs } from "@/lib/keystatic";
import { renderOgImage } from "@/lib/og";

// Stable OG-card URL (`/projects/<slug>/og`) referenced identically by og:image,
// twitter:image, and the JSON-LD image so they never diverge. The file-convention
// `opengraph-image` route was avoided because its generated URL carries an unpredictable
// suffix that JSON-LD can't reference.
// `generateStaticParams` IS A BUILD MANIFEST, NOT A GATE, and believing otherwise is what
// made this route fail open. It decides what gets PRERENDERED; `dynamicParams` decides what
// is ALLOWED. Without the export below, `dynamicParams` defaults to true and every slug not
// listed here was rendered on demand — `/projects/not-a-real-slug/og` returned 200 and a PNG.
export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  // Every study is content now, so none is filtered out — the exclusion existed only to
  // avoid colliding with boat-crest's literal route, which #292 removed.
  return slugs.map((slug) => ({ slug }));
}

/** Anything not listed above 404s at the routing layer. Visible in the build as
 *  `fallback: false` for this route in `.next/prerender-manifest.json`, which is the same
 *  flag `/blog/[slug]` has carried since it was written. */
export const dynamicParams = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  // REFUSE, DO NOT SUBSTITUTE. This used to read `data?.title ?? "Case study"`, which turned
  // "no such entry" into a successful render of a contentless card. The default was doing the
  // work of a 404 while returning a 200, and a fallback that hides a missing entry is how a
  // route stops being able to say no. It was harmless here only because projects have no
  // draft state — a property of today's content, not of this code.
  if (!data) return new Response(null, { status: 404 });
  return renderOgImage({
    eyebrow: "Case study",
    title: data.title,
    subtitle: data.summary,
  });
}
