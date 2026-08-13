// The gallery's write contract — what a patch and a create may carry, and nothing else.
//
// Mirrors `projects-format.ts` field for field in SHAPE, not by extraction: the two share a
// posture (explicit key arms, reject-unknown, omit-when-empty for enums) and no code, because a
// shared sanitizer would need a per-collection field table and that table is the thing each file
// IS. Two hundred lines of near-identical structure is the honest cost of two collections whose
// fields genuinely differ.
//
// ---- ⚠ THE DIMENSIONS ARE ACCEPTED BUT NEVER AUTHORED ----------------------------------------
//
// `width` and `height` are written by the upload route from the normalized bytes, and the editor
// posts them straight back. They are validated here like any other field — the route is trusted to
// compute them, NOT trusted to be the only writer, because a patch is an HTTP body and the owner
// cookie is the only thing between it and this function.
//
// ⚠ AND THEY ARE REQUIRED TO BE POSITIVE, WHICH IS THE WHOLE POINT. The masonry is CSS `columns`
// and reflows on load unless every intrinsic size is known before decode. A zero or a negative is
// not a smaller image, it is a layout shift — so it is refused here rather than rendered.
import type { GalleryItem } from "@/lib/keystatic";
import type { SaveError } from "./site-settings-format";

/** The three buckets the public filter offers. The enum lives here, at the write boundary, for the
 *  reason `theme` states in the schema: the config is schema-only, so a select there would give the
 *  reader a second opinion about validity. */
export const GALLERY_KINDS = ["photo", "illus", "proj"] as const;

export type GalleryInput = {
  title?: string;
  kind?: (typeof GALLERY_KINDS)[number];
  image?: string | null;
  width?: number;
  height?: number;
  alt?: string;
  description?: string;
  tags?: string[];
  caseStudy?: string;
  orderIndex?: number;
};

/* ⚠ `SaveError`, THE SHARED SHAPE — the first version of this file returned `{ error: string }`
   and every other sanitizer in this directory returns `{ error: { code, field, message } }`.
   `save-draft` hands the result straight to `NextResponse.json`, so a gallery 400 would have
   carried a DIFFERENT BODY from a projects or blog 400 and any client error handling would have
   been silently wrong for exactly one collection.

   ⚠ AND NOTHING WOULD HAVE CAUGHT IT. The ternary dispatch types each arm independently, so four
   incompatible return shapes compile. Turning that dispatch into a `Record<CollectionName, …>` is
   what surfaced this — the mapped type refused to build until all four agreed. */
type Ok<T> = { ok: true; patch: T };
type Bad = { ok: false; error: SaveError };

const invalid = (message: string, field?: string): Bad =>
  ({ ok: false, error: { code: "invalid_patch", field, message } });

/** A positive integer, which is what a pixel dimension is. Rejects 0, negatives, fractions and
 *  anything unparseable — see the header for why a bad dimension is a layout shift rather than a
 *  smaller image. */
function positiveInt(value: unknown, key: string): { ok: true; value: number } | Bad {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalid(`${key} must be a number`, key);
  }
  if (!Number.isInteger(value) || value <= 0) {
    return invalid(`${key} must be a positive whole number of pixels`, key);
  }
  return { ok: true, value };
}

/**
 * What a gallery PATCH accepts. Every key is optional (a patch names only what changed) and an
 * unknown key is rejected rather than dropped — the posture every sanitizer in this directory
 * takes, so a typo in a field name is a 400 rather than a silent no-op.
 */
export function sanitizeGalleryPatch(raw: unknown): Ok<GalleryInput> | Bad {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("patch must be an object");
  }
  const patch: GalleryInput = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === "title" || key === "alt" || key === "description") {
      if (typeof value !== "string") return invalid(`${key} must be a string`, key);
      patch[key] = value;
      continue;
    }
    if (key === "kind") {
      // Strict enum, omit-when-empty — `template`'s exact contract in projects-format.
      if (typeof value !== "string") return invalid("kind must be a string", key);
      if (value !== "" && !(GALLERY_KINDS as readonly string[]).includes(value)) {
        return invalid(`kind must be one of ${GALLERY_KINDS.join(", ")}`, key);
      }
      if (value !== "") patch.kind = value as GalleryInput["kind"];
      continue;
    }
    if (key === "image") {
      // null is a real value here — it is how the editor clears an image.
      if (value !== null && typeof value !== "string") {
        return invalid("image must be a string or null", key);
      }
      patch.image = value as string | null;
      continue;
    }
    if (key === "width" || key === "height") {
      const res = positiveInt(value, key);
      if (!res.ok) return res;
      patch[key] = res.value;
      continue;
    }
    if (key === "tags") {
      if (!Array.isArray(value) || value.some((t) => typeof t !== "string")) {
        return invalid("tags must be an array of strings", key);
      }
      // Trimmed and blank-dropped at the boundary, so a half-typed row never reaches disk.
      patch.tags = (value as string[]).map((t) => t.trim()).filter(Boolean);
      continue;
    }
    if (key === "caseStudy") {
      /* ⚠ A SLUG SHAPE, NOT AN EXISTENCE CHECK, AND THE DIFFERENCE IS DELIBERATE. Verifying the
         study exists would make this sanitizer read the projects collection — a write path taking
         a dependency on another collection's content, which then fails at save time if a study is
         renamed. The link is optional and one-way; a stale one renders as no link rather than as
         an error, and the public page is where that is resolved. */
      if (typeof value !== "string") return invalid("caseStudy must be a string", key);
      if (value !== "" && !/^[a-z0-9-]+$/.test(value)) {
        return invalid("caseStudy must be a slug (lowercase, digits, hyphens)", key);
      }
      if (value !== "") patch.caseStudy = value;
      continue;
    }
    if (key === "orderIndex") {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return invalid("orderIndex must be a whole number", key);
      }
      patch.orderIndex = value;
      continue;
    }
    return invalid(`unknown field ${key}`, key);
  }
  return { ok: true, patch };
}

/**
 * What a gallery CREATE accepts — the title alone, exactly as the projects create does.
 *
 * ⚠ THE IMAGE IS NOT ACCEPTED HERE AND THAT IS THE SEQUENCE, NOT AN OMISSION. An upload is a
 * multipart POST to `upload-block-image` that needs a slug to name its path, so the entry must
 * exist first. A create that took an image would need a second upload route that invents a slug,
 * which is the seam `blockImageBlobPath` exists to prevent.
 */
export function sanitizeGalleryCreate(raw: unknown): Ok<{ title: string }> | Bad {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return invalid("input must be an object");
  }
  /* ⚠ EVERY KEY IS INSPECTED AND AN UNKNOWN ONE IS REFUSED, matching `sanitizeProjectCreate` —
     which rejects `orderIndex` and `body` by name rather than dropping them. The first version of
     this function read `title` and ignored the rest, so posting an image at create would have
     succeeded and silently discarded it: a save that reports success and changes nothing, which is
     the shape this studio has already shipped once. Caught by the row written to assert the
     sequence, not by reading the code. */
  const obj = raw as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key === "title") continue;
    if (key === "image") {
      return invalid(
        "image is uploaded after create — the entry must exist before its image has a path",
        key
      );
    }
    if (key === "orderIndex") {
      return invalid("orderIndex is assigned by the server on create", key);
    }
    return invalid(`unknown field ${key}`, key);
  }
  const title = obj.title;
  if (typeof title !== "string" || title.trim() === "") {
    return invalid("title is required", "title");
  }
  return { ok: true, patch: { title: title.trim() } };
}

/**
 * The publish gate — alt is required on every item, optional at save.
 *
 * ⚠ `validate-blog-post`'s SPLIT EXACTLY, and the reason transfers unchanged: a freshly added item
 * legitimately has no alt yet, so refusing an empty one at SAVE would make the kind unaddable. It
 * is publish that must refuse, because a published gallery of images without alt is the single
 * accessibility failure this feature can uniquely produce.
 *
 * ⚠ AND UNLIKE BLOG THERE IS NO `status` FIELD, so there is no draft state to be permissive about.
 * A gallery item is public the moment it is on main — the projects posture — which makes this gate
 * the ONLY thing standing between an unlabelled image and a reader.
 */
export function galleryPublishBlockers(items: readonly GalleryItem[]): string[] {
  const blockers: string[] = [];
  for (const item of items) {
    if (item.alt.trim() === "") {
      blockers.push(`${item.slug}: alt text must not be empty — describe the image`);
    }
    if (!item.image) {
      blockers.push(`${item.slug}: no image uploaded`);
    }
    /* The masonry cannot lay out without these, and they are machine-written — so a zero here is
       an item that never completed its upload rather than an author's omission. */
    if (item.width <= 0 || item.height <= 0) {
      blockers.push(`${item.slug}: image dimensions are missing — re-upload the image`);
    }
  }
  return blockers;
}
