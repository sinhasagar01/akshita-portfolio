import { ImageResponse } from "next/og";
import { SITE_NAME, AUTHOR_JOB_TITLE } from "@/lib/site";
// The measured title fit lives in a plain .ts leaf so ralph can DRIVE it rather than regex it —
// this file is .tsx and node's type-stripping cannot load it, the same constraint
// blog-empties.ts records. Every number's derivation is there.
import { fitTitle } from "@/lib/og-fit";

/**
 * Shared Open Graph card renderer. One brand-consistent 1200×630 layout used by every
 * per-case-study `opengraph-image` route, so the social-card design lives in one place.
 * Colors are the brand tokens as hex (Satori does not resolve oklch / CSS vars).
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

/* ⚠ THE CARD FOLLOWS THE PUBLISHED PALETTE, AND THESE ARE ITS CREAM DEFAULTS.
 *
 * `ImageResponse` renders OUTSIDE the document and cannot read a CSS custom property, so a card's
 * colours must be literals — the same forced form the favicon and `THEME_SPLASH` have. `THEME_OG`
 * in `lib/theme.ts` holds them per theme; these four are the fallback used when no palette is
 * passed, so a caller that forgets one still draws a correct cream card rather than a black box.
 *
 * ⚠ AND THREE OF THEM NAMED A TOKEN AND WERE NOT IT until #368 — ink-950 was 26.7 away, ink-600
 * 34.8, accent-500 30.7, each beside a comment asserting equality. `token-claims.mjs` is the
 * instrument that shape never had; it reads these lines. */
const CREAM = "#fafafa"; // --color-cream-50 / page background
const INK = "#0b0b0b"; //   --color-ink-950
const MUTED = "#484848"; //  --color-ink-600
const ACCENT = "#000000"; // --color-accent-500

/** The four colours a card draws in. Defaults to cream so an omitted palette is still correct. */
export type OgPalette = { cream: string; ink: string; muted: string; accent: string };
const CREAM_PALETTE: OgPalette = { cream: CREAM, ink: INK, muted: MUTED, accent: ACCENT };

// Load one static Source Serif 4 weight from Google Fonts for the headline. The legacy UA makes
// Google serve a TrueType file (Satori cannot use variable woff2). Memoized for the server
// lifetime; any failure resolves to null so the card falls back to the built-in font rather
// than breaking the build.
//
// ⚠ THIS FETCHED FRAUNCES UNTIL THIS COMMIT, AND THAT WAS A LIVE INCONSISTENCY RATHER THAN A
// LEFTOVER. Once `--font-display` repointed, every article page rendered Source Serif and every
// social card rendered Fraunces, so the same title looked like two different sites depending on
// whether you arrived from a link or from a feed. The card is the FIRST impression of the page
// and the one a reader cannot compare against anything, which is what made it worth its own PR.
//
// THE FAMILY NAME IS USED IN THREE PLACES and they must agree: the Google query, the `fontFamily`
// applied to the card, and the `fonts` entry Satori registers. They are one constant now, because
// a mismatch between the registered name and the applied one falls back silently to the built-in
// face — the card still renders, and it renders in something nobody chose.
// ⚠ AND IT HAPPENED AGAIN, IN THE SAME PLACE, FOR THE SAME REASON — WHICH IS WHY THE NOTE ABOVE
// STAYS. `--font-display` repointed a second time, from Source Serif 4 to IBM Plex Sans, and this
// constant is the one thing on the site that cannot notice. `typography` D2 is what noticed: it
// asserts this family IS the one the display role resolves to, so the failure arrived as a red row
// rather than as a feed full of serif cards under a grotesque site. The gate the first incident
// produced is the reason the second cost one line.
/** The one name. Used by the Google query, the applied `fontFamily`, and Satori's font entry. */
const BRAND_FONT = "IBM Plex Sans";

/** The script face of the wordmark. Used by the brand card only — the content card has no script.
 *
 *  ⚠ THE SAME THREE-PLACE AGREEMENT `BRAND_FONT` DOCUMENTS ABOVE, AND FOR THE SAME REASON. The
 *  Google query, the applied `fontFamily` and Satori's `fonts` entry must name one face, because a
 *  mismatch falls back silently to the built-in and the card renders in something nobody chose.
 *  `typography` asserts this IS what `--font-script` resolves to, which is the check that made the
 *  second `BRAND_FONT` repoint cost one line instead of a feed full of wrong cards. */
const SCRIPT_FONT = "Kaushan Script";

/* ⚠ ONE LOADER, MEMOISED PER QUERY, AND IT WAS ONE FUNCTION FOR ONE FACE. The brand card needs two
 * faces and a second copy of the fetch would be a second place for the legacy-UA trick and the
 * format regex to drift. Keyed on the full query so `wght@600` and `wght@400` are separate entries
 * rather than the first one winning. */
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
function loadGoogleFont(family: string, axis?: string): Promise<ArrayBuffer | null> {
  const query = `${family.replace(/ /g, "+")}${axis ? `:${axis}` : ""}`;
  const hit = fontCache.get(query);
  if (hit) return hit;
  const p = (async () => {
    try {
      const css = await fetch(
        /* ⚠ NO `opsz` AXIS ANY MORE, AND KEEPING IT WOULD HAVE FAILED SILENTLY. `opsz,wght@8..60,600`
           is Source Serif's variable axis descriptor. Plex Sans is served as static instances, so
           that query returns nothing usable, the loader resolves null by design, and the card
           renders in Satori's built-in face — still a card, still rendering, in a font nobody
           chose. Exactly the failure mode the constant above was unified to prevent, reachable
           through the QUERY instead of through the name.
           ⚠ AND A FACE WITH NO AXIS MUST SEND NO COLON. `Kaushan+Script:` returns nothing, so the
           axis is optional here rather than defaulted — a single-instance face and a variable one
           are two query shapes and the difference is silent. */
        `https://fonts.googleapis.com/css2?family=${query}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko)",
          },
        },
      ).then((r) => r.text());
      const url = css.match(
        /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/,
      )?.[1];
      if (!url) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch {
      return null;
    }
  })();
  fontCache.set(query, p);
  return p;
}

function loadBrandFont(): Promise<ArrayBuffer | null> {
  return loadGoogleFont(BRAND_FONT, "wght@600");
}

export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
  palette = CREAM_PALETTE,
}: {
  /** The kind of thing this is. Case studies pass the literal "Case study"; blog passes the
   *  post's `topic`, which is FREE TEXT and may be "" — see the render below, which drops the
   *  whole row rather than leaving the accent rule floating with no label beside it. */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** The published palette's card colours. Omitted means cream — see `CREAM_PALETTE`. */
  palette?: OgPalette;
}): Promise<ImageResponse> {
  const font = await loadBrandFont();
  const fontFamily = font ? BRAND_FONT : undefined;
  const sub =
    subtitle && subtitle.length > 140 ? `${subtitle.slice(0, 137)}…` : subtitle;
  // The cap and the size step, both measured — see lib/og-fit.ts for the derivation.
  const head = fitTitle(title);
  const showEyebrow = eyebrow.trim() !== "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: palette.cream,
          color: palette.ink,
          padding: "80px",
          ...(fontFamily ? { fontFamily } : {}),
        }}
      >
        {/* THE WHOLE ROW GOES, NOT JUST THE TEXT. An empty `topic` would otherwise leave the
            48px accent rule sitting alone at the top of the card with nothing beside it, which
            reads as a broken element rather than a deliberate one. A rule with no label is not
            a design detail, it is a leftover. `space-between` then distributes the slack and
            the remaining composition is title, dek and footer — still balanced, one branch. */}
        {showEyebrow ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 4, backgroundColor: palette.accent }} />
            <div
              style={{
                fontSize: 24,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: palette.accent,
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </div>
          </div>
        ) : (
          // An empty box keeps `space-between` honest, so dropping the label does not shove the
          // title upward into where the eyebrow was.
          <div />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: head.sizePx,
              lineHeight: 1.05,
              fontWeight: 600,
              maxWidth: 1000,
            }}
          >
            {head.text}
          </div>
          {sub ? (
            <div
              style={{
                fontSize: 32,
                lineHeight: 1.35,
                color: palette.muted,
                maxWidth: 940,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 600 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 26, color: palette.muted }}>{AUTHOR_JOB_TITLE}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      ...(font
        ? { fonts: [{ name: BRAND_FONT, data: font, weight: 600 as const, style: "normal" as const }] }
        : {}),
    },
  );
}

/* ============================================================================================
   THE BRAND CARD — the identity lockup, for the site's own share surface.

   ⚠ IT REPLACES A STATIC PNG THAT WAS DRAWN IN A PALETTE THE SITE RETIRED. `app/opengraph-image.png`
   was committed long before the media and sampled at a warm cream ground `251,246,238`, a warm ink
   `28,24,19` and a terracotta accent `181,97,60` — the cream palette. No shipping palette is warm at
   those values, so the image every link to the domain root showed was the one surface that had
   stopped being the site.

   ⚠ AND IT IS THE SAME LOCKUP THE NAV DRAWS, WHICH IS WHAT MADE IT A DEFECT RATHER THAN A CHOICE. A
   fixed brand asset is legitimate — the favicon is exactly that, by ruling, because hue is not
   perceptible at 16 to 64px. This is 1200x630 and the nav's copy of the lockup FOLLOWS the palette:
   `.logo-singh` takes `--color-accent` and `.logo-sig` takes the ink. So the same mark existed twice,
   one themed and one frozen, and on a dark palette they disagreed outright.

   ⚠ THE COMPOSITION IS THE CARD'S, NOT THE NAV'S, AND THAT IS DELIBERATE. The nav lockup puts a
   vertical bar between the script word and the surname because it is 24px tall in a horizontal pill.
   The card has 630px and uses the original's arrangement — monogram over script over rules over the
   job line. Two surfaces, one mark, two compositions; only the COLOURS are shared.

   THE GRID BOX IS FIXED AND THE WORD IS CENTRED OVER IT, because Satori cannot measure the script
   word before layout and a grid sized from the text would need a metric this cannot ask for. The
   original overflows its grid top and bottom too, so a fixed box is the design rather than a
   compromise.
============================================================================================ */

/** The construction grid behind the script word — four columns, two rows, in the accent at a weight
 *  that reads as a drafting underlay rather than as a table. */
const GRID = { w: 496, h: 148, cols: 4, rows: 2, opacity: 0.45 } as const;

/* ⚠ THE GRID IS A RASTERISED SVG, AND TWO CSS ATTEMPTS FAILED SILENTLY BEFORE THIS ONE. Satori is
 * not a browser and its gaps do not announce themselves — a line that does not draw looks exactly
 * like a line nobody asked for.
 *
 *     borders on the box and on each column      NOTHING drew
 *     1px fills — verticals `width:1`+`height`   the VERTICALS drew
 *                 horizontals `height:1`         the HORIZONTALS did not, in either the
 *                                                `width` or the `left`+`right` form, and a
 *                                                clean rebuild produced BYTE-IDENTICAL output
 *
 * ⚠ THE FIRST FAILURE SHIPPED A STRIKETHROUGH THROUGH THE NAME. With only the middle rule drawing,
 * the card read as the wordmark crossed out — the second time in two days a single line across type
 * has read as cancellation rather than as structure. That is why this is an image: the monogram
 * proves Satori rasterises an SVG faithfully, so the grid stops depending on which CSS box model
 * Satori implements this week. */
function gridDataUri(accent: string): string {
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const cols = Array.from({ length: GRID.cols + 1 }, (_, i) => {
    const x = (i * GRID.w) / GRID.cols;
    return line(x, 0, x, GRID.h);
  }).join("");
  const rows = Array.from({ length: GRID.rows + 1 }, (_, i) => {
    const y = (i * GRID.h) / GRID.rows;
    return line(0, y, GRID.w, y);
  }).join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID.w} ${GRID.h}">` +
    `<g stroke="${accent}" stroke-width="1" stroke-opacity="${GRID.opacity}">${cols}${rows}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** The monogram, as a data URI so Satori rasterises it rather than interpreting inline SVG nodes.
 *  Its three fills were hardcoded terracotta — `#D89067`, `#9B4F2C`, `#7E3F22`, three more values
 *  frozen in the retired palette. They are derived from the card's accent now: the ribbon reads as
 *  one material lit from the top left, so the gradient is the accent lightened and darkened rather
 *  than two unrelated hues. */
function monogramDataUri(accent: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 44">` +
    `<defs><linearGradient id="rib" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${accent}" stop-opacity="0.82"/>` +
    `<stop offset="1" stop-color="${accent}"/></linearGradient></defs>` +
    `<path d="M23 4 L40 40 L31 40 L23 21 L15 40 L6 40 Z" fill="url(#rib)"/>` +
    `<path d="M23 4 L23 21 L15 40 L19 40 Z" fill="${accent}" opacity="0.42"/>` +
    `<path d="M17 30 L29 30 L31.5 36 L14.5 36 Z" fill="url(#rib)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * The site's own 1200×630 share card. Draws the identity lockup in the published palette's card
 * colours — the same four `THEME_OG` values every per-page card uses, so a feed shows one site.
 */
export async function renderBrandCard({
  palette = CREAM_PALETTE,
}: { palette?: OgPalette } = {}): Promise<ImageResponse> {
  const [sans, script] = await Promise.all([
    loadGoogleFont(BRAND_FONT, "wght@600"),
    loadGoogleFont(SCRIPT_FONT),
  ]);
  /* ⚠ EACH FACE IS APPLIED ONLY IF ITS OWN BYTES ARRIVED. Applying a `fontFamily` Satori has no
   * entry for falls back to the built-in silently, so a half-loaded pair must not name the face it
   * did not get — that is the difference between a card in a fallback face and a card whose script
   * word renders as a grotesque and looks deliberate. */
  const fonts = [
    ...(sans ? [{ name: BRAND_FONT, data: sans, weight: 600 as const, style: "normal" as const }] : []),
    ...(script ? [{ name: SCRIPT_FONT, data: script, weight: 400 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.cream,
          color: palette.ink,
          ...(sans ? { fontFamily: BRAND_FONT } : {}),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders this, not the browser */}
        <img src={monogramDataUri(palette.accent)} width={92} height={88} alt="" />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: GRID.w,
            height: GRID.h,
            marginTop: 52,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders this, not the browser */}
          <img
            src={gridDataUri(palette.accent)}
            width={GRID.w}
            height={GRID.h}
            alt=""
            style={{ position: "absolute", left: 0, top: 0 }}
          />
          <div
            style={{
              fontSize: 148,
              lineHeight: 1,
              color: palette.ink,
              ...(script ? { fontFamily: SCRIPT_FONT } : {}),
            }}
          >
            {SITE_NAME.split(" ")[0]}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 26 }}>
          <div style={{ width: 150, height: 2, backgroundColor: palette.accent }} />
          <div
            style={{
              fontSize: 34,
              letterSpacing: 10,
              fontWeight: 600,
              color: palette.accent,
            }}
          >
            {SITE_NAME.split(" ").slice(1).join(" ").toUpperCase()}
          </div>
          <div style={{ width: 150, height: 2, backgroundColor: palette.accent }} />
        </div>

        <div style={{ fontSize: 32, letterSpacing: 11, marginTop: 54, color: palette.muted }}>
          {AUTHOR_JOB_TITLE.toUpperCase()}
        </div>
      </div>
    ),
    { ...OG_SIZE, ...(fonts.length ? { fonts } : {}) },
  );
}
