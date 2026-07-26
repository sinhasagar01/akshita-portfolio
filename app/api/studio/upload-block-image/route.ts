// POST /api/studio/upload-block-image — block image upload, BOTH COLLECTIONS.
//
// Was "P4 4(b)-iv case-study block image upload", and further down said "the blog client
// wiring lands in PR 3c". PR 3c shipped in #174 and the blog editor has posted through this
// route since; the header described a state the code had left, which is the same defect
// class as a comment describing Tailwind variants that were never written. Corrected when
// `imageBlock` became this route's second blog consumer.
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub call
// or image processing. Multipart body: { slug, file }. github mode only (fs =
// no-op). Writes the draft branch only, never main.
//
// BLOB-ONLY, AND THAT IS THE POINT. Unlike upload-hero-image (which commits the blob
// AND the yaml edit together, because heroImage is a HEAD field with its own
// splice), this route never touches `sections`. It commits the normalized webp,
// returns its content-addressed path, and the panel sets `src` through the ordinary
// save — so `sections` keeps exactly ONE writer (the 4b-i sections-serialize seam),
// the discipline that has held since heroImage and `body` were locked out of the
// text path. Committing the blob before the yaml references it is harmless: blobs
// are content-addressed and immutable, so an abandoned upload is an inert orphan,
// never a broken reference.
//
// The client NEVER supplies a path. The server hashes the bytes it produced and
// derives the path itself, so a client cannot aim a write anywhere.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sharp from "sharp";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitFilesToDraft } from "@/lib/studio/commit-site-settings";
import { DRAFT_BRANCH, invalidateDraftStateCache } from "@/lib/studio/draft-site-settings";
import { blockImageHash, blockImageBlobPath, blockImageYamlValue } from "@/lib/studio/block-image-path";
import { imageBaseForCollection } from "@/lib/studio/collection-image-base";

// Same posture as upload-hero-image: accepted formats (all re-encoded to webp) and
// the pre-normalize cap.
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

  const slug = form.get("slug");
  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  // PR 3a — the collection selects the image tree (projects vs blog). Validated HERE,
  // BEFORE the file is read, BEFORE sharp normalizes anything, BEFORE the env-split, and
  // BEFORE any commit — so an unknown collection 400s without doing any work. Unlike the
  // hero route, block images commit a blob ONLY (the panel sets `src` through the
  // ordinary save), so no per-collection yaml serializer is needed and BOTH collections
  // are supported here. Both are now WIRED, too: projects through ImgSpecFields, blog
  // through imageBlock's own form.
  const collection = form.get("collection");
  const base = imageBaseForCollection(collection);
  if (!base) {
    return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
  }

  const file = form.get("file");

  // Validated BEFORE the env-split, so a bad upload is rejected in every mode and
  // the fs no-op cannot mask it.
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
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
  // EXIF orientation so the stored pixels are upright.
  let normalized: Uint8Array;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const out = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    normalized = new Uint8Array(out);
  } catch {
    return NextResponse.json({ ok: false, error: "image_processing_failed" }, { status: 422 });
  }

  // The identity is the NORMALIZED bytes, so the same source image always lands at
  // the same path — re-uploading is idempotent, and no position or session leaks in.
  const hash = blockImageHash(normalized);
  const result = await commitFilesToDraft({
    additions: [{ path: blockImageBlobPath(base, slug, hash), contents: normalized }],
    branch: DRAFT_BRANCH,
    message: `chore(studio): upload block image for ${collection}/${slug}`,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  invalidateDraftStateCache();
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    src: blockImageYamlValue(base, slug, hash),
  });
}
