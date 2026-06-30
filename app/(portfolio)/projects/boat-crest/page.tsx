import type { Metadata } from "next";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import { boatCrest } from "@/lib/case-studies/boat-crest";
import { absoluteUrl, projectPath, projectLastModified, ogImageUrl } from "@/lib/site";
import { caseStudySchema, breadcrumbSchema } from "@/lib/structured-data";
import JsonLd from "@/components/seo/JsonLd";

const path = projectPath(boatCrest.slug);
const ogImage = ogImageUrl(boatCrest.slug);

export const metadata: Metadata = {
  title: boatCrest.title,
  description: boatCrest.description,
  alternates: { canonical: path },
  openGraph: {
    type: "article",
    url: absoluteUrl(path),
    title: boatCrest.title,
    description: boatCrest.description,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: `${boatCrest.title} — case study by Akshita Singh`,
      },
    ],
  },
  twitter: { images: [ogImage] },
};

export default function BoatCrestPage() {
  const lastModified = projectLastModified(boatCrest.slug);

  return (
    <>
      <JsonLd
        data={caseStudySchema({
          title: boatCrest.title,
          description: boatCrest.description,
          slug: boatCrest.slug,
          datePublished: lastModified,
          dateModified: lastModified,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: absoluteUrl("/") },
          { name: "Projects", url: absoluteUrl("/#work") },
          { name: boatCrest.title, url: absoluteUrl(path) },
        ])}
      />
      <CaseStudyView study={boatCrest} />
    </>
  );
}
