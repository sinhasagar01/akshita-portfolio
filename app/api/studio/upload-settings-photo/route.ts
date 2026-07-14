// POST /api/studio/upload-settings-photo — the site-settings portrait upload.
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub
// call or image processing. Multipart body: { file } to set, or { clear: "true" }
// to remove. github mode only (fs = no-op). Writes the draft branch only.
//
// THE LAST KEYSTATIC-ONLY FIELD to gain a /studio writer — photo was the one gap
// blocking the Keystatic retirement. It mirrors upload-hero-image exactly (owner
// gate, MIME allowlist, size cap, sharp normalize to webp, blob + yaml in ONE
// commit), differing only in that the settings singleton has no slug. The server
// derives the path and hashes nothing — there is one settings photo at a fixed
// path, so a re-upload overwrites it. sharp also fixes the 6.7 MB hand-authored jpg.
//
// The client NEVER supplies a path, and photo keeps exactly ONE writer: this route.
// The text sanitizer still rejects photo and transformSiteSettings still skips it.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitSettingsPhoto } from "@/lib/studio/commit-site-settings";
import { DRAFT_BRANCH, invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";
import { settingsPhotoYamlValue } from "@/lib/studio/settings-photo-path";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;
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

  // Normalize to webp (downscale to fit MAX_EDGE, never enlarge). rotate() bakes in
  // EXIF orientation. Only when setting.
  let image: Uint8Array | null = null;
  if (!clear) {
    try {
      const input = Buffer.from(await (file as File).arrayBuffer());
      const out = await sharp(input)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      image = new Uint8Array(out);
    } catch {
      return NextResponse.json({ ok: false, error: "image_processing_failed" }, { status: 422 });
    }
  }

  const result = await commitSettingsPhoto({ image, branch: DRAFT_BRANCH });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  invalidateDraftStateCache();
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    photo: clear ? null : settingsPhotoYamlValue(),
  });
}
