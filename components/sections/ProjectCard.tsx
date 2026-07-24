import Image from "next/image";
import Link from "next/link";
import type { ProjectListItem } from "@/lib/keystatic";
import { PROJECT_SVGS, FallbackProjectSvg } from "./ProjectCardSvgs";

type Props = { project: ProjectListItem };

// elevate-one-view's uploaded heroImage is a 390x988 PORTRAIT phone shot, unusable in
// the landscape 16:10 card frame (it would upscale and crop to a blurry sliver). Fall
// back to the hand-built mock until a landscape asset is uploaded. A content stopgap
// keyed by slug, not a code rule — remove the slug when the asset is replaced.
const HERO_IMAGE_UNSUITABLE = new Set<string>(["elevate-one-view"]);

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
export default function ProjectCard({ project }: Props) {
  const { slug, title, summary, facts, category, heroImage } = project;
  const useHero = Boolean(heroImage) && !HERO_IMAGE_UNSUITABLE.has(slug);
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
