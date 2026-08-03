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

const CREAM = "#FBF6EE"; // --color-cream-50 / page background
const INK = "#1c1813"; //   --color-ink-950
const MUTED = "#6F665B"; //  --color-ink-600
const ACCENT = "#C0673E"; // --color-accent-500

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
/** The one name. Used by the Google query, the applied `fontFamily`, and Satori's font entry. */
const BRAND_FONT = "Source Serif 4";

let fontPromise: Promise<ArrayBuffer | null> | null = null;
function loadBrandFont(): Promise<ArrayBuffer | null> {
  if (!fontPromise) {
    fontPromise = (async () => {
      try {
        const css = await fetch(
          `https://fonts.googleapis.com/css2?family=${BRAND_FONT.replace(/ /g, "+")}:opsz,wght@8..60,600`,
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
  }
  return fontPromise;
}

export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  /** The kind of thing this is. Case studies pass the literal "Case study"; blog passes the
   *  post's `topic`, which is FREE TEXT and may be "" — see the render below, which drops the
   *  whole row rather than leaving the accent rule floating with no label beside it. */
  eyebrow: string;
  title: string;
  subtitle?: string;
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
          backgroundColor: CREAM,
          color: INK,
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
            <div style={{ width: 48, height: 4, backgroundColor: ACCENT }} />
            <div
              style={{
                fontSize: 24,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: ACCENT,
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
                color: MUTED,
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
          <div style={{ fontSize: 26, color: MUTED }}>{AUTHOR_JOB_TITLE}</div>
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
