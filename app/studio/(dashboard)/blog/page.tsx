// The blog index — the list IS the page. Editing happens at /studio/blog/<slug> with the
// full width, mirroring /studio/projects. See BlogIndex for why this is not a
// ListDetailLayout rail (the studio removed that pattern for the case-study editor).
import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import BlogIndex from "@/components/studio/BlogIndex";
import { STUDIO_PAGE } from "@/lib/studio/page-class";

export const metadata = { robots: { index: false, follow: false } };

export default async function StudioBlogPage() {
  // Draft-preferring and UNFILTERED: getStudioData overlays the draft branch and its blog
  // list comes from getStudioBlogPosts, so a just-created (draft) post shows immediately.
  const { blog } = await getStudioData();

  return (
    <div className={STUDIO_PAGE}>
      <AreaHeader
        title="Blog"
        sub="Short posts. A new post starts as a draft and stays off /blog until you publish it."
      />
      <BlogIndex posts={blog} />
    </div>
  );
}
