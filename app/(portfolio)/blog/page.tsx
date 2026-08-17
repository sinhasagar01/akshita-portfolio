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

// ⚠ THE COUNT IS A PROP RATHER THAN A SECOND READ, AND IT IS THE RULE'S RIGHT MARK. The section
// rule takes an identity one side and a status the other, and this masthead had only the identity
// — a standalone tracked-caps eyebrow, the construction the direction retires by name. The honest
// status of a blog index is how many notes are in it, which the caller already holds as
// `posts.length` and which no other element on the page states.
//
// ⚠ AND ZERO OMITS THE MARK RATHER THAN READING "0 NOTES". `Masthead` has two call sites and one
// of them is the empty branch, so the collapse is not hypothetical — it renders today whenever the
// collection is empty. Same single-device, two-states shape as the article head's absent topic.
function Masthead({ count }: { count: number }) {
  return (
    // The spacing is a column gap for the reason BlogArticleHead records at length — the type
    // roles declare `margin: 0` unlayered, so an `mt-*` on one of them draws nothing.
    <header className="flex flex-col gap-[clamp(12px,1.4vw,18px)] border-b border-etch/8 pb-[30px] pt-16">
      <div className="sheet-rule flex-wrap">
        <span className="sheet-mark-text">Blog</span>
        <span className="sheet-rule-line" aria-hidden="true" />
        {count > 0 ? (
          <span className="sheet-mark-text">
            {count} {count === 1 ? "note" : "notes"}
          </span>
        ) : null}
      </div>
      {/* ⚠ THE TITLE AND DEK TAKE THE ROLES' OWN MEASURES, WHICH IS A CHANGE. This title asked for
          16ch and this dek for 54ch, and both were inert against the roles' 24ch and 48ch — so the
          title WIDENS from three lines to two and the dek narrows by six characters. Named because
          it is a visible change to a live page rather than a silent tidy, and kept because a role
          that every other heading on the site obeys should not be overridden by the index alone. */}
      <h1 className="sheet-h2">{MASTHEAD.title}</h1>
      <p className="sheet-lede">{MASTHEAD.dek}</p>
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
          className="aspect-[16/10] rounded-xl border border-etch/8"
        />
        <div>
          <p className="text-[11.5px] uppercase tracking-[0.13em] text-text-secondary">
            Latest · {formatLongDate(post.date)}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,3vw,2rem)] font-normal leading-[1.12] tracking-[-0.01em] text-text-primary transition-colors group-hover:text-accent-text">
            {post.title}
          </h2>
          {post.dek ? (
            <p className="mt-3 text-[17px] leading-[1.6] text-text-lead">{post.dek}</p>
          ) : null}
          <div className="mt-5 flex items-center gap-4 text-[12.5px] text-text-secondary">
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
        className="aspect-[16/10] rounded-xl border border-etch/8"
      />
      <div className="mt-3.5 flex items-center gap-3 text-[12px] uppercase tracking-[0.1em] text-text-secondary">
        <span>{formatShortDate(post.date)}</span>
        <span>{post.readingTime} min</span>
      </div>
      <h3 className="mt-2 display-face text-[21px] font-normal leading-[1.2] text-text-primary transition-colors group-hover:text-accent-text">
        {post.title}
      </h3>
      {post.dek ? <p className="mt-2 text-[14.5px] leading-[1.55] text-text-secondary">{post.dek}</p> : null}
      <div className="mt-3">
        {/* Readout, same reason as the featured card. */}
        <LoveButton slug={post.slug} variant="readout" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    // ⚠ THE EYEBROW IS DELETED RATHER THAN CONVERTED, BECAUSE THE MASTHEAD DIRECTLY ABOVE IT
    // ALREADY SAYS "BLOG". Two identical tracked-caps marks a few rem apart is the read-twice shape
    // `Shot` records against the index's title plate, and it was invisible here for the same reason
    // — the empty state has never rendered, so nothing has ever shown the two together.
    //
    // ⚠ AND THE ITALIC IS THE LAST OF ITS KIND ON THIS SURFACE. It was a 36px display italic, which
    // is the retired vocabulary exactly; upright at the heading role, it says the same thing.
    // Centred is kept — an empty state is the one place on the site where centring is the message.
    // ⚠ THE CENTRING IS `items-center` ON THE PARENT RATHER THAN `mx-auto` ON THE CHILDREN. Both
    // roles declare `margin` and are unlayered, so `mx-auto` on either resolves to zero and the
    // capped boxes would sit hard left inside a centred text block. A flex column that centres its
    // items cannot be overruled that way, and the gap replaces the margin for the same reason.
    //
    // ⚠ AND THE GAP IS ON THE PARENT BECAUSE THE FIRST DRAFT OF THIS BLOCK PUT AN `mb-4` ON THE
    // HEADING — the exact defect described in the paragraph above it, committed while writing that
    // paragraph. Eleventh instance in this repository of explaining a trap by walking into it, and
    // the argument for the gate this unit ships rather than for a firmer note.
    <section className="relative flex flex-col items-center gap-4 overflow-hidden py-24 text-center">
      <h2 className="sheet-h2">Coming soon</h2>
      <p className="sheet-lede">The first notes are being written. Check back shortly.</p>
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
        <Masthead count={0} />
        <EmptyState />
      </>
    );
  }

  const [featured, ...rest] = posts;

  return (
    // P2 — ONE batched request for every card. The provider is keyed by slug and each card
    // names its own, so the featured card cannot pick up a stream card's number.
    <LoveProvider slugs={posts.map((p) => p.slug)}>
      <Masthead count={posts.length} />
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
