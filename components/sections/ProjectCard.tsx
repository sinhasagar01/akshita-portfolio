import Image from "next/image";
import Link from "next/link";
import type { ProjectListItem } from "@/lib/keystatic";
import { PROJECT_SVGS, FallbackProjectSvg } from "./ProjectCardSvgs";

type Props = {
  project: ProjectListItem;
  /**
   * Skip the image optimizer, emitting the src as a plain `<img>`.
   *
   * FOR THE STUDIO'S DETAILS CANVAS. A COMMITTED hero is a plain public path and optimizes fine —
   * 200 through `/_next/image`. A hero that changed on the DRAFT branch is served by the
   * owner-gated proxy, and one uploaded THIS SESSION is a `blob:` url. Neither survives the
   * optimizer.
   * AND STATE:1660's STATED MECHANISM IS RIGHT, WHICH I ONLY ESTABLISHED BY READING THE SERVER
   * LOG. From the browser the proxy answers 200 (the cookie is there) and the optimizer answers
   * 400, which looks like the optimizer merely refusing the url shape. It is not: the server log
   * shows the optimizer's own refetch of that url returning **401**, then reporting "isn't a
   * valid image … received null". The 400 the client sees is the optimizer's outward response to
   * its own 401. Measuring only the client half gave the wrong cause for the right symptom.
   * DEFAULTS TO UNDEFINED, so the public render is byte-identical and the DOM gate proves it.
   */
  unoptimized?: boolean;
};

// Rail label: the category (title-cased) plus facts.platform, but drop the platform
// segment when it only restates the category (case-insensitive), so "web" + "Web" and
// "mobile" + "Mobile" do not stutter. Only boat-crest ("Mobile · Android and iOS")
// carries a platform detail today.
function railCategory(category: string, platform: string): string {
  const cat = category ? category[0].toUpperCase() + category.slice(1) : "";
  const plat = platform.trim();
  if (!cat) return plat;
  if (!plat || plat.toLowerCase() === category.toLowerCase()) return cat;
  return `${cat} · ${plat}`;
}

/**
 * One work card — a single block-level anchor (no nested interactive elements), so the
 * whole card is the link. The frame shows the uploaded heroImage when it is a usable
 * landscape asset, else the hand-built mock. A hover `.wc-veil` slides the story up over
 * the image; the `.wc-rail` beneath always carries name + category so the pattern
 * survives touch. The platform glow + dock cascade land in PR 3, the filter in PR 4.
 *
 * Accessible name is the rail title alone (aria-labelledby): the veil is a decorative
 * hover duplicate (aria-hidden), and the summary reaches AT through a visually-hidden
 * node the anchor points at with aria-describedby, so it is never lost to the veil.
 */
export default function ProjectCard({ project, unoptimized }: Props) {
  const { slug, title, summary, facts, category, heroImage } = project;
  // Show the uploaded heroImage when there is one, else the hand-built mock. (elevate-one-view
  // was force-fallen-back while its uploaded hero was a portrait phone shot unusable in the
  // landscape 16:10 card; the asset is now a 1600×1000 landscape banner, so the stopgap is gone.)
  const useHero = Boolean(heroImage);
  const svg = PROJECT_SVGS[slug] ?? FallbackProjectSvg;
  const nameId = `wc-${slug}-name`;
  const descId = `wc-${slug}-desc`;
  const catLabel = railCategory(category, facts.platform);

  return (
    <Link
      href={`/projects/${slug}`}
      className="work-card group"
      data-cat={category || undefined}
      aria-labelledby={nameId}
      aria-describedby={summary ? descId : undefined}
    >
      <div className="wc-shot">
        {useHero ? (
          <Image
            src={heroImage as string}
            alt=""
            fill
            sizes="(min-width: 1024px) 500px, 100vw"
            className="object-cover"
            unoptimized={unoptimized}
          />
        ) : (
          svg
        )}
        {/* Decorative hover duplicate of content the rail already carries — aria-hidden
            so the anchor's accessible name stays the rail title, not the title twice
            plus a spoken arrow. */}
        <div className="wc-veil" aria-hidden="true">
          <p className="vt">{title} →</p>
          {summary && <p className="vs">{summary}</p>}
        </div>
      </div>
      <div className="wc-rail">
        <span className="name" id={nameId}>
          {title}
        </span>
        {catLabel && <span className="cat">{catLabel}</span>}
      </div>
      {/* Summary for assistive tech (the visible copy lives in the aria-hidden veil). */}
      {summary && (
        <span id={descId} className="sr-only">
          {summary}
        </span>
      )}
    </Link>
  );
}
