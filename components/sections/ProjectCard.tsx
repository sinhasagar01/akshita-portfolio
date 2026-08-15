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
 * landscape asset, else the hand-built mock. A hover `.wc-veil` slides the TITLE up over
 * the image; the `.wc-rail` beneath carries name, summary and category, so everything
 * that sells the piece survives touch.
 *
 * ---- ⚠ THE SUMMARY USED TO LIVE ONLY IN THE VEIL, AT `opacity: 0` UNTIL `:hover` -------------
 *
 * At 375px `matchMedia("(hover: hover)")` is FALSE, so the veil never opened and no phone
 * visitor ever read it. The grid showed four bare names. The one sentence on this site that
 * converts a hiring manager — boAt Crest lifting a store rating from 2.3 to 4 — was written,
 * was in the DOM, and was unreachable on the viewport most recruiters use.
 *
 * ⚠ AND IT WAS DUPLICATED INTO AN `sr-only` NODE, WHICH IS WHAT MAKES IT A DEFECT RATHER THAN A
 * TASTE QUESTION. Assistive tech was handed the outcome through `aria-describedby` while a
 * sighted phone user was not — the page served AT better than it served the majority of its
 * traffic. The hidden duplicate is gone and `aria-describedby` now points at the VISIBLE
 * summary, so AT receives the same two strings it always did and nothing is said twice.
 *
 * The veil keeps the title and the arrow and stays `aria-hidden`, because it repeats the rail.
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
        {/* Decorative hover duplicate of the title the rail already carries — aria-hidden
            so the anchor's accessible name stays the rail title, not the title twice
            plus a spoken arrow. */}
        <div className="wc-veil" aria-hidden="true">
          <p className="vt">{title} →</p>
        </div>
      </div>
      <div className="wc-rail">
        <span className="name" id={nameId}>
          {title}
        </span>
        {/* ⚠ VISIBLE, AND THE `aria-describedby` TARGET. Not an sr-only twin of a hover-only
            node — one string, one node, read by both a reader and a screen reader. */}
        {summary && (
          <span className="sum" id={descId}>
            {summary}
          </span>
        )}
        {catLabel && <span className="cat">{catLabel}</span>}
      </div>
    </Link>
  );
}
