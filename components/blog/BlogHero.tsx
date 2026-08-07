// The blog post hero, rendered by BOTH the public article and the studio canvas.
//
// WHY IT IS A COMPONENT RATHER THAN MARKUP ON THE PAGE. Written inline in the panel it would
// be a SECOND copy of a markup contract whose failure mode is 1.086px (see lib/blog/hero-fill.ts),
// and — the reason that actually decided it — /dev/blog-parity renders components, so a hero
// that lives in the page and in the panel is structurally unseen by the harness, which
// would go on reporting a clean pass. That is #180's `sections: 0, verdict: PARITY OK` false
// pass in a new form: a gate that cannot see the thing being added reads as evidence that it
// is fine. Sharing the component is what makes the hero gateable at all.
//
// THE SAME ARGUMENT THAT PUT BlogProse ON BOTH SURFACES. There is no studio lookalike here
// either.
//
// ---------------------------------------------------------------- THE ONE DELIBERATE BRANCH
// The article uses next/image; the canvas uses a plain <img>. This is the only place the two
// surfaces differ, and it is forced rather than chosen:
//
//   - The canvas src may be an owner-gated PROXY URL (/api/studio/draft-image?path=…). The
//     optimizer refetches its source server-side WITHOUT the session cookie, so /_next/image
//     cannot read it.
//   - The canvas src may be a `blob:` object URL for a file the author just picked. Object
//     URLs exist only in the tab that made them and cannot go through the optimizer at all.
//
// The ARTICLE must keep next/image: this is the largest image on the page, so `priority` plus
// the srcset is the LCP, and dropping it to match the canvas would trade real user-facing
// performance for a symmetry nobody can see.
//
// THIS IS THE EXISTING CONVENTION, NOT A NEW ONE. `ImageBlock` in BlogProse already renders a
// plain <img> with `rewriteSrc` on BOTH surfaces for exactly the first reason. The hero is
// the exception only because it is the LCP.
//
// ------------------------------------------------------------------------ ALL THREE BRANCHES
// Hero, no hero, and (at the callers) a hero with no blocks yet. The NO-HERO branch is the
// `mt-[44px]` spacer, and it lives here so neither surface can drop it: the canvas losing it
// would give every hero-less post a different top gap than the article, which is #178's 48px
// bug in miniature and would have been silent.
//
// PREVIEW ONLY, AND THE ABSENCE IS THE SIGNAL. An image carries no inline-editable text — the
// article hero has no caption, unlike imageBlock — so the only thing "editable" could mean is
// an upload affordance, which would be a SECOND write surface for a field HeroImageField
// already owns. Since #187 every editable element carries a dashed outline, so a hero without
// one reads as not-editable by the convention already on screen. A click-to-focus handler is
// available if that absence turns out to confuse; it is deliberately not here.
import Image from "next/image";
import { HERO_FILL_STYLE } from "@/lib/blog/hero-fill";

export default function BlogHero({
  src,
  canvas = false,
}: {
  /** Already resolved. The article passes `post.heroImage`; the canvas passes
   *  `resolveHeroSrc(...)`, which picks the object URL or the proxied path. */
  src: string | null;
  /** Studio canvas only. OFF by default, so the article gets next/image by construction and
   *  a caller cannot accidentally opt the public page out of its LCP image. */
  canvas?: boolean;
}) {
  // The article's else branch, verbatim. Not decoration — it is the gap the first paragraph
  // sits below when there is no hero, on both surfaces.
  if (!src) return <div className="mt-[44px]" />;

  return (
    <figure className="my-[44px]">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] border border-etch/8 bg-surface-well">
        {canvas ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="object-cover" style={HERO_FILL_STYLE} />
        ) : (
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 68ch"
            priority
            className="object-cover"
          />
        )}
      </div>
    </figure>
  );
}
