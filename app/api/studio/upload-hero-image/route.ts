// POST /api/studio/upload-hero-image — P4-1 project heroImage upload (owner-gated).
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub
// call or image processing. Multipart body: { collection:"projects", slug, file }
// to set, or { collection, slug, clear:"true" } to remove. The server normalizes
// the upload to webp (sharp), derives the Keystatic-convention path itself (a
// client never supplies an image path), and commits the blob + the yaml heroImage
// edit in ONE atomic commit to the DRAFT branch (commitProjectHeroImage). github
// mode only (fs = no-op). Writes the draft branch only, never main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitProjectHeroImage } from "@/lib/studio/commit-collection-entry";
import { DRAFT_BRANCH, invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";
import { heroImageYamlValue } from "@/lib/studio/hero-image-path";
import { PROJECTS_IMAGE_BASE } from "@/lib/studio/collection-image-base";

// Accepted upload formats (all re-encoded to webp before commit) and the pre-
// normalize size cap. A raw phone screenshot is a few MB; 12 MB is generous.
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;
// Long-edge cap and quality for the normalized webp (keeps the repo lean; the
// generic hero renders with <Image fill>, so no stored dimensions are needed).
const MAX_EDGE = 2048;
const WEBP_QUALITY = 80;

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

  // PROJECTS ONLY, deliberately, until PR 3b. A blog hero commit goes through
  // commitProjectHeroImage -> serializeProjectEntry (the projects head-splice), which
  // returns unsupported_format on a blog yaml — so accepting "blog" here would derive
  // the right path and then fail with a projects error on a blog file, worse than a
  // clean rejection. PR 3b adds the blog hero serializer + commit and flips this to
  // accept "blog". (The block-image route, which commits a blob only, can already go
  // fully blog — see upload-block-image.)
  const collection = form.get("collection");
  if (collection !== "projects") {
    return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
  }
  const slug = form.get("slug");
  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  const clear = form.get("clear") === "true";
  const file = form.get("file");

  // Validate the file BEFORE the env-split so a bad upload is rejected in every
  // mode (the fs no-op cannot mask it). Skipped on clear (no file).
  if (!clear) {
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
    }
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

  // Normalize to webp (downscale to fit MAX_EDGE, never enlarge). rotate() bakes
  // in EXIF orientation so the stored pixels are upright. Only when setting.
  let image: Uint8Array | null = null;
  if (!clear) {
    try {
      const input = Buffer.from(await (file as File).arrayBuffer());
      const out = await sharp(input)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });
      image = new Uint8Array(out.data);
      // Dims are captured here (out.info.width/height) but not persisted — the
      // schema stays unchanged this step; the <Image fill> render needs no dims.
    } catch {
      return NextResponse.json({ ok: false, error: "image_processing_failed" }, { status: 422 });
    }
  }

  const result = await commitProjectHeroImage(slug, { image, branch: DRAFT_BRANCH });
  if (!result.ok) {
    const status =
      result.error.code === "not_found"
        ? 404
        : result.error.code === "unsupported_format"
          ? 422
          : 500;
    return NextResponse.json(result, { status });
  }

  invalidateDraftStateCache();
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    heroImage: clear ? null : heroImageYamlValue(PROJECTS_IMAGE_BASE, slug),
  });
}
