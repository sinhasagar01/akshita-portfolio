// Blog canvas-vs-article parity — the blog twin of /dev/parity, and the thing STATE's
// hazard 12 has been asking for.
//
// WHY IT EXISTS NOW. Blog has never had a parity harness, and the cost is on the record:
// the 48px fidelity gap (#178) and the `vw` bleed bug (#180) both had to be caught BY HAND,
// and this arc's own premise — that contentEditable moves no box — had to be measured by
// hand too. Three hand-catches for one missing gate.
//
// It matters more from this PR onward than it ever did before, because this is the FIRST
// time the two renders diverge BY DESIGN. Until now "the canvas is the article" was true by
// construction and the gate would only have caught accidents. Now the canvas deliberately
// carries contentEditable, data-edit-* attributes and an outline, and the claim being made
// is the narrower one: those ADD affordances and never move a box.
//
// HOW TO RUN
//   1. npm run dev
//   2. open http://localhost:3457/dev/blog-parity/<slug>   (dev only)
//   3. paste PARITY_SCRIPT from ralph/tests/parity.mjs into the console
//
// The walker is REUSED UNCHANGED. It keys off [data-parity-pair] and [data-parity-side]
// and knows nothing about case studies, so blog needed no second implementation of it —
// only a second page that lays two renders out for it to compare.
//
// IT MUST REPORT A NON-ZERO PAIR COUNT. #180 ran the case-study harness against a slug that
// produced no pairs and got `sections: 0, verdict: PARITY OK` — a false pass, and a harness
// that reports zero subjects is worse than no harness because it reads as evidence. The
// count is rendered on the page so a human reading the output cannot miss a zero, and the
// blog ralph suite asserts the page emits at least one pair.
import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/keystatic";
import BlogProse from "@/components/blog/BlogProse";
import BlogHero from "@/components/blog/BlogHero";
import BlogArticleHead from "@/components/blog/BlogArticleHead";
import type { BlogRawBlock } from "@/lib/blog/blocks-raw";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function BlogParityHarness({ params }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const blocks = (Array.isArray(post.blocks) ? post.blocks : []) as BlogRawBlock[];

  return (
    <main>
      {/* The count, in the markup, so a zero is visible to a human as well as to the
          suite. A harness whose empty result looks like a pass is the failure #180 found. */}
      <p data-parity-count={blocks.length} style={{ padding: "8px 16px", font: "12px monospace" }}>
        {blocks.length} block(s), hero {post.heroImage ? "PRESENT" : "ABSENT"} — a zero block
        count means the harness is proving NOTHING about the prose.
      </p>

      {/* PAIR 0 — THE HEAD. Both sides get the same values; only the `canvas` flag differs,
          and all it does is drop the `id`. That difference is the REASON this pair needs
          watching: ReadingVessel resolves the head by document.getElementById, and this page
          renders both sides at once, so an unconditional id would put a duplicate in the
          document. The walk compares boxes and would not notice a duplicate id, so the
          assertion for that is in ralph rather than here. */}
      <section data-parity-pair={0} data-parity-section="blog-head">
        <div data-parity-side="live" className="mx-auto max-w-[68ch] px-6 blog-article">
          <BlogArticleHead
            date={post.date}
            readingTime={post.readingTime}
            topic={post.topic}
            title={post.title}
            dek={post.dek}
          />
        </div>
        <div data-parity-side="canvas" className="mx-auto max-w-[68ch] px-6 blog-article">
          <BlogArticleHead
            date={post.date}
            readingTime={post.readingTime}
            topic={post.topic}
            title={post.title}
            dek={post.dek}
            canvas
          />
        </div>
      </section>

      {/* PAIR 1 — THE HERO, added when the canvas started drawing it.
          It is a separate pair from the prose because the two are separate components on both
          surfaces, and because the hero is the one place the renders differ by ELEMENT rather
          than by attribute: next/image on the article, a plain <img> on the canvas. That is
          the whole reason this pair has to exist. Written inline in the panel instead of
          shared through BlogHero, the hero would be invisible here and this harness would go
          on reporting a clean pass — #180's `sections: 0, verdict: PARITY OK` in a new form.
          Both sides get the SAME src. The proxy rewrite and the object URL are studio-runtime
          concerns and would only introduce a difference this walk would report as a mismatch
          without proving anything about layout. */}
      <section data-parity-pair={1} data-parity-section="blog-hero">
        <div data-parity-side="live" className="mx-auto max-w-[68ch] px-6 blog-article">
          <BlogHero src={post.heroImage} />
        </div>
        <div data-parity-side="canvas" className="mx-auto max-w-[68ch] px-6 blog-article">
          <BlogHero src={post.heroImage} canvas />
        </div>
      </section>

      {/* ONE pair for the whole post, not one per block. BlogProse renders a flat array
          into a single `.blog-prose` column, and splitting it per block would compare
          columns that never exist in isolation on either surface.

          The two sides carry IDENTICAL wrapper markup, including `px-6` and the 68ch cap,
          because the walk compares by POSITION — one extra element on one side shifts every
          later comparison and turns a clean run into phantom mismatches. The only variable
          is the `editable` flag. */}
      <section data-parity-pair={2} data-parity-section="blog-prose">
        <div data-parity-side="live" className="mx-auto max-w-[68ch] px-6 blog-article">
          <BlogProse blocks={blocks} />
        </div>
        <div data-parity-side="canvas" className="mx-auto max-w-[68ch] px-6 blog-article">
          <BlogProse blocks={blocks} editable />
        </div>
      </section>
    </main>
  );
}
