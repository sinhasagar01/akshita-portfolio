import { ImageResponse } from "next/og";
import { SITE_NAME, AUTHOR_JOB_TITLE } from "@/lib/site";

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

// Load one static Fraunces weight from Google Fonts for the headline. The legacy UA makes
// Google serve a TrueType file (Satori cannot use variable woff2). Memoized for the server
// lifetime; any failure resolves to null so the card falls back to the built-in font rather
// than breaking the build.
let fontPromise: Promise<ArrayBuffer | null> | null = null;
function loadBrandFont(): Promise<ArrayBuffer | null> {
  if (!fontPromise) {
    fontPromise = (async () => {
      try {
        const css = await fetch(
          "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600",
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
  eyebrow: string;
  title: string;
  subtitle?: string;
}): Promise<ImageResponse> {
  const font = await loadBrandFont();
  const fontFamily = font ? "Fraunces" : undefined;
  const sub =
    subtitle && subtitle.length > 140 ? `${subtitle.slice(0, 137)}…` : subtitle;

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

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 600,
              maxWidth: 1000,
            }}
          >
            {title}
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
        ? { fonts: [{ name: "Fraunces", data: font, weight: 600 as const, style: "normal" as const }] }
        : {}),
    },
  );
}
