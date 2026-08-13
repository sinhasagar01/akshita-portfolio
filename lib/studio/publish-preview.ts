// What a publish would actually change, turned into something an author can read.
//
// ---- ⚠ WHY THIS EXISTS AT ALL ----------------------------------------------------------------
//
// Hazard 13: a publish shipped a half-finished sentence. The mitigation on record was a HABIT —
// read the content diff before each publish — and a habit is what failed. No gate can close this
// one, because CI cannot tell a half-finished sentence from a finished one; only the author can,
// and only if they look. So the preview is the confirm step rather than a side door.
//
// ---- ⚠ AND WHY IT IS PURE --------------------------------------------------------------------
//
// The browser path cannot be driven from a gate: opening the dialog needs an owner session and a
// live draft branch, and the harness has neither. `bar-clearance.ts` made this split for the same
// reason and earned it — the arithmetic it separated out was the part that was WRONG. So the
// classification and the line extraction live here, asserted directly, and what is left in the
// route is one fetch and a lookup.
//
// This file imports nothing AT RUNTIME, so it can be loaded by a leaf runner and so nothing here
// can reach a DOM or a network. `inspector-width.ts` holds the same shape for the same reason.
// A TYPE-ONLY import is erased at compile and does not break that — see `COLLECTION_GROUPS` below,
// which is how this module derives the collection names without importing the module that owns them.

import type { CollectionName } from "./commit-collection-entry";

/** content/<collection>/<slug>.yaml — the top-level entry file, not the body subdir.
 *
 *  ⚠ ONE HOME, TWO READERS. `draft-site-settings.ts` classifies the same filenames to build its
 *  overlay and used to carry its own copy of this. Two regexes over one filename shape drift the
 *  moment a collection is added — and a fourth collection is a live possibility, which is why the
 *  overlay's own dispatch is written as a named record rather than a ternary.
 *
 *  ⚠ THE FOURTH COLLECTION LANDED, AND THE PREDICTION ABOVE IS WHY THIS LIST IS NOW GATED RATHER
 *  THAN MERELY WIDENED. `commit-collection-entry.ts` holds the authoritative `CollectionName`
 *  union and derives every allowlist from it — but it imports js-yaml and the GitHub client, and
 *  the header two paragraphs up is the reason this file cannot import it back. So this is a
 *  FORCED SECOND COPY, the same shape as `INSPECTOR_BOUNDS`' canvas floors and the three theme
 *  surfaces that cannot see each other.
 *
 *  THE COPY IS ALLOWED BECAUSE SOMETHING COMPARES IT. `ralph/tests/publish-preview.mjs` section H
 *  parses the union out of `commit-collection-entry.ts` as text and fails if this alternation and
 *  that union stop naming the same set — which is what makes a missing member a red suite rather
 *  than a collection whose draft edits are silently invisible to the overlay and the preview. */
export const COLLECTION_FILE_RE =
  /^content\/(projects|experience|blog|gallery)\/([a-z0-9-]+)\.yaml$/;

/**
 * The collection names this module recognises, as a `Record` over the authoritative union.
 *
 * ⚠ A TYPE-ONLY IMPORT AND A LOCAL VALUE, WHICH IS THE ONLY SHAPE THE LEAF DISCIPLINE ALLOWS HERE.
 * This file imports nothing at runtime so a leaf runner can load it — the header says so — and
 * `isCollectionName` lives in a module that reaches GitHub. The type is ERASED at compile, so
 * `Record<CollectionName, true>` costs nothing at runtime and still makes a fifth collection a
 * BUILD FAILURE at this line rather than an `undefined` label in the publish dialog.
 *
 * THIS IS WHAT THE CAST WAS STANDING IN FOR. `as PreviewGroup` asserted the same thing and checked
 * none of it.
 */
const COLLECTION_GROUPS: Record<CollectionName, true> = {
  projects: true,
  experience: true,
  blog: true,
  gallery: true,
};

function isCollectionGroup(value: string): value is CollectionName {
  return Object.prototype.hasOwnProperty.call(COLLECTION_GROUPS, value);
}

/** The skills singleton, one flat file rather than content/<coll>/<slug>.yaml. */
export const SKILLS_FILE = "content/skills.yaml";

/** Site settings, likewise a singleton. */
export const SETTINGS_FILE = "content/settings.yaml";

/** Uploaded media. Grouped rather than diffed — a binary has no patch to show. */
const IMAGE_RE = /^public\/images\/([a-z0-9-]+)\/([a-z0-9-]+)\//;

/* ⚠ THE COLLECTION MEMBERS ARE DERIVED, NOT LISTED, AND A CAST USED TO HIDE THE GAP. `classifyFile`
   read a collection name out of `COLLECTION_FILE_RE` and returned it as `entry[1] as PreviewGroup`.
   The regex was widened to admit gallery; this union and the `KIND` map below were not — and the
   CAST SUPPRESSED THE ERROR THAT WOULD HAVE CAUGHT IT. A gallery row reached the publish dialog
   with `KIND[group]` undefined, so the one gate an author cannot walk past labelled it with nothing.

   ⚠ THE ARM WAS NOT ADDED. Adding `gallery` here repairs one instance of a shape that repeats;
   deriving the collection half from `CollectionName` makes the SIXTH collection a compile error at
   the `KIND` map instead. This arc has taken that answer four times — the create dispatch, the
   order serializers, the delete branch and the publish checks. */
export type PreviewGroup =
  | CollectionName
  | "skills"
  | "settings"
  | "image"
  | "other";

export type ClassifiedFile = {
  group: PreviewGroup;
  /** The entry's slug for a collection file, else null. Names the title lookup. */
  slug: string | null;
};

/**
 * Which part of the site a changed file belongs to.
 *
 * ⚠ EVERY ARM IS NAMED, INCLUDING `other`. A file the studio does not recognise — a doc, a
 * component, anything committed outside the editor — must still APPEAR in the preview. Dropping
 * it would make the dialog claim a publish carries less than it does, which is the exact inversion
 * this feature exists to prevent.
 */
export function classifyFile(filename: string): ClassifiedFile {
  const entry = filename.match(COLLECTION_FILE_RE);
  /* ⚠ A GUARD, NOT A CAST. `as PreviewGroup` told the compiler to stop checking exactly the join
     that was broken — the regex's alternation against this module's own vocabulary. `isCollectionName`
     asks instead, so a name the regex admits and this union does not is a narrowing failure the
     build reports rather than an `undefined` reaching a label. */
  if (entry && isCollectionGroup(entry[1])) return { group: entry[1], slug: entry[2] };
  if (filename === SKILLS_FILE) return { group: "skills", slug: null };
  if (filename === SETTINGS_FILE) return { group: "settings", slug: null };
  const image = filename.match(IMAGE_RE);
  if (image) return { group: "image", slug: image[2] };
  return { group: "other", slug: null };
}

export type ChangedLine = { sign: "+" | "-"; text: string };

/**
 * The added and removed lines of a unified patch, as text.
 *
 * ⚠ HUNK HEADERS ARE DROPPED, AND SO IS CONTEXT. `@@ -0,0 +1,6 @@` is developer output in a tool
 * built for a designer, and unchanged context lines are noise next to the two or three that moved.
 * What survives is exactly what a publish would alter.
 *
 * ⚠ `+++` AND `---` ARE DROPPED TOO, AND THAT IS THE SUBTLE ONE. A file header starts with the
 * same character as a real added line, so a naive startsWith("+") reports the header as content.
 * GitHub's per-file `patch` usually omits them, but "usually" is not a property to found a
 * correctness claim on, and the cost of being wrong is a preview that shows a filename where the
 * author is looking for a sentence.
 *
 * The leading marker is stripped from `text` because the sign is carried structurally — the
 * renderer prints it as its own glyph, so colour is never the only thing distinguishing the two.
 */
export function changedLines(patch: string): ChangedLine[] {
  const out: ChangedLine[] = [];
  for (const line of patch.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) out.push({ sign: "+", text: line.slice(1) });
    else if (line.startsWith("-")) out.push({ sign: "-", text: line.slice(1) });
  }
  return out;
}

/** A compare file, narrowed to what the preview needs. Mirrors `compareBranches`' shape. */
export type PreviewInputFile = {
  filename: string;
  status: string;
  patch?: string | null;
};

export type PreviewEntry = {
  /** What the author calls it. Falls back to the slug, then the filename. */
  title: string;
  /** "Blog post", "Case study", "Site settings" … */
  kind: string;
  /** "new", "edited", "deleted". */
  change: string;
  group: PreviewGroup;
  lines: ChangedLine[];
  /** A text file whose patch GitHub withheld. Distinct from "no changes". */
  unavailable: boolean;
  /** How many image files this entry rolls up. Zero for a content entry. */
  imageCount: number;
};

const KIND: Record<PreviewGroup, string> = {
  projects: "Case study",
  experience: "Experience",
  blog: "Blog post",
  /* The reader-facing name, which is the only place the collection's machine name becomes English
     in this dialog. Absent, `KIND[group]` was `undefined` and the row carried no kind at all. */
  gallery: "Gallery item",
  skills: "Skills",
  settings: "Site settings",
  image: "Images",
  other: "File",
};

/** GitHub's per-file status, in the author's words. */
function changeWord(status: string): string {
  if (status === "added") return "new";
  if (status === "removed") return "deleted";
  return "edited";
}

export type PreviewResult = {
  entries: PreviewEntry[];
  /** Total changed files, which is NOT entries.length — images roll up. */
  fileCount: number;
  /** The compare hit GitHub's cap, so this list is incomplete. */
  truncated: boolean;
};

/**
 * Group the changed files into entries an author recognises.
 *
 * `titles` maps a slug to its human title. A DELETED entry is absent from it, because the draft
 * overlay subtracts a deletion from the studio's read — so the slug is the fallback, and that is a
 * stated limit rather than a hidden one.
 *
 * ⚠ IMAGES ROLL UP PER SLUG, CONTENT DOES NOT. Ten uploaded images under one post are one line
 * saying ten; ten changed fields in that post are ten lines, because the words are the thing being
 * checked. `fileCount` therefore counts FILES while `entries` counts things worth reading, and the
 * dialog states the file count so the rollup can never read as a smaller publish than it is.
 */
export function buildPreview(
  files: readonly PreviewInputFile[],
  titles: Readonly<Record<string, string>>,
  truncated: boolean,
): PreviewResult {
  const entries: PreviewEntry[] = [];
  const imagesBySlug = new Map<string, number>();

  for (const file of files) {
    const { group, slug } = classifyFile(file.filename);
    if (group === "image") {
      const key = slug ?? file.filename;
      imagesBySlug.set(key, (imagesBySlug.get(key) ?? 0) + 1);
      continue;
    }
    const patch = file.patch ?? "";
    const lines = patch ? changedLines(patch) : [];
    entries.push({
      title: (slug ? titles[slug] : undefined) ?? slug ?? file.filename,
      kind: KIND[group],
      change: changeWord(file.status),
      group,
      lines,
      // A removal has nothing to show and is not "unavailable" — the entry is gone, which the
      // change word already says. Only a surviving file with no patch is a withheld diff.
      unavailable: !patch && file.status !== "removed",
      imageCount: 0,
    });
  }

  for (const [key, count] of imagesBySlug) {
    entries.push({
      title: titles[key] ?? key,
      kind: KIND.image,
      change: "edited",
      group: "image",
      lines: [],
      unavailable: false,
      imageCount: count,
    });
  }

  return { entries, fileCount: files.length, truncated };
}
