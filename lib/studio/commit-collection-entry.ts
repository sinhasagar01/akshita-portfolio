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
import { serializeProjectEntry, serializeNewProject } from "./projects-serialize";
import { sanitizeProjectCreate, type ProjectsInput } from "./projects-format";
import { slugify } from "./slug";
import { getBranchHeadOid, getDefaultBranchHeadOid, getTreeRecursive } from "./github-commit";
import type { SaveError } from "./site-settings-format";
import { BESPOKE_SLUGS } from "../case-studies/types";

export type CollectionName = "experience" | "projects";
export type CollectionPatch = Partial<ExperienceInput> | Partial<ProjectsInput>;

const COLLECTION_PATH: Record<CollectionName, (slug: string) => string> = {
  experience: (slug) => `content/experience/${slug}.yaml`,
  projects: (slug) => `content/projects/${slug}.yaml`,
};

// The top-level entry file for a collection (NOT the body subdir), used to scan
// existing slugs for the create orderIndex max.
const COLLECTION_ENTRY_RE: Record<CollectionName, RegExp> = {
  experience: /^content\/experience\/[a-z0-9-]+\.yaml$/,
  projects: /^content\/projects\/[a-z0-9-]+\.yaml$/,
};

type Serialized = { ok: true; bytes: string } | { ok: false; error: SaveError };

// --- experience: one flat file; empty text writes as "" (quotingType '"'). ---
function serializeExperience(raw: string, patch: Partial<ExperienceInput>): Serialized {
  const loaded = (load(raw) ?? {}) as ExperienceRecord;
  const result = transformExperiencePatch(loaded, patch);
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
 * The highest orderIndex across a collection's existing entries at the base ref,
 * or -1 when the collection is empty (so a first create lands at 0). Reads the
 * base the commit will use (draft head if present, else main). Small collections,
 * so the per-entry reads are cheap.
 */
async function maxOrderIndex(collection: CollectionName, branch: string): Promise<number> {
  const baseOid = (await getBranchHeadOid(branch)) ?? (await getDefaultBranchHeadOid()).oid;
  const tree = await getTreeRecursive(baseOid);
  const re = COLLECTION_ENTRY_RE[collection];
  const entryPaths = tree.filter((t) => t.type === "blob" && re.test(t.path)).map((t) => t.path);
  let max = -1;
  for (const path of entryPaths) {
    const raw = await getFileTextAtRef(path, baseOid);
    const oi = (load(raw) as { orderIndex?: unknown } | null)?.orderIndex;
    if (typeof oi === "number" && oi > max) max = oi;
  }
  return max;
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
      return collection === "projects"
        ? serializeProjectEntry(raw, patch as Partial<ProjectsInput>)
        : serializeExperience(raw, patch as Partial<ExperienceInput>);
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

  if (collection === "experience") {
    const sanitized = sanitizeExperienceCreate(input);
    if (!sanitized.ok) return { ok: false, error: sanitized.error };
    slugSeed = sanitized.value.company;
    buildBytes = (orderIndex) => serializeExperienceCreate(sanitized.value, orderIndex);
  } else {
    const sanitized = sanitizeProjectCreate(input);
    if (!sanitized.ok) return { ok: false, error: sanitized.error };
    slugSeed = sanitized.value.title;
    buildBytes = (orderIndex) => serializeNewProject(sanitized.value, orderIndex);
  }

  const derived = slugify(slugSeed);
  if (!derived.ok) return { ok: false, error: derived.error };
  const slug = derived.slug;

  // orderIndex = max(existing)+1, EXPLICIT (never the asymmetric missing-value
  // default: projects sort 99 = last, experience 0 = top of the résumé).
  // DOUBLE BASE-RESOLUTION: this scan resolves the base, then commitFileToDraft
  // re-resolves internally; a concurrent commit in that window could make the
  // assigned orderIndex stale. Best-effort append ordering, not a correctness
  // invariant — expectedHeadOid still guards the write. Negligible for single-owner.
  let orderIndex: number;
  try {
    orderIndex = (await maxOrderIndex(collection, opts.branch)) + 1;
  } catch (e) {
    return {
      ok: false,
      error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) },
    };
  }

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
 * Delete a collection entry from the draft branch. Experience is one flat file.
 * Projects is a directory (<slug>.yaml + content/projects/<slug>/body/** mdocs):
 * the paths are enumerated from the git tree (GraphQL deletions take no globs) and
 * removed in ONE atomic commit. A bespoke slug is refused (literal route + a
 * hardcoded lib/case-studies module — deleting its content would half-remove it).
 */
export async function deleteCollectionEntry(
  collection: CollectionName,
  slug: string,
  opts: { branch: string; message?: string }
): Promise<FilesCommitResult> {
  const message = opts.message ?? `chore(studio): delete ${collection}/${slug} draft`;

  if (collection === "experience") {
    // Existence check so a delete of nothing is not reported as a false success.
    let raw: string;
    try {
      const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getDefaultBranchHeadOid()).oid;
      raw = await getFileTextAtRef(COLLECTION_PATH.experience(slug), baseOid);
    } catch (e) {
      return { ok: false, error: { code: "read_failed", message: e instanceof Error ? e.message : String(e) } };
    }
    if (raw.trim() === "") {
      return { ok: false, error: { code: "not_found", field: slug, message: `experience entry "${slug}" not found` } };
    }
    return commitFilesToDraft({
      deletions: [{ path: COLLECTION_PATH.experience(slug) }],
      branch: opts.branch,
      message,
    });
  }

  // projects — bespoke guard FIRST, before any read or write.
  if (BESPOKE_SLUGS.has(slug)) {
    return {
      ok: false,
      error: { code: "bespoke_locked", field: slug, message: `"${slug}" is a bespoke project and cannot be deleted here` },
    };
  }

  // Enumerate <slug>.yaml + every content/projects/<slug>/** file for one atomic
  // deletion commit. DOUBLE BASE-RESOLUTION: the tree is read at the resolved base,
  // then commitFilesToDraft re-resolves; a body file added under the slug in that
  // window would miss the deletion set → a possible orphan mdoc. Negligible for
  // single-owner (savingRef serializes saves); documented as a known window.
  let paths: string[];
  try {
    const baseOid = (await getBranchHeadOid(opts.branch)) ?? (await getDefaultBranchHeadOid()).oid;
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
