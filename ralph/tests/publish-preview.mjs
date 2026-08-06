// The publish preview — hazard 13's answer, and the parts of it a gate can actually reach.
// Run: node --experimental-strip-types ralph/tests/publish-preview.mjs
//
// ⚠ WHY THE LOGIC IS A PURE LEAF AT ALL. Opening the dialog needs an owner session and a live
// draft branch, and the harness has neither — so the browser path is unreachable from here. The
// classification and the line extraction are therefore split out and asserted DIRECTLY, exactly as
// `bar-clearance.ts` split `clearanceFrom`. That split earned itself: the arithmetic it separated
// was the part that was wrong, and the DOM half around it never was.
//
// ⚠ AND WHAT THIS SUITE CANNOT SEE. It cannot prove the dialog renders, that focus lands on Cancel,
// or that the contrast holds — those were driven in a browser and reported with their numbers.
// Naming the gap here is what stops "asserted" from being read as "all of it is asserted".
import { readFileSync } from "node:fs";
import {
  classifyFile,
  changedLines,
  buildPreview,
  COLLECTION_FILE_RE,
  SKILLS_FILE,
  SETTINGS_FILE,
} from "../../lib/studio/publish-preview.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const code = (p) =>
  readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

/* ── PART A · classifyFile ─────────────────────────────────────────────────────────────────── */

t("A1: a blog entry file classifies by collection and slug",
  classifyFile("content/blog/5-tips-for-using-ai-for-designers.yaml"),
  { group: "blog", slug: "5-tips-for-using-ai-for-designers" });
t("A1: …and a case study does too", classifyFile("content/projects/boat-crest.yaml"),
  { group: "projects", slug: "boat-crest" });
t("A1: …and an experience row", classifyFile("content/experience/elevate.yaml"),
  { group: "experience", slug: "elevate" });

t("A2: the skills singleton is its own group, with no slug",
  classifyFile(SKILLS_FILE), { group: "skills", slug: null });
t("A2: …and site settings likewise",
  classifyFile(SETTINGS_FILE), { group: "settings", slug: null });

t("A3: an uploaded image classifies as an image, carrying the slug it belongs to",
  classifyFile("public/images/blog/some-post/heroImage.webp"),
  { group: "image", slug: "some-post" });

/* ⚠ AN UNRECOGNISED FILE MUST STILL APPEAR. Dropping it would let the dialog claim a publish
 * carries less than it does — the exact inversion this feature exists to prevent. So `other` is a
 * real arm rather than a fallthrough that discards. */
t("A4: a file the studio does not own is `other`, NOT dropped",
  classifyFile("docs/STATE.md"), { group: "other", slug: null });
t("A4: …and so is a source file, which a hand-commit to the draft branch could carry",
  classifyFile("components/studio/PublishBar.tsx"), { group: "other", slug: null });

/* The body subdir is NOT the entry file. The overlay's regex has always drawn this line and the
 * preview now shares it, so a nested path must not be mistaken for the entry itself. */
t("A5: a path INSIDE an entry's directory is not the entry file",
  classifyFile("content/projects/boat-crest/body.mdoc").group, "other");
t("A5: …and the shared pattern is anchored at both ends, which is what makes that true",
  COLLECTION_FILE_RE.source.startsWith("^") && COLLECTION_FILE_RE.source.endsWith("$"), true);

/* ── PART B · changedLines ─────────────────────────────────────────────────────────────────── */

const PATCH = [
  "@@ -1,4 +1,4 @@",
  " title: A post",
  "-dek: the old words",
  "+dek: the new words",
  " status: published",
].join("\n");

t("B1: only the changed lines survive — the hunk header and both context lines are dropped",
  changedLines(PATCH),
  [{ sign: "-", text: "dek: the old words" }, { sign: "+", text: "dek: the new words" }]);

t("B2: the leading marker is stripped from the text, because the sign is carried structurally",
  changedLines("+hello").map((l) => l.text), ["hello"]);

/* ⚠ THE SUBTLE ONE. A file header begins with the same character as a real added line, so a naive
 * startsWith("+") reports a FILENAME where the author is looking for a sentence. GitHub's per-file
 * patch usually omits these, and "usually" is not a property to found a correctness claim on. */
t("B3: a `+++` file header is not mistaken for an added line",
  changedLines("+++ b/content/blog/post.yaml\n+real line"),
  [{ sign: "+", text: "real line" }]);
t("B3: …and a `---` header is not mistaken for a removed one",
  changedLines("--- a/content/blog/post.yaml\n-real line"),
  [{ sign: "-", text: "real line" }]);

t("B4: an empty added line survives as an empty string rather than vanishing",
  changedLines("+"), [{ sign: "+", text: "" }]);

t("B5: a patch with no changes at all yields nothing", changedLines("@@ -1 +1 @@\n context"), []);

/* ── PART C · buildPreview ─────────────────────────────────────────────────────────────────── */

/* THE REAL SPECIMEN. This is the actual unpublished draft that was sitting on the repo when this
 * was built — an empty stub post created by "add post" and never filled. It is the case the bar
 * could not tell from a finished post, and the reason the preview shows TEXT rather than a file
 * list: the file changing was never the surprise, what was inside it was. */
const STUB_PATCH = [
  "@@ -0,0 +1,6 @@",
  "+title: 5 Tips for Using AI for Designers",
  "+dek: ''",
  "+date: ''",
  "+status: draft",
  "+heroImage: null",
  "+blocks: []",
].join("\n");

{
  const r = buildPreview(
    [{ filename: "content/blog/5-tips-for-using-ai-for-designers.yaml", status: "added", patch: STUB_PATCH }],
    { "5-tips-for-using-ai-for-designers": "5 Tips for Using AI for Designers" },
    false,
  );
  t("C1: the stub resolves to its human title, not its filename",
    r.entries[0].title, "5 Tips for Using AI for Designers");
  t("C1: …named by kind and change in the author's words",
    [r.entries[0].kind, r.entries[0].change], ["Blog post", "new"]);
  t("C1: …with all six of its lines legible, which is the whole point of the feature",
    r.entries[0].lines.length, 6);
  t("C1: …including the empty dek that makes it a stub rather than a post",
    r.entries[0].lines[1].text, "dek: ''");
  t("C1: …and it is not marked unavailable, since its patch arrived",
    r.entries[0].unavailable, false);
}

/* ⚠ A DELETION HAS NO TITLE TO LOOK UP, because the draft overlay SUBTRACTS it from the studio's
 * read. The slug is the fallback. A stated limit rather than a hidden one. */
{
  const r = buildPreview(
    [{ filename: "content/blog/gone.yaml", status: "removed", patch: null }],
    {},
    false,
  );
  t("C2: a deleted entry falls back to its slug", r.entries[0].title, "gone");
  t("C2: …and reads as deleted", r.entries[0].change, "deleted");
  /* AND IT IS NOT "unavailable". A removal genuinely has nothing to show, which the change word
   * already says; calling it a withheld diff would invent a problem. */
  t("C2: …and a removal is NOT reported as a withheld diff", r.entries[0].unavailable, false);
}

/* ⚠ A WITHHELD PATCH MUST NOT RENDER AS "NO CHANGES". GitHub omits `patch` for very large files.
 * Showing nothing would read as nothing changed — the inversion this feature exists to prevent. */
{
  const r = buildPreview(
    [{ filename: "content/projects/fosfor-ai.yaml", status: "modified", patch: null }],
    { "fosfor-ai": "Fosfor AI" },
    false,
  );
  t("C3: a surviving file with no patch is flagged unavailable", r.entries[0].unavailable, true);
  t("C3: …and still appears, with its title and its change",
    [r.entries[0].title, r.entries[0].change], ["Fosfor AI", "edited"]);
}

/* ⚠ IMAGES ROLL UP, CONTENT DOES NOT — and `fileCount` counts FILES so the rollup can never read
 * as a smaller publish than it is. */
{
  const r = buildPreview(
    [
      { filename: "public/images/blog/a-post/one.webp", status: "added", patch: null },
      { filename: "public/images/blog/a-post/two.webp", status: "added", patch: null },
      { filename: "public/images/blog/a-post/three.webp", status: "added", patch: null },
      { filename: "content/blog/a-post.yaml", status: "modified", patch: "@@ -1 +1 @@\n+title: A post" },
    ],
    { "a-post": "A post" },
    false,
  );
  t("C4: three images under one slug are ONE entry", r.entries.filter((e) => e.group === "image").length, 1);
  t("C4: …counting three", r.entries.find((e) => e.group === "image").imageCount, 3);
  t("C4: …while the content file stays its own entry", r.entries.filter((e) => e.group === "blog").length, 1);
  t("C4: …and fileCount reports FILES, not entries, so the rollup cannot under-report",
    [r.fileCount, r.entries.length], [4, 2]);
}

t("C5: truncation passes through untouched — the dialog states it, and a silent cap is the one "
  + "failure a preview must never have",
  buildPreview([], {}, true).truncated, true);

t("C6: an empty compare is an empty preview, not an error",
  buildPreview([], {}, false), { entries: [], fileCount: 0, truncated: false });

/* ── PART D · the seams the leaf cannot see ────────────────────────────────────────────────── */

{
  const route = code("app/api/studio/publish-preview/route.ts");
  /* ⚠ MEASURED INSIDE THE HANDLER, NOT OVER THE WHOLE FILE — and this suite shipped the naive
   * version first. `route.indexOf("verifyOwnerSession")` and `route.indexOf("compareBranches")`
   * both find the IMPORT STATEMENTS, which sit in a fixed alphabetical-ish order at the top, so
   * the comparison was reading two `import` lines and would have passed with the gate ANYWHERE in
   * the body. Mutation testing is what found it: moving a real GitHub call above the gate left the
   * assertion green. Fourth instance of unanchored matching in this arc, and the most consequential
   * — this is the endpoint that hands back unpublished content. */
  const bodyAt = route.indexOf("export async function GET()");
  const body = bodyAt === -1 ? "" : route.slice(bodyAt);
  t("D1: the handler was found, so nothing below is reading the import block", body.length > 0, true);
  const gate = body.indexOf("verifyOwnerSession(");
  const github = body.indexOf("compareBranches(");
  t("D1: the preview route verifies the owner", gate > -1, true);
  t("D1: …and it calls GitHub", github > -1, true);
  /* ⚠ ORDER, NOT PRESENCE. An owner gate that runs after the fetch has already leaked the read it
   * exists to prevent. This endpoint hands back UNPUBLISHED content, so the order is the control. */
  t("D1: …and the gate runs BEFORE the GitHub call, which is the property that matters",
    gate < github, true);
  /* And the rejection must be the next thing that happens, not a flag consulted later. */
  t("D1: …returning 401 before anything else runs",
    /if \(!session\) \{\s*return NextResponse\.json\(\s*\{ ok: false, error: "unauthorized" \}[\s\S]{0,40}401 \}\s*\);/.test(body), true);
  t("D1: …and it is a GET, so nothing here can merge, commit or move a branch",
    /export async function GET\(\)/.test(route) && !/export async function POST/.test(route), true);
}

{
  const gh = code("lib/studio/github-commit.ts");
  /* ⚠ THE HOT PATH MUST NOT SILENTLY GAIN WEIGHT. `compareBranches` backs the draft-state read that
   * runs unstable_cache'd on EVERY studio page, and a case study's full-file patch is ~24KB. The
   * patches are opt-in so only the preview pays. */
  t("D2: patches are an opt-in parameter", /opts: \{ withPatches\?: boolean \} = \{\}/.test(gh), true);
  t("D2: …and the map only carries a patch when asked", /opts\.withPatches \?/.test(gh), true);
  const draft = code("lib/studio/draft-site-settings.ts");
  t("D2: …so the draft-state read, the hot caller, does NOT ask for them",
    /compareBranches\(BASE_BRANCH, DRAFT_BRANCH\)/.test(draft), true);
  t("D2: …while the preview route does",
    /withPatches: true/.test(code("app/api/studio/publish-preview/route.ts")), true);
}

{
  /* ONE HOME FOR THE FILENAME PATTERN. The overlay used to declare its own copy, and two patterns
   * over one filename shape drift the moment a fourth collection lands. */
  const draft = code("lib/studio/draft-site-settings.ts");
  t("D3: the overlay imports the shared pattern rather than declaring its own",
    /import \{ COLLECTION_FILE_RE, SKILLS_FILE \} from "\.\/publish-preview"/.test(draft), true);
  t("D3: …and no second declaration survives in it",
    /const COLLECTION_FILE_RE =/.test(draft), false);
}

{
  const modal = code("components/studio/StudioModal.tsx");
  /* THE THREE EXISTING CONFIRMS MUST NOT MOVE. `narrow` is byte-for-byte what shipped. */
  t("D4: the modal's default width is still the 440 the three confirms render at",
    /width = "narrow"/.test(modal) && /max-w-\[440px\]/.test(modal), true);
  t("D4: …and the preview's wider variant is written out WHOLE, not built at runtime",
    /max-w-\[640px\]/.test(modal), true);
  /* Tailwind reads source as plain text, so an assembled class emits no rule and fails silently. */
  t("D4: …with no interpolated width class, which would generate no CSS at all",
    /max-w-\[\$\{/.test(modal), false);
}

{
  const bar = code("components/studio/PublishBar.tsx");
  /* ⚠ THE BUTTON OPENS THE PREVIEW. If this ever points back at `publish`, the confirm is gone and
   * hazard 13 is open again with the dialog still sitting in the tree looking like an answer. */
  t("D5: the Publish button opens the preview rather than merging",
    /onClick=\{openPreview\}/.test(bar), true);
  t("D5: …and no control still calls the merge directly from the bar",
    /onClick=\{publish\}/.test(bar), false);
  t("D5: …the dialog's primary action is the merge", /onPublish=\{publish\}/.test(bar), true);
  /* ONE GATE, NOT TWO. The dialog cannot open on a state the merge would refuse. */
  t("D5: …and opening is gated on the same canPublish the merge is",
    /async function openPreview\(\) \{\s*if \(!canPublish \|\| publishingRef\.current\) return;/.test(bar), true);
  t("D5: …and every terminal publish path closes it, `finally` covering the early returns",
    /finally \{[\s\S]*?setPreviewOpen\(false\);[\s\S]*?\}/.test(bar), true);
}

{
  /* ⚠ THE MODAL OUTRANKS THE FLOATING BAR, WHICH IT DID NOT BEFORE. Both held z-50 — the value
   * globals.css names `--z-modal` — so a modal and an action pill claimed ONE layer and DOM order
   * decided it. The layout renders `{children}` before `<PublishBar />`, so the pill won against
   * every modal in the studio. MEASURED: the pill was what `elementFromPoint` returned at the
   * preview dialog's own Publish button centre, so its primary action was unclickable.
   * The three existing confirms never reached the pill's band, so this was latent until a modal
   * grew tall enough — which is why the fix is pinned here rather than left to be rediscovered. */
  const bar = code("components/studio/PublishBar.tsx");
  const modal = code("components/studio/StudioModal.tsx");
  t("D8: the pill sits at the overlay layer",
    /pointer-events-none fixed[^"]*\bz-40\b/.test(bar), true);
  t("D8: …and no longer at the modal layer it was sharing",
    /pointer-events-none fixed[^"]*\bz-50\b/.test(bar), false);
  t("D8: …while the modal scrim keeps the modal layer, so a dialog always wins",
    /fixed inset-0 z-50 grid place-items-center/.test(modal), true);
}

{
  const dlg = code("components/studio/PublishPreviewDialog.tsx");
  /* ⚠ FAILS OPEN. A read error must never make the site unpublishable — that trades a rare bad
   * publish for a total outage of the owner's only write path. So Publish is disabled ONLY when
   * there is genuinely nothing to publish, never because the preview failed to load. */
  t("D6: publish is disabled only while publishing or when nothing would change",
    /disabled=\{publishing \|\| nothing\}/.test(dlg), true);
  t("D6: …and `nothing` requires a READY preview, so an unavailable one leaves it enabled",
    /const nothing = ready !== null && ready\.fileCount === 0;/.test(dlg), true);
  /* Cancel takes initial focus — the same safe default the discard confirm uses. */
  t("D7: cancel takes initial focus, so the keyboard never lands on the live-site action",
    /initialFocusRef=\{cancelRef\}/.test(dlg), true);
  /* ⚠ COLOUR IS NOT THE ONLY CARRIER. The sign is a glyph too. */
  t("D7: the sign renders as a glyph, not as colour alone",
    /\{added \? "\+" : "−"\}/.test(dlg), true);
  t("D7: …with an accessible name behind it, since the glyphs announce inconsistently",
    /\{added \? "added" : "removed"\}/.test(dlg), true);
  /* The studio's hairline is /12, and /8 is the public-site value — a leftover /8 here is a
   * hairline that did not move with its neighbours. `studio-ink` E3 governs this globally; this is
   * the local restatement for a new file. */
  t("D7: hairlines are the studio's /12, never the canvas's /8",
    /border-studio-ink-950\/8\b/.test(dlg), false);
}

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
