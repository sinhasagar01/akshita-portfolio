// The blog post editor — one post, full width.
//
// Same shape as /studio/projects/[slug]: a back link to the index, then the panel. No
// list rail — the case-study editor removed exactly that because it cost the canvas its
// width, and a writing surface needs the room more than a case study does.
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudioData } from "@/lib/studio/data";
import { getBlogPost } from "@/lib/keystatic";
import { getEntryDraftState } from "@/lib/studio/entry-draft";
import BlogEditPanel from "@/components/studio/BlogEditPanel";
import { blogPath } from "@/lib/site";
import { IconArrowUpRight } from "@/components/studio/icons";
import type { BlogRawBlock } from "@/lib/blog/blocks-raw";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function BlogEditorPage({ params }: Props) {
  const { slug } = await params;
  // The draft-overlaid list, so the head fields match what the index showed.
  const { blog } = await getStudioData();
  const post = blog.find((p) => p.slug === slug);
  if (!post) notFound();

  // Blocks come from the raw read + the draft overlay. Server-side here rather than
  // through /api/studio/blog-blocks so the editor has them on first paint; the route
  // exists for the client to re-read after a publish or discard.
  const live = await getBlogPost(slug);
  const draft = await getEntryDraftState("blog", slug);
  const rawBlocks = draft.source === "draft" ? draft.raw : live?.blocks;
  const blocks = (Array.isArray(rawBlocks) ? rawBlocks : []) as BlogRawBlock[];

  // Suggestions only — `topic` is an open string (#173), so this offers what other posts
  // already use without inventing a closed set.
  const topicSuggestions = [...new Set(blog.map((p) => p.topic).filter(Boolean))].sort();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/studio/blog"
          className="shrink-0 rounded-md border border-ink-950/8 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          ← Blog
        </Link>
        <a
          href={blogPath(slug)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-950/8 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 [&>svg]:size-3"
        >
          View live <IconArrowUpRight />
        </a>
      </div>

      <BlogEditPanel
        slug={slug}
        title={post.title}
        dek={post.dek}
        date={post.date}
        topic={post.topic}
        status={post.status}
        heroImage={post.heroImage}
        blocks={blocks}
        topicSuggestions={topicSuggestions}
      />
    </>
  );
}
