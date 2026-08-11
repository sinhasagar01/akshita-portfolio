// POST /api/studio/upload-hero-figure — the hero illustration upload.
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub call or image
// processing. Multipart body: { file } to set, or { clear: "true" } to revert to the shipped asset.
// github mode only (fs = no-op). Writes the draft branch only.
//
// ⚠ THE HERO'S ILLUSTRATION HAD NO WRITER AND NO FIELD AT ALL — it was a hardcoded `src` in
// `HeroSection.tsx`, so the one image the hero cannot do without was the one image /studio could
// not show or change. The owner found it missing. This route mirrors upload-settings-photo exactly
// (owner gate, MIME allowlist, size cap, sharp normalize to webp, blob + yaml in ONE commit).
//
// ⚠ TWO DELIBERATE DIFFERENCES FROM THE PORTRAIT ROUTE, BOTH ABOUT THE CUT-OUT.
//
//  1 · PNG IS ALLOWED AND ALPHA IS PRESERVED. The hero figure is a CUT-OUT — its transparency is
//      the whole asset, and the panel's plate, embers and grain are designed to show through it.
//      `sharp(...).webp()` keeps alpha, but a background flatten anywhere in this chain would bake
//      the editor's ground into the artwork. That is not hypothetical here: `raster-grounds` exists
//      because an illustration shipped with cream's ground baked in.
//
//  2 · MAX_EDGE IS 2048, NOT THE PORTRAIT'S. The shipped figure is 1033x1024 and the panel drives
//      its HEIGHT, so it upscales on every retina laptop already — the asset note says so and
//      accepts it. Downscaling an upload below the shipped size would make a replacement worse than
//      the thing it replaces, so the cap is generous and the guidance lives in the field's helper
//      text rather than in a silent resize.
//
// The client NEVER supplies a path, and heroFigure keeps exactly ONE writer: this route. The text
// sanitizer rejects heroFigure and transformSiteSettings skips it, exactly as they do for photo.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitSettingsHeroFigure } from "@/lib/studio/commit-site-settings";
import { DRAFT_BRANCH, invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";
import { heroFigureYamlValue } from "@/lib/studio/hero-figure-path";

const ALLOWED_TYPES = new Set(["image/png", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 2048;
const WEBP_QUALITY = 90;

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const clear = form.get("clear") === "true";
  const file = form.get("file");

  // Validate BEFORE the env-split so a bad upload is rejected in every mode (the fs no-op cannot
  // mask it). Skipped on clear (no file).
  if (!clear) {
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
    }
    // ⚠ JPEG IS ABSENT ON PURPOSE — it cannot carry alpha, so a jpeg upload here would be a
    // cut-out with its background baked in, arriving as a rectangle over the panel. Refusing the
    // format is a clearer failure than accepting it and drawing the wrong thing.
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
    }
  }

  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      saved: false,
      note: "image upload needs github mode",
    });
  }
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  // Normalize to webp (downscale to fit MAX_EDGE, never enlarge). rotate() bakes in EXIF
  // orientation. NO flatten and NO background — alpha is the asset.
  let image: Uint8Array | null = null;
  if (!clear) {
    try {
      const input = Buffer.from(await (file as File).arrayBuffer());
      const out = await sharp(input)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
        .toBuffer();
      image = new Uint8Array(out);
    } catch {
      return NextResponse.json({ ok: false, error: "image_processing_failed" }, { status: 422 });
    }
  }

  const result = await commitSettingsHeroFigure({ image, branch: DRAFT_BRANCH });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  invalidateDraftStateCache();
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    heroFigure: clear ? null : heroFigureYamlValue(),
  });
}
