import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, getBlogPosts } from "@/lib/keystatic";
import { absoluteUrl, blogPath } from "@/lib/site";
import { formatLongDate } from "@/lib/blog/format";
import BlogProse from "@/components/blog/BlogProse";
import BlogHero from "@/components/blog/BlogHero";
import ReadingVessel from "@/components/blog/ReadingVessel";
import LoveButton, { LoveHint } from "@/components/blog/LoveButton";
import LoveProvider from "@/components/blog/LoveProvider";

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
    // P1 — the provider spans BOTH the pill (inside <main>) and the vessel's two readouts,
    // which is the whole point: they are on opposite sides of the client boundary. The
    // children stay server-rendered, so BlogProse never reaches the client bundle.
    <LoveProvider slugs={[post.slug]}>
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

        {/* Both branches (hero and the mt-[44px] spacer) live in BlogHero, so the studio
            canvas renders the same two and cannot drift from this one. */}
        <BlogHero src={post.heroImage} />

        <BlogProse blocks={post.blocks} />

        {/* The ONE love control on the site. Everything else that shows a count is a
            readout — see LoveButton's header. */}
        <div id="blog-love-block" className="mt-[60px] border-y border-ink-950/8 py-[38px] text-center">
          <p className="mb-5 font-display text-[23px] leading-[1.35] text-ink-950">
            If this was worth your time, leave it some love.
          </p>
          <LoveButton slug={post.slug} variant="control" />
          <LoveHint slug={post.slug} />
        </div>
      </main>

        <ReadingVessel
          slug={post.slug}
          date={post.date}
          readingTime={post.readingTime}
          topic={post.topic}
        />
      </div>
    </LoveProvider>
  );
}
