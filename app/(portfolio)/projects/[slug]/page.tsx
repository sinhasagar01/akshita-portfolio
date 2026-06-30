import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCaseStudyData, getProjectSlugs } from "@/lib/keystatic";
import { BESPOKE_SLUGS } from "@/lib/case-studies/types";
import { absoluteUrl, projectPath, projectLastModified, ogImageUrl } from "@/lib/site";
import { caseStudySchema, breadcrumbSchema } from "@/lib/structured-data";
import JsonLd from "@/components/seo/JsonLd";
import CaseStudyBlockRenderer from "@/components/blocks/CaseStudyBlockRenderer";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  // Slugs with a literal bespoke route (e.g. boat-crest) are served by that route,
  // not this dynamic one — exclude them to avoid a build-time path collision.
  return slugs.filter((slug) => !BESPOKE_SLUGS.has(slug)).map((slug) => ({ slug }));
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

  return (
    <main className="container-x">
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
      <div
        className="section-card relative aspect-[21/9] overflow-hidden bg-[--color-surface]"
        style={{ marginTop: "clamp(1rem, 1.5vw, 1.5rem)" }}
      >
        {data.heroImage ? (
          <Image
            src={data.heroImage}
            alt={data.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder label="2100 × 900" />
        )}
      </div>
      {data.blocks.map((block, i) => (
        <CaseStudyBlockRenderer key={i} block={block} />
      ))}
    </main>
  );
}
