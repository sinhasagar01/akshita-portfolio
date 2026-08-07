import { getBlogPost, getBlogPosts } from "@/lib/keystatic";
import { renderOgImage } from "@/lib/og";
import { getSiteSettings } from "@/lib/keystatic";
import { resolveTheme, THEME_OG } from "@/lib/theme";

// A post's social card, at a stable URL (`/blog/<slug>/og`) referenced by og:image and
// twitter:image through `blogOgImageUrl`. Mirrors the case-study route deliberately, including
// the fix that route needed: see #202's arc in docs/STATE.md for why "copy the existing one"
// was the wrong instinct here.
//
// THREE DEFENCES, MIRRORING THE PAGE, AND THEY ARE NOT REDUNDANT.
//
// The article page carries three (quoted in its own file as LEAK DEFENCE 1, 2 and 3) and
// EVERY ONE OF THEM IS PAGE-LEVEL. `notFound()`, `generateMetadata` returning {} and the
// component gate do not exist for a route handler, so none of them reaches this file. That is
// #175's shape repeating: the existing defences are right for the surface they are on and
// silent about a new one. A route handler is not a page, so it needs its own.

/** DEFENCE 1 — only PUBLISHED posts are prerendered. `getBlogPosts()` filters on status before
 *  mapping; `getBlogSlugs()` is the unfiltered read and must never appear here. */
export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

/** DEFENCE 2 — anything absent from the list above 404s at the routing layer, so a draft is
 *  never handed to the handler at all. Visible in the build as `fallback: false` for this
 *  route in `.next/prerender-manifest.json`.
 *
 *  THIS WAS UNVERIFIED FOR A `route.ts` WHEN IT WAS WRITTEN — no route handler in this repo
 *  used it, and defence 1 is only a prerender hint without it. It is proven by the manifest
 *  flipping, not by the docs. */
export const dynamicParams = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // `getBlogPost` is UNFILTERED by design — the studio preview reads drafts through it — so a
  // draft slug returns a real post with a real title and a real dek.
  const post = await getBlogPost(slug);
  // DEFENCE 3 — the handler gate, and it is load-bearing PRECISELY BECAUSE it does not depend
  // on the other two. If defence 2 ever stops applying to route handlers, this is what still
  // refuses. NEVER a `?? "Blog"` fallback: substituting a default for a missing entry is
  // exactly what made the case-study route return 200 for a slug that does not exist, and it
  // would render an unpublished title and dek at a guessable URL while the page 404s.
  if (!post || post.status !== "published") return new Response(null, { status: 404 });
  /* ⚠ THE PALETTE IS READ HERE RATHER THAN INSIDE `renderOgImage`, because the helper is a pure
   * renderer and the published theme is a CONTENT read. This route prerenders — the build writes an
   * `og.body` per slug — so the read happens once at build time, not per request.
   *
   * ⚠ AND A THEMED CARD IS THEMED AT SHARE TIME, NOT RETROACTIVELY. A platform stores the image it
   * scraped, so switching palettes does not repaint cards already sitting in feeds. Same staleness
   * the favicon has, on a surface nobody can flush — recorded so old cards are not reported as a
   * bug later. */
  const palette = THEME_OG[resolveTheme((await getSiteSettings())?.theme)];
  return renderOgImage({
    palette,
    // `topic` is free text and may be "", which renderOgImage handles by dropping the whole
    // eyebrow row rather than leaving the accent rule floating with no label.
    eyebrow: post.topic,
    title: post.title,
    subtitle: post.dek,
  });
}
