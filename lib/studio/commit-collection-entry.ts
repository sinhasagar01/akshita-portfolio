// CE-1/CE-2 (edit) + F-3 (create/delete) — collection entry commits for /studio.
//
// INTERNET-EXPOSED WRITE: callers MUST pass the owner-session gate first. Reuses
// the shared commitFileToDraft / commitFilesToDraft machinery (DB-1 base logic +
// F-1 multi-file/deletions) — only the path and the serialization differ per
// collection. Collection edits land on the SAME draft branch as settings edits,
// so everything publishes together.
//
// F-3 splits commitCollectionEntry into two GUARDED paths behind an explicit
// intent: `edit` (the file MUST exist) and `create` (the file must NOT exist).
// Create derives its own slug from the input's slug field, so a client value can
// never become the create identity. Delete is a sibling deleteCollectionEntry.
import { serializeGalleryEntry } from "./gallery-serialize";
import type { GalleryInput } from "./gallery-format";
import { load, dump } from "js-yaml";
import {
  commitFileToDraft,
  commitFilesToDraft,
  getFileTextAtRef,
  type CommitResult,
  type FilesCommitResult,
} from "./commit-site-settings";
import {
  transformExperiencePatch,
  sanitizeExperienceCreate,
  type ExperienceInput,
  type ExperienceRecord,
  type ExperienceCreateInput,
} from "./experience-format";
import {
  serializeProjectEntry,
  serializeNewProject,
  serializeProjectOrder,
} from "./projects-serialize";
import { serializeProjectSections } from "./sections-serialize";
import { sanitizeProjectCreate, type ProjectsInput } from "./projects-format";
import {
  serializeBlogEntry,
  serializeNewBlogPost,
  serializeBlogBlocks,
} from "./blog-serialize";
import { sanitizeBlogCreate, type BlogInput } from "./blog-format";
import {
  heroImageYamlValue,
  heroImageBlobPath,
  heroImageBlobPathFromValue,
} from "./hero-image-path";
import {
  PROJECTS_IMAGE_BASE,
  BLOG_IMAGE_BASE,
  type CollectionImageBase,
} from "./collection-image-base";
import { slugify, freeSlug } from "./slug";
import { getBranchHeadOid, getBaseBranchHeadOid, getTreeRecursive } from "./github-commit";
import type { SaveError } from "./site-settings-format";

export type CollectionName = "experience" | "projects" | "blog" | "gallery";
export type CollectionPatch =
  | Partial<ExperienceInput>
  | Partial<ProjectsInput>
  | Partial<BlogInput>
  | Partial<GalleryInput>;

const COLLECTION_PATH: Record<CollectionName, (slug: string) => string> = {
  experience: (slug) => `content/experience/${slug}.yaml`,
  projects: (slug) => `content/projects/${slug}.yaml`,
  blog: (slug) => `content/blog/${slug}.yaml`,
  gallery: (slug) => `content/gallery/${slug}.yaml`,
};

/**
 * Every collection name, DERIVED from the path map rather than written down a second time.
 *
 * ⚠ THIS EXISTS BECAUSE FOUR ROUTES EACH CARRIED THEIR OWN HAND-LISTED COPY, as a chain of
 * `collection !== "…"` comparisons. Each chain was correct on the day it was written and each was
 * a place a fifth collection could be forgotten silently — the same fixed-list shape this project
 * has removed from `SETTINGS_THEME_VALUES`, from D12's pair list and from `paint-sites`' PAGES.
 *
 * ⚠ AND A DERIVED SET IS STRICTLY MORE THAN A WIDER LIST. Adding a member to `CollectionName`
 * already fails the build at the three `Record`s above; this makes every ROUTE that gates on the
 * name inherit that member the moment the Record does, so the allowlist and the dispatch arm can
 * no longer disagree. The membership rule is a PROPERTY — "is a collection this module can commit"
 * — rather than a list of names, which is the form `route-coverage` settled on for the same reason.
 */
export const COLLECTION_NAMES = Object.keys(COLLECTION_PATH) as readonly CollectionName[];

/** The guard those four routes now share. A body field is `unknown`, so this is where an HTTP
 *  string becomes a `CollectionName` — once, rather than four times. */
export function isCollectionName(value: unknown): value is CollectionName {
  return typeof value === "string"
    && Object.prototype.hasOwnProperty.call(COLLECTION_PATH, value);
}


// The top-level entry file for a collection (NOT the body subdir), used to scan
// existing slugs for the create orderIndex max.
const COLLECTION_ENTRY_RE: Record<CollectionName, RegExp> = {
  experience: /^content\/experience\/[a-z0-9-]+\.yaml$/,
  projects: /^content\/projects\/[a-z0-9-]+\.yaml$/,
  blog: /^content\/blog\/[a-z0-9-]+\.yaml$/,
  gallery: /^content\/gallery\/[a-z0-9-]+\.yaml$/,
};

/**
 * Which collections carry an `orderIndex`. BS-3b — blog does NOT: posts order by `date`
 * (the read path sorts on it), and there is no orderIndex field in the blog schema, so
 * inventing one would write a key nothing declares and nothing reads.
 *
 * This drives two things: the create scan skips the per-entry read when it is false (see
 * scanCollection), and reordering refuses the collection outright.
 */
const COLLECTION_HAS_ORDER: Record<CollectionName, boolean> = {
  experience: true,
  projects: true,
  blog: false,
  /* ⚠ TRUE, UNLIKE BLOG, AND THE DISCRIMINATOR IS WHAT SORTS THE PUBLIC PAGE. Posts order by
     `date`, which every post has and which an author does not arrange. A gallery has no natural
     order — a photograph from 2022 may belong beside one from 2025 — so the arrangement IS the
     authoring, and `reorder-entries` is the surface for it. */
  gallery: true,
};

/**
 * The reorder route's narrower subject — a collection this module can commit AND that carries an
 * `orderIndex`.
 *
 * ⚠ A SUBSET IS NOT AN EXCEPTION TO THE DERIVED GUARD, IT IS A SECOND PROPERTY, and writing it
 * that way is what keeps it from decaying. `reorder-entries` carried `!== "experience" && !==
 * "projects"` — correct on the day it was written, and it would have silently excluded the gallery
 * even though `COLLECTION_HAS_ORDER` declares gallery orderable. The list and the registry
 * disagreed and only the list was consulted.
 *
 * The membership rule is now the property itself, so a collection joins this set at the moment it
 * declares an order rather than when somebody remembers to edit a route.
 */
export function isOrderedCollection(value: unknown): value is CollectionName {
  return isCollectionName(value) && COLLECTION_HAS_ORDER[value];
}

type Serialized = { ok: true; bytes: string } | { ok: false; error: SaveError };

// --- experience: one flat file; empty text writes as "" (quotingType '"'). ---
function serializeExperience(raw: string, patch: Partial<ExperienceInput>): Serialized {
  const loaded = (load(raw) ?? {}) as ExperienceRecord;
  const result = transformExperiencePatch(loaded, patch);
  return { ok: true, bytes: dump(result.value, { quotingType: '"' }) };
}

// --- experience REORDER: only orderIndex changes; the canonical key order and the
// quotingType '"' dump are the edit path's, so an unchanged field round-trips
// byte-for-byte. ---
function serializeExperienceOrder(raw: string, orderIndex: number): Serialized {
  const loaded = (load(raw) ?? {}) as ExperienceRecord;
  const result = transformExperiencePatch({ ...loaded, orderIndex }, {});
  return { ok: true, bytes: dump(result.value, { quotingType: '"' }) };
}

// --- experience CREATE: the full record (company + orderIndex included), reordered
// to canonical schema order and dumped exactly like an edit (quotingType '"') for
// byte-compat. transformExperiencePatch reorders and applies an empty patch. ---
function serializeExperienceCreate(input: ExperienceCreateInput, orderIndex: number): Serialized {
  const record: ExperienceRecord = { ...input, orderIndex };
  const result = transformExperiencePatch(record, {});
  return { ok: true, bytes: dump(result.value, { quotingType: '"' }) };
}

/**
 * One scan of a collection at the base ref, giving BOTH facts a create needs: the
 * highest orderIndex (−1 when empty, so a first create lands at 0) and the set of
 * slugs already in use (for the auto-suffix).
 *
 * BS-3b — the per-entry READ is skipped for a collection with no orderIndex (blog). It
 * exists only to compute the max, so for blog it was one `getFileTextAtRef` per existing
 * post to produce a number the blog serializer discards — O(n) GitHub reads growing with
 * the archive, on the collection most likely to have a lot of entries. The tree read
 * stays: slug uniqueness still needs it, and it is a single call.
 *
 * Reads the base the commit will use (draft head if present, else main).
 */
async function scanCollection(
  collection: CollectionName,
  branch: string
): Promise<{ maxOrderIndex: number; slugs: Set<string> }> {
  const baseOid = (await getBranchHeadOid(branch)) ?? (await getBaseBranchHeadOid()).oid;
  const tree = await getTreeRecursive(baseOid);
  const re = COLLECTION_ENTRY_RE[collection];
  const entryPaths = tree.filter((t) => t.type === "blob" && re.test(t.path)).map((t) => t.path);
  const needsOrderIndex = COLLECTION_HAS_ORDER[collection];
  const slugs = new Set<string>();
  let max = -1;
  for (const path of entryPaths) {
    slugs.add(path.slice(path.lastIndexOf("/") + 1, -".yaml".length));
    if (!needsOrderIndex) continue;
    const raw = await getFileTextAtRef(path, baseOid);
    const oi = (load(raw) as { orderIndex?: unknown } | null)?.orderIndex;
    if (typeof oi === "number" && oi > max) max = oi;
  }
  return { maxOrderIndex: max, slugs };
}

// --- EDIT (today's behavior): the file MUST exist at the base, else not_found. ---
function editEntry(
  collection: CollectionName,
  slug: string,
  patch: CollectionPatch,
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  return commitFileToDraft({
    path: COLLECTION_PATH[collection](slug),
    branch: opts.branch,
    message: opts.message ?? `chore(studio): update ${collection}/${slug} draft`,
    transform: (raw) => {
      if (raw.trim() === "") {
        return {
          ok: false,
          error: { code: "not_found", field: slug, message: `${collection} entry "${slug}" not found` },
        };
      }
      // An explicit switch, not a projects-or-else ternary. BS-3b widened CollectionName
      // to three, and a two-way ternary would have silently routed blog into the
      // experience serializer — the kind of gap a widened union opens everywhere it is
      // branched on. Every arm is named; a fourth collection is a visible hole here.
      switch (collection) {
        case "projects":
          return serializeProjectEntry(raw, patch as Partial<ProjectsInput>);
        case "blog":
          return serializeBlogEntry(raw, patch as Partial<BlogInput>);
        case "experience":
          return serializeExperience(raw, patch as Partial<ExperienceInput>);
        case "gallery":
          return serializeGalleryEntry(raw, patch as Partial<GalleryInput>);
      }
    },
  });
}

// --- CREATE: sanitize the untrusted input, DERIVE the slug from its slug field,
// assign orderIndex = max+1, then commit only if the file does NOT already exist
// (slug_taken). The slug is never taken from a client value. ---
async function createEntry(
  collection: CollectionName,
  input: unknown,
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  let slugSeed: string;
  let buildBytes: (orderIndex: number) => Serialized;

  // Explicit per-collection arms (see editEntry's note on the widened union).
  if (collection === "experience") {
    const sanitized = sanitizeExperienceCreate(input);
    if (!sanitized.ok) return { ok: false, error: sanitized.error };
    slugSeed = sanitized.value.company;
    buildBytes = (orderIndex) => serializeExperienceCreate(sanitized.value, orderIndex);
  } else if (collection === "blog") {
    const sanitized = sanitizeBlogCreate(input);
    if (!sanitized.ok) return { ok: false, error: sanitized.error };
    slugSeed = sanitized.value.title;
    // orderIndex is IGNORED: blog has no such field (COLLECTION_HAS_ORDER), and
    // scanCollection therefore never computed a real one. Posts order by `date`.
    buildBytes = () => serializeNewBlogPost(sanitized.value);
  } else {
    const sanitized = sanitizeProjectCreate(input);
    if (!sanitized.ok) return { ok: false, error: sanitized.error };
    slugSeed = sanitized.value.title;
    buildBytes = (orderIndex) => serializeNewProject(sanitized.value, orderIndex);
  }

  const derived = slugify(slugSeed);
  if (!derived.ok) return { ok: false, error: derived.error };

  // orderIndex = max(existing)+1, EXPLICIT (never the asymmetric missing-value
  // default: projects sort 99 = last, experience 0 = top of the résumé).
  // DOUBLE BASE-RESOLUTION: this scan resolves the base, then commitFileToDraft
  // re-resolves internally; a concurrent commit in that window could make the
  // assigned orderIndex stale, or a slug taken. Best-effort — expectedHeadOid
  // still guards the write and the transform below still refuses an existing
  // file, so the worst case is a typed slug_taken, never a clobber. Negligible
  // for single-owner.
  let scan: { maxOrderIndex: number; slugs: Set<string> };
  try {
    scan = await scanCollection(collection, opts.branch);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }
  const orderIndex = scan.maxOrderIndex + 1;

  // AUTO-SUFFIX. Two entries can legitimately derive one slug (two roles at the
  // same company), so a collision picks the next free "-N" instead of refusing.
  const free = freeSlug(derived.slug, scan.slugs);
  if (!free.ok) return { ok: false, error: free.error };
  const slug = free.slug;

  const result = await commitFileToDraft({
    path: COLLECTION_PATH[collection](slug),
    branch: opts.branch,
    message: opts.message ?? `chore(studio): create ${collection}/${slug} draft`,
    transform: (raw) => {
      if (raw.trim() !== "") {
        return {
          ok: false,
          error: { code: "slug_taken", field: slug, message: `${collection} entry "${slug}" already exists` },
        };
      }
      return buildBytes(orderIndex);
    },
  });
  // Surface the server-DERIVED slug so the create route reports the identity
  // without re-deriving it (the lib owns slugify; the route just echoes it).
  return result.ok ? { ...result, slug } : result;
}

/**
 * Commit a collection entry to the draft branch. `intent` selects the guarded
 * path: `edit` (default — route-compatible) requires the file to exist; `create`
 * takes NO slug (it derives one from the input's slug field) and requires the
 * file NOT to exist. Separate code paths so create can never clobber and edit can
 * never conjure.
 */
export function commitCollectionEntry(
  collection: CollectionName,
  slug: string,
  patch: CollectionPatch,
  opts: { branch: string; message?: string; intent?: "edit" }
): Promise<CommitResult>;
export function commitCollectionEntry(
  collection: CollectionName,
  input: unknown,
  opts: { branch: string; message?: string; intent: "create" }
): Promise<CommitResult>;
export function commitCollectionEntry(
  collection: CollectionName,
  a: string | unknown,
  b: CollectionPatch | { branch: string; message?: string; intent?: "create" | "edit" },
  c?: { branch: string; message?: string; intent?: "create" | "edit" }
): Promise<CommitResult> {
  // opts is the last arg carrying `branch`: create passes it as `b`, edit as `c`.
  const opts = (c ?? b) as { branch: string; message?: string; intent?: "create" | "edit" };
  const intent = opts.intent ?? "edit";
  return intent === "create"
    ? createEntry(collection, a, opts)
    : editEntry(collection, a as string, b as CollectionPatch, opts);
}

/**
 * P4 4(b)-i — commit a project's `sections` to the draft branch. Uses the SAME
 * read-modify-write path as every text edit (commitFileToDraft: one base
 * resolution, the expectedHeadOid guard, DB-1 accumulation onto the shared
 * draft) — only the serializer differs. serializeProjectSections preserves the
 * head and `body: []` byte-for-byte and re-dumps only the sections tail, so an
 * edit to one block cannot disturb anything else in the file.
 *
 * INTERNET-EXPOSED WRITE: the caller (save-draft) MUST pass the owner gate and
 * sanitize first — this takes an already-validated sections array.
 */
export function commitProjectSections(
  slug: string,
  sections: unknown[],
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  return commitFileToDraft({
    path: COLLECTION_PATH.projects(slug),
    branch: opts.branch,
    message: opts.message ?? `chore(studio): update projects/${slug} sections draft`,
    transform: (raw) => {
      if (raw.trim() === "") {
        return {
          ok: false,
          error: { code: "not_found", field: slug, message: `projects entry "${slug}" not found` },
        };
      }
      return serializeProjectSections(raw, sections);
    },
  });
}

/**
 * BS-3b — commit a post's `blocks` to the draft branch. The blog twin of
 * commitProjectSections, and the same discipline: it rides the SAME read-modify-write
 * path as every text edit (one base resolution, the expectedHeadOid guard, DB-1
 * accumulation onto the shared draft) and only the serializer differs.
 * serializeBlogBlocks preserves the head byte-for-byte and re-dumps only the blocks
 * tail, so an edit to one block cannot disturb anything else in the file.
 *
 * `blocks` has exactly ONE writer, exactly as `sections` and `heroImage` do — the head
 * sanitizer rejects a `blocks` key on the text path.
 *
 * INTERNET-EXPOSED WRITE: the caller (save-draft) MUST pass the owner gate and sanitize
 * first — this takes an already-validated blocks array.
 */
export function commitBlogBlocks(
  slug: string,
  blocks: unknown[],
  opts: { branch: string; message?: string }
): Promise<CommitResult> {
  return commitFileToDraft({
    path: COLLECTION_PATH.blog(slug),
    branch: opts.branch,
    message: opts.message ?? `chore(studio): update blog/${slug} blocks draft`,
    transform: (raw) => {
      if (raw.trim() === "") {
        return {
          ok: false,
          error: { code: "not_found", field: slug, message: `blog entry "${slug}" not found` },
        };
      }
      return serializeBlogBlocks(raw, blocks);
    },
  });
}

/**
 * P4-1 — set or clear a project's heroImage on the draft branch in ONE atomic
 * commit: the normalized webp blob (or none, on clear) PLUS the yaml head edit
 * that points heroImage at it, PLUS a deletion of the previous blob when it had a
 * different path (a Keystatic-authored non-webp). The path convention comes from
 * hero-image-path (verified byte-compat with Keystatic). `image` is the already-
 * normalized webp bytes (the route runs sharp); null clears.
 *
 * INTERNET-EXPOSED WRITE: the caller (the upload route) MUST pass the owner gate.
 * The path is derived server-side here — a client never supplies an image path.
 *
 * DOUBLE BASE-RESOLUTION: the current entry is read at the base the commit will
 * use (draft head if a draft exists, else main — so the change accumulates onto
 * the draft, DB-1), then commitFilesToDraft re-resolves internally. Same
 * best-effort window as createEntry; expectedHeadOid still guards the write.
 */
export async function commitEntryHeroImage(
  collection: "projects" | "blog",
  slug: string,
  opts: { image: Uint8Array | null; branch: string; message?: string }
): Promise<FilesCommitResult> {
  const yamlPath = COLLECTION_PATH[collection](slug);
  // BS-3b — renamed from commitProjectHeroImage and generalised over the collection.
  // 3a parameterized the PATH helpers by base and left this projects-bound because a
  // blog hero commit needs a blog head serializer, which did not exist until now. The
  // two remaining projects-isms — which base, and which serializer — are just values,
  // so they are selected here rather than hardcoded.
  const base: CollectionImageBase =
    collection === "blog" ? BLOG_IMAGE_BASE : PROJECTS_IMAGE_BASE;
  const serializeHead = (raw: string, heroImage: string | null) =>
    collection === "blog"
      ? serializeBlogEntry(raw, { heroImage })
      : serializeProjectEntry(raw, { heroImage });

  let raw: string;
  try {
    const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getBaseBranchHeadOid()).oid;
    raw = await getFileTextAtRef(yamlPath, baseOid);
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }
  if (raw.trim() === "") {
    return {
      ok: false,
      error: { code: "not_found", field: slug, message: `${collection} entry "${slug}" not found` },
    };
  }

  // The previous blob (from the current yaml) — deleted when the new path differs. Read
  // under THIS collection's base, so one collection's hero is never a deletion target
  // for another's (the 3a isolation property).
  const oldValue = (load(raw) as { heroImage?: unknown } | null)?.heroImage;
  const oldBlobPath = heroImageBlobPathFromValue(base, oldValue);

  // heroImage HEAD edit through the collection's head-splice (its tail kept verbatim).
  // webp ext on upload; null on clear (Keystatic writes an absent image as null).
  const newValue = opts.image ? heroImageYamlValue(base, slug) : null;
  const ser = serializeHead(raw, newValue);
  if (!ser.ok) return { ok: false, error: ser.error };

  const newBlobPath = opts.image ? heroImageBlobPath(base, slug) : null;
  const additions: { path: string; contents: string | Uint8Array }[] = [
    { path: yamlPath, contents: ser.bytes },
  ];
  if (opts.image && newBlobPath) additions.push({ path: newBlobPath, contents: opts.image });

  const deletions: { path: string }[] = [];
  if (oldBlobPath && oldBlobPath !== newBlobPath) deletions.push({ path: oldBlobPath });

  return commitFilesToDraft({
    additions,
    deletions,
    branch: opts.branch,
    message:
      opts.message ??
      `chore(studio): ${opts.image ? "set" : "clear"} ${collection}/${slug} hero image`,
  });
}

// --- REORDER: set orderIndex from a position in the given slug order. Separate
// serializers from the edit path, because the edit sanitizers refuse orderIndex
// outright (a client must not be able to smuggle a position into a content save).
function serializeOrder(collection: CollectionName, raw: string, orderIndex: number): Serialized {
  return collection === "projects"
    ? serializeProjectOrder(raw, orderIndex)
    : serializeExperienceOrder(raw, orderIndex);
}

/**
 * Reorder a whole collection by writing each entry's `orderIndex` to its position
 * in `orderedSlugs`, in ONE atomic commit.
 *
 * ATOMIC BY CONSTRUCTION, and that is the point. A reorder moves at least two
 * entries, so doing it as N single-entry edits could half-apply and leave two
 * entries claiming the same position. One multi-file commit either lands whole or
 * not at all.
 *
 * The caller sends the FULL desired order, not a swap: the server assigns
 * positions from the array, so the stored indices are always a clean 0..N-1 no
 * matter what they were before (published entries have gaps). Entries whose index
 * is already correct are left out of the commit, so a no-op reorder writes
 * nothing.
 *
 * `orderedSlugs` must name exactly the collection's entries. A slug with no file
 * at the base is not_found — the alternative, silently skipping it, would commit
 * a reorder that does not match what the owner saw.
 */
export async function commitCollectionOrder(
  collection: CollectionName,
  orderedSlugs: readonly string[],
  opts: { branch: string; message?: string }
): Promise<FilesCommitResult> {
  // BS-3b — a collection with no orderIndex cannot be reordered, and this refuses at the
  // LIB boundary rather than relying on the route's allowlist. Widening CollectionName
  // made `commitCollectionOrder("blog", …)` type-check, and serializeOrder's two-way
  // branch would have written orderIndex through the EXPERIENCE serializer — inventing a
  // field the blog schema does not declare. Refused here so no future caller can.
  if (!COLLECTION_HAS_ORDER[collection]) {
    return {
      ok: false,
      error: {
        code: "unsupported_format",
        message: `${collection} entries have no order to set`,
      },
    };
  }

  const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getBaseBranchHeadOid()).oid;

  const additions: { path: string; contents: string }[] = [];
  for (const [index, slug] of orderedSlugs.entries()) {
    const path = COLLECTION_PATH[collection](slug);
    let raw: string;
    try {
      raw = await getFileTextAtRef(path, baseOid);
    } catch (e) {
      return {
        ok: false,
        error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
      };
    }
    if (raw.trim() === "") {
      return {
        ok: false,
        error: {
          code: "not_found",
          field: slug,
          message: `${collection} entry "${slug}" not found`,
        },
      };
    }
    // Already at this position — leave it out so a no-op reorder commits nothing.
    if ((load(raw) as { orderIndex?: unknown } | null)?.orderIndex === index) continue;

    const serialized = serializeOrder(collection, raw, index);
    if (!serialized.ok) return serialized;
    additions.push({ path, contents: serialized.bytes });
  }

  if (additions.length === 0) {
    return { ok: false, error: { code: "no_changes", message: "the order is unchanged" } };
  }

  return commitFilesToDraft({
    additions,
    branch: opts.branch,
    message: opts.message ?? `chore(studio): reorder ${collection} draft`,
  });
}

/**
 * Delete a collection entry from the draft branch. Experience and BLOG are one flat
 * file each. Projects is a directory (<slug>.yaml + content/projects/<slug>/body/**
 * mdocs): the paths are enumerated from the git tree (GraphQL deletions take no globs)
 * and removed in ONE atomic commit. A bespoke slug is refused (literal route + a
 * hardcoded lib/case-studies module — deleting its content would half-remove it).
 *
 * BS-3b — blog takes the FLAT-FILE branch, not the directory one. A post is a single
 * yaml; its images live under public/images/blog/<slug>/ and are deliberately NOT
 * enumerated here, matching the standing orphans-are-accepted decision (block images are
 * content-addressed and may be shared, so a naive delete could break another entry).
 */
export async function deleteCollectionEntry(
  collection: CollectionName,
  slug: string,
  opts: { branch: string; message?: string }
): Promise<FilesCommitResult> {
  const message = opts.message ?? `chore(studio): delete ${collection}/${slug} draft`;

  if (collection === "experience" || collection === "blog") {
    // Existence check so a delete of nothing is not reported as a false success.
    let raw: string;
    try {
      const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getBaseBranchHeadOid()).oid;
      raw = await getFileTextAtRef(COLLECTION_PATH[collection](slug), baseOid);
    } catch (e) {
      return { ok: false, error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) } };
    }
    if (raw.trim() === "") {
      return { ok: false, error: { code: "not_found", field: slug, message: `${collection} entry "${slug}" not found` } };
    }
    return commitFilesToDraft({
      deletions: [{ path: COLLECTION_PATH[collection](slug) }],
      branch: opts.branch,
      message,
    });
  }

  /* There used to be a bespoke guard here, refusing to delete `boat-crest` because its body lived
     in a TypeScript module a content delete could not reach. #292 moved it to YAML, so every
     project is now deletable through exactly this path and the guard had nothing left to refuse. */
  // Enumerate <slug>.yaml + every content/projects/<slug>/** file for one atomic
  // deletion commit. DOUBLE BASE-RESOLUTION: the tree is read at the resolved base,
  // then commitFilesToDraft re-resolves; a body file added under the slug in that
  // window would miss the deletion set → a possible orphan mdoc. Negligible for
  // single-owner (savingRef serializes saves); documented as a known window.
  let paths: string[];
  try {
    const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getBaseBranchHeadOid()).oid;
    const tree = await getTreeRecursive(baseOid);
    const yamlPath = COLLECTION_PATH.projects(slug);
    const dirPrefix = `content/projects/${slug}/`;
    paths = tree
      .filter((t) => t.type === "blob" && (t.path === yamlPath || t.path.startsWith(dirPrefix)))
      .map((t) => t.path);
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) } };
  }
  if (!paths.includes(COLLECTION_PATH.projects(slug))) {
    return { ok: false, error: { code: "not_found", field: slug, message: `project entry "${slug}" not found` } };
  }
  return commitFilesToDraft({
    deletions: paths.map((path) => ({ path })),
    branch: opts.branch,
    message,
  });
}

export type { CommitResult };
