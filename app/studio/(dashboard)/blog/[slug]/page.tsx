// The blog post editor — list, canvas and inspector, filling the window.
//
// THE OWNER REVERSED #174'S DECISION. This route shipped as a full-width editor with no
// list rail, and the reasoning is kept in BlogIndex.tsx rather than deleted, because a
// reversed decision whose reasoning is deleted leaves the codebase carrying two
// contradictory rationales and no record of which won — which is how the unreachable
// `[slug]/body` copy of the case-study editor was allowed to drift.
//
// The short version. The rail was removed from the case-study editor because it "cost most
// of the horizontal room the canvas needs to render a page faithfully". That is an
// arithmetic claim and the arithmetic was never done. The canvas measure is 68ch, which
// resolves to 745.9px against the wrapper's 16px font rather than the 646 you get by
// estimating it from the 18px prose. Sidebar 236 plus list 264 plus canvas 794 plus
// inspector 320 is 1614, and the laptop this is authored on is 1536 wide. The rail costs
// the canvas nothing it needs. See lib/studio/three-pane.ts.
//
// NO PADDING WRAPPER. This page does not take STUDIO_PAGE, and that is the exception the
// #D1 padding move existed to make possible: the shell is a full-height layout whose panes
// scroll internally and which must reach the viewport edges. Because the layout no longer
// imposes a padded, page-scrolled column on every studio page, this needs no negative
// margins to escape one.
import { notFound } from "next/navigation";
import { getStudioData } from "@/lib/studio/data";
import { getBlogPost } from "@/lib/keystatic";
import { getEntryDraftState } from "@/lib/studio/entry-draft";
import BlogEditPanel from "@/components/studio/BlogEditPanel";
import { blogPath } from "@/lib/site";
import type { BlogRawBlock } from "@/lib/blog/blocks-raw";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function BlogEditorPage({ params }: Props) {
  const { slug } = await params;
  // The draft-overlaid list, so the head fields match what the index showed. It also feeds
  // the list pane, so the rail and the index agree about which posts exist.
  const { blog } = await getStudioData();
  const post = blog.find((p) => p.slug === slug);
  if (!post) notFound();

  // Blocks come from the raw read + the draft overlay. Server-side here rather than through
  // /api/studio/blog-blocks so the editor has them on first paint; the route exists for the
  // client to re-read after a publish or discard.
  const live = await getBlogPost(slug);
  const draft = await getEntryDraftState("blog", slug);
  const rawBlocks = draft.source === "draft" ? draft.raw : live?.blocks;
  const blocks = (Array.isArray(rawBlocks) ? rawBlocks : []) as BlogRawBlock[];

  // Suggestions only — `topic` is an open string (#173), so this offers what other posts
  // already use without inventing a closed set.
  const topicSuggestions = [...new Set(blog.map((p) => p.topic).filter(Boolean))].sort();

  return (
    <BlogEditPanel
      slug={slug}
      title={post.title}
      // Resolved HERE, on the server. `lib/site.ts` imports node:fs at module scope, so a
      // client component importing blogPath would pull fs into the client bundle and fail
      // the build app-wide. One definition, called where fs is allowed.
      livePath={blogPath(slug)}
      dek={post.dek}
      date={post.date}
      topic={post.topic}
      status={post.status}
      heroImage={post.heroImage}
      blocks={blocks}
      // An image uploaded to the draft branch does not exist on main, so its public path
      // 404s in the editor until publish. The canvas routes those through the owner-gated
      // proxy; the article never needs to. See BlogProse's rewriteSrc.
      draftImages={draft.draftImages}
      posts={blog}
      topicSuggestions={topicSuggestions}
    />
  );
}
