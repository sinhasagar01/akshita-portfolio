import Link from "next/link";
import type { Metadata } from "next";
import { getBlogPosts, type BlogCard } from "@/lib/keystatic";
import { absoluteUrl, blogPath } from "@/lib/site";
import { formatLongDate, formatShortDate } from "@/lib/blog/format";
import Shot from "@/components/blog/Shot";
import LoveButton from "@/components/blog/LoveButton";
import LoveProvider from "@/components/blog/LoveProvider";

// Static masthead chrome — site-level intro copy, not per-post content. A later PR could
// move it to site settings; it is hardcoded here so PR 2 needs no schema for it.
const MASTHEAD = {
  title: "Notes on the craft of product design",
  dek: "Short entries on the work. Data tables, empty states, AI patterns, and the unglamorous decisions that make software usable.",
};

export const metadata: Metadata = {
  title: "Blog",
  description: MASTHEAD.dek,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: absoluteUrl("/blog"),
    title: "Blog",
    description: MASTHEAD.dek,
    images: [{ url: absoluteUrl("/opengraph-image.png"), width: 1200, height: 630, alt: "Blog" }],
  },
  twitter: { images: [absoluteUrl("/opengraph-image.png")] },
};

function Masthead() {
  return (
    <header className="border-b border-ink-950/8 pb-[30px] pt-16">
      <p className="text-[12px] uppercase tracking-[0.16em] text-ink-600">Blog</p>
      <h1 className="mt-3.5 max-w-[16ch] font-display text-[clamp(2.25rem,5vw,3.25rem)] font-normal leading-[1.02] tracking-[-0.015em] text-ink-950">
        {MASTHEAD.title}
      </h1>
      <p className="mt-3.5 max-w-[54ch] text-base leading-[1.6] text-ink-800">{MASTHEAD.dek}</p>
    </header>
  );
}

function FeaturedCard({ post }: { post: BlogCard }) {
  return (
    <article className="mt-9">
      <Link
        href={blogPath(post.slug)}
        className="group grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center"
      >
        <Shot
          heroImage={post.heroImage}
          title={post.title}
          topic={post.topic}
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
          className="aspect-[16/10] rounded-xl border border-ink-950/8"
        />
        <div>
          <p className="text-[11.5px] uppercase tracking-[0.13em] text-ink-600">
            Latest · {formatLongDate(post.date)}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2rem)] font-normal leading-[1.12] tracking-[-0.01em] text-ink-950 transition-colors group-hover:text-accent-600">
            {post.title}
          </h2>
          {post.dek ? (
            <p className="mt-3 text-[17px] leading-[1.6] text-ink-800">{post.dek}</p>
          ) : null}
          <div className="mt-5 flex items-center gap-4 text-[12.5px] text-ink-600">
            <span>{post.readingTime} min read</span>
            {/* A readout. This sits inside the card's block-level <Link>, where a <button>
                would be an invalid content model — not just a click to stop. */}
            <LoveButton slug={post.slug} variant="readout" />
          </div>
        </div>
      </Link>
    </article>
  );
}

function PostCard({ post }: { post: BlogCard }) {
  return (
    <Link href={blogPath(post.slug)} className="group flex flex-col">
      <Shot
        heroImage={post.heroImage}
        title={post.title}
        topic={post.topic}
        sizes="(max-width: 1024px) 100vw, 45vw"
        className="aspect-[16/10] rounded-xl border border-ink-950/8"
      />
      <div className="mt-3.5 flex items-center gap-3 text-[12px] uppercase tracking-[0.1em] text-ink-600">
        <span>{formatShortDate(post.date)}</span>
        <span>{post.readingTime} min</span>
      </div>
      <h3 className="mt-2 display-face text-[21px] font-normal leading-[1.2] text-ink-950 transition-colors group-hover:text-accent-600">
        {post.title}
      </h3>
      {post.dek ? <p className="mt-2 text-[14.5px] leading-[1.55] text-ink-600">{post.dek}</p> : null}
      <div className="mt-3">
        {/* Readout, same reason as the featured card. */}
        <LoveButton slug={post.slug} variant="readout" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="relative overflow-hidden py-24 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-subtle">Blog</p>
      <p className="mt-4 font-display text-4xl font-normal italic text-ink-950">Coming soon</p>
      <p className="mx-auto mt-4 max-w-[52ch] text-lg leading-[1.6] text-ink-600">
        The first notes are being written. Check back shortly.
      </p>
    </section>
  );
}

export default function BlogIndexPage() {
  return (
    <div className="blog-index">
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[1040px] px-6 pb-24 pt-[var(--hero-nav-runway)] outline-none"
      >
        <BlogIndexBody />
      </main>
    </div>
  );
}

async function BlogIndexBody() {
  const posts = await getBlogPosts();

  if (posts.length === 0) {
    return (
      <>
        <Masthead />
        <EmptyState />
      </>
    );
  }

  const [featured, ...rest] = posts;

  return (
    // P2 — ONE batched request for every card. The provider is keyed by slug and each card
    // names its own, so the featured card cannot pick up a stream card's number.
    <LoveProvider slugs={posts.map((p) => p.slug)}>
      <Masthead />
      <FeaturedCard post={featured} />
      {rest.length > 0 ? (
        <div className="mt-12 grid gap-x-8 gap-y-12 lg:grid-cols-2">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : null}
      {/* "Older posts" pagination is a later PR — never render it with a single page. */}
    </LoveProvider>
  );
}
