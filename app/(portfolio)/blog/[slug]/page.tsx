import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, getBlogPosts } from "@/lib/keystatic";
import { absoluteUrl, blogPath } from "@/lib/site";
import { formatLongDate } from "@/lib/blog/format";
import BlogProse from "@/components/blog/BlogProse";
import ReadingVessel from "@/components/blog/ReadingVessel";
import LoveButton from "@/components/blog/LoveButton";

type Props = { params: Promise<{ slug: string }> };

// LEAK DEFENCE 1 — only PUBLISHED posts are statically generated. getBlogPosts() is the
// status-filtered read; getBlogSlugs() (unfiltered) is deliberately NOT used, so a draft
// never becomes a pre-rendered public HTML file.
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// LEAK DEFENCE 2 — a slug absent from generateStaticParams 404s at the routing layer
// without invoking the component, so an on-demand request for a draft cannot render it.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  // Do not describe an unpublished (or missing) post.
  if (!post || post.status !== "published") return {};
  const path = blogPath(slug);
  const ogImage = absoluteUrl("/opengraph-image.png");
  return {
    title: post.title,
    description: post.dek,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: absoluteUrl(path),
      title: post.title,
      description: post.dek,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { images: [ogImage] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  // LEAK DEFENCE 3 — the component gate. getBlogPost() is unfiltered (the studio preview
  // reads drafts), so the public route refuses anything not published.
  if (!post || post.status !== "published") notFound();

  return (
    <div className="blog-article">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[68ch] px-6 pb-[100px] pt-[var(--hero-nav-runway)] outline-none"
      >
        <div className="pt-[34px]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-[0.13em] text-ink-600 transition-colors hover:text-accent-500"
          >
            ← Blog
          </Link>
        </div>

        <header id="blog-article-head" className="pt-11">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] uppercase tracking-[0.13em] text-ink-600">
            <span>{formatLongDate(post.date)}</span>
            <span>{post.readingTime} min read</span>
            {post.topic ? <span>{post.topic}</span> : null}
          </div>
          <h1 className="mt-[18px] font-display text-[clamp(2.25rem,5vw,3.125rem)] font-normal leading-[1.06] tracking-[-0.018em] text-ink-950">
            {post.title}
          </h1>
          {post.dek ? (
            <p className="mt-[18px] font-display text-xl leading-[1.55] text-ink-800">{post.dek}</p>
          ) : null}
        </header>

        {post.heroImage ? (
          <figure className="my-[44px]">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] border border-ink-950/8 bg-cream-100">
              <Image src={post.heroImage} alt="" fill sizes="(max-width: 768px) 100vw, 68ch" priority className="object-cover" />
            </div>
          </figure>
        ) : (
          <div className="mt-[44px]" />
        )}

        <BlogProse blocks={post.blocks} />

        {/* End-of-article love block. Countless + disabled in PR 2 (PR 4 wires it). */}
        <div id="blog-love-block" className="mt-[60px] border-y border-ink-950/8 py-[38px] text-center">
          <p className="mb-5 font-display text-[23px] leading-[1.35] text-ink-950">
            If this was worth your time, leave it some love.
          </p>
          <LoveButton variant="pill" label="Love this" />
        </div>
      </main>

      <ReadingVessel date={post.date} readingTime={post.readingTime} topic={post.topic} />
    </div>
  );
}
