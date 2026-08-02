// The blog hero's fill style and src precedence — the two pure pieces of BlogHero, in a
// leaf so ralph can import them. BlogHero itself is JSX and a strip-types run cannot load it.
//
// ---------------------------------------------------------------- WHY A LITERAL STYLE OBJECT
// The canvas draws the hero with a plain <img> where the article uses next/image with `fill`.
// Measured on the production bundle, that substitution is EXACT — figure 697.9297 x 392.5781,
// img 695.9297 x 390.5781, gap to the first paragraph 44, every delta zero at four decimal
// places — but ONLY when the plain <img> carries the same inline style next/image emits.
//
// THE OBVIOUS CLEANUP IS WRONG, AND IT FAILS SILENTLY. Replacing this with the Tailwind
// equivalent `absolute inset-0 h-full w-full object-cover` measures 391.664px tall against
// the article's 390.5781 — off by 1.086px — because app/globals.css carries an UNLAYERED
//
//     img, video { max-width: 100%; height: auto; display: block }
//
// and unlayered CSS outranks every @layer utilities declaration, so `h-full` loses to
// `height: auto`. This is the same hazard that cost `.blog-video-poster` in #180.
//
// The part that makes it dangerous rather than merely wrong: the `aspect-[16/9]` wrapper
// holds the OUTER box, so the figure still measures 392.5781 and the prose below still
// starts at the same y. A box-geometry gate sees nothing. Only the image inside the frame is
// wrong, and by an amount that depends on how far the source aspect sits from 16/9 — 1.086px
// for a 1.7768 photo, and grossly more for a portrait one. So the assertion that protects
// this is HERO_FILL_STYLE_CSS below, not a measurement.
//
// An inline style rather than an authored `blog-` class on purpose: it needs no new selector,
// so it adds no surface to the CSS gate, and it is literally the attribute value next/image
// already emits.

/** The React style object. Values are STRINGS so React does not append `px` to the zeros —
 *  `left: 0` would serialize as `left:0px` and diverge from next/image's `left:0`. */
export const HERO_FILL_STYLE = {
  position: "absolute",
  height: "100%",
  width: "100%",
  left: "0",
  top: "0",
  right: "0",
  bottom: "0",
  color: "transparent",
} as const;

/** What next/image emits for `fill`, read from the BUILT production HTML of
 *  /blog/what-a-data-table-teaches-you-about-trust. HERO_FILL_STYLE must serialize to
 *  exactly this — asserted in ralph/tests/canvas-hero.mjs, which is what turns the comment
 *  above into a gate. */
export const HERO_FILL_STYLE_CSS =
  "position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent";

/** Serialize a style object the way the browser writes `style` back out. Only has to handle
 *  the shape above — no numbers, no vendor prefixes — because its ONE job is the assertion. */
export function serializeStyle(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(";");
}

/**
 * Which src the CANVAS should draw for the hero, in precedence order.
 *
 * 1. `previewUrl` — a session-only object URL of the file the author just picked. It wins
 *    because `draftImages` is a SNAPSHOT taken server-side at page load, so a hero uploaded
 *    during the session is on the draft branch but NOT in that array. Without this the
 *    rewriter leaves the plain path alone, the path 404s against main, and the canvas shows
 *    a broken frame — the exact bug the draft proxy exists to prevent, one layer up.
 * 2. `rewriteSrc(heroImage)` — the committed path, routed through the owner-gated proxy when
 *    it changed on the draft branch, and left alone when it is a real asset on main.
 * 3. null — no hero, which BlogHero renders as the article's spacer branch.
 *
 * The ARTICLE never calls this. It has no draft images and no object URLs, so it passes
 * `post.heroImage` straight through.
 */
export function resolveHeroSrc({
  heroImage,
  previewUrl,
  rewriteSrc,
}: {
  heroImage: string | null;
  previewUrl?: string | null;
  rewriteSrc?: (src: string) => string;
}): string | null {
  if (previewUrl) return previewUrl;
  if (!heroImage) return null;
  return rewriteSrc ? rewriteSrc(heroImage) : heroImage;
}
