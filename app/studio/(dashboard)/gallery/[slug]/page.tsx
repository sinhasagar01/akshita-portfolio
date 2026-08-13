// The gallery item editor — list, canvas and inspector, filling the window.
//
// ONE EDITOR AT ONE URL. `/studio/gallery` is the index (create, reorder, remove) and this is the
// editor. There is deliberately no second editing surface for the same content: the case study's
// unreachable `[slug]/body` copy is the recorded cost of that, and being unreachable is exactly
// how it drifted.
//
// NO PADDING WRAPPER. Like the blog editor, this takes no `STUDIO_PAGE` — the shell is a
// full-height layout whose panes scroll internally and which must reach the viewport edges.
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getStudioData } from "@/lib/studio/data";
import GalleryEditPanel from "@/components/studio/GalleryEditPanel";
import { clampInspectorWidth, INSPECTOR_BOUNDS } from "@/lib/studio/inspector-width";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function GalleryEditorPage({ params }: Props) {
  const { slug } = await params;
  // Draft-overlaid, so a just-created or just-edited item matches what the index showed. The same
  // list feeds the rail, so the index and the rail agree about which items exist.
  const { gallery } = await getStudioData();
  const item = gallery.find((g) => g.slug === slug);
  if (!item) notFound();

  /* ⚠ READ ON THE SERVER SO THE FIRST PAINT IS CORRECT RATHER THAN CORRECTED — #237's rule.
     Clamped against GALLERY'S OWN bounds: the three inspectors measure different minimums, so a
     width stored on one surface must not arrive at another outside its range. That is why there
     are three cookies rather than one. */
  const jar = await cookies();
  const inspectorWidth = clampInspectorWidth(
    jar.get(INSPECTOR_BOUNDS.gallery.cookie)?.value,
    "gallery"
  );

  /* ⚠ NO CANVAS ZOOM, AND THAT IS A DECISION RATHER THAN AN OMISSION. `ZOOM_COOKIE` is a
     `Record<ZoomSurface, …>` over `"cs" | "blog"` and this surface deliberately does not join it.
     Zoom exists where the canvas has a NATURAL WIDTH larger than its pane — the case study renders
     at 1280 and scales, blog holds a 68ch measure — so the control answers "show me more of a
     thing that does not fit". The overlay is fluid: it fills whatever pane it is given down to its
     stacking width. A zoom control there would scale a layout that had already adapted, which is
     two mechanisms arguing about the same pixels. */

  return <GalleryEditPanel slug={slug} item={item} items={gallery} inspectorWidth={inspectorWidth} />;
}
