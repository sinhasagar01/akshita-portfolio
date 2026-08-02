// The blog index — the list IS the page. Editing happens at /studio/blog/<slug> with the
// full width, mirroring /studio/projects. See BlogIndex for why this is not a
// ListDetailLayout rail (the studio removed that pattern for the case-study editor).
import { cookies } from "next/headers";
import { getStudioData } from "@/lib/studio/data";
import BlogIndex from "@/components/studio/BlogIndex";
import { STUDIO_PAGE } from "@/lib/studio/page-class";
import { indexViewCookie, parseIndexView } from "@/lib/studio/index-view";

export const metadata = { robots: { index: false, follow: false } };

export default async function StudioBlogPage() {
  // Draft-preferring and UNFILTERED: getStudioData overlays the draft branch and its blog
  // list comes from getStudioBlogPosts, so a just-created (draft) post shows immediately.
  const { blog } = await getStudioData();

  // THE VIEW IS RESOLVED HERE, ON THE SERVER, so the first HTML is already the right one and
  // there is nothing for hydration to correct. Read in the ROUTE rather than the dashboard
  // layout: that layout serves ten pages and this value belongs to one — the same shared-seam
  // question #239, #240 and #244 each answered the same way. PER-COLLECTION cookie, so choosing
  // a view here cannot silently change the case-studies index.
  const view = parseIndexView((await cookies()).get(indexViewCookie("blog"))?.value);

  return (
    <div className={STUDIO_PAGE}>
      {/* NO 60rem CAP AND NO `AreaHeader` HERE. The field measure is for pages of PROSE; this one
          is cards and single-line summaries, so width buys more posts per row rather than a
          harder paragraph. The header is rendered by the index so it can share a row with
          controls that need client state. Both match the case-studies index next door. */}
      <BlogIndex posts={blog} initialView={view} />
    </div>
  );
}
