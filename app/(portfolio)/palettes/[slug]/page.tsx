import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { paletteCompatibility, PALETTE_SLUGS } from "@/lib/palettes/compatibility";
import { THEME_GROUND } from "@/lib/theme";
import PaletteConsole from "@/components/palettes/PaletteConsole";

/* ============================================================================================
   `/palettes/<slug>` — THE SAME CONSOLE, OPENED ON ONE PALETTE.

   ⚠ THE SLUG SET IS DERIVED FROM THE REGISTRY, NOT LISTED. `PALETTE_SLUGS` is `THEME_NAMES` minus
   the verification twin — the same derivation `theme` P3-pop uses for the browser oracle — so a
   tenth palette cannot join the site unrouted. An enumerated list is correct on the day it is
   written and decays from then on, which is the shape this project keeps deleting.

   ⚠ `dynamicParams = false` IS A REFUSAL, AND IT WAS VERIFIED IN THE PRERENDER MANIFEST RATHER
   THAN READ FROM THE DOCS. `generateStaticParams` is a BUILD MANIFEST, not a gate — #203 found
   `/projects/[slug]/og` answering 200 on a slug that does not exist because the two were confused.
   What actually refuses an unknown slug is `fallback: false` in `.next/prerender-manifest.json`,
   and `notFound()` below is the second half for any path the manifest does not cover.
============================================================================================ */
export const dynamicParams = false;

export function generateStaticParams() {
  return PALETTE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — palette`,
    description: `The ${slug} palette as role tokens, with its measured contrast on every pair the site draws.`,
  };
}

export default async function PalettePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!PALETTE_SLUGS.includes(slug)) notFound();

  const ground = THEME_GROUND[slug];

  return (
    <>
      {/* ⚠ SET BEFORE PAINT, NOT IN AN EFFECT, AND THAT IS WHY IT IS AN INLINE SCRIPT. The root
          layout bakes the PUBLISHED theme into `<html>` at build — these pages are static — so a
          slug route asking for a different palette would otherwise render the published one and
          repaint after hydration. The site already uses exactly this pattern in `app/layout.tsx`
          for scroll restoration, and it runs during parse, so there is no window in which the
          wrong ground is visible.

          ⚠ AND IT WRITES BOTH ATTRIBUTES, because the role layer remaps on `data-ground` and not on
          `data-theme`. Setting the palette without the ground gives a dark palette's rungs under
          the light vocabulary — a dark page covered in light cards, which is the exact state the
          role migration was built to end. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            `document.documentElement.dataset.theme=${JSON.stringify(slug)};` +
            (ground === "dark"
              ? `document.documentElement.dataset.ground="dark";`
              : `delete document.documentElement.dataset.ground;`),
        }}
      />
      <PaletteConsole
        palettes={paletteCompatibility()}
        initialSlug={slug}
        ownsRootTheme
        />
    </>
  );
}
