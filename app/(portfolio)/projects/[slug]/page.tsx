import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCaseStudyData, getProjectSlugs } from "@/lib/keystatic";
import CaseStudyBlockRenderer from "@/components/blocks/CaseStudyBlockRenderer";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  if (!data) return {};
  return { title: data.title, description: data.summary };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  if (!data) notFound();

  return (
    <main>
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
