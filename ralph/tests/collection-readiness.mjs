// THE STRUCTURAL HALF OF COLLECTION READINESS — members and verdicts, never a count.
// Run: node ralph/tests/collection-readiness.mjs
//
// ---- ⚠ WHY THIS EXISTS -----------------------------------------------------------------------
//
// "I audited the hand-keyed lists" is a CLAIM. "Here are the eleven, ten guarded, one not" is a
// MEASUREMENT. Six defects in one collection were each two correct parts that never met, and every
// one was found by a person at a browser after the collection had been called done.
//
// ---- ⚠ IT EXTENDS RATHER THAN DUPLICATES, AND THAT IS LOAD-BEARING ---------------------------
//
// Three of the five categories already have owners. This suite NAMES them and asserts their subject
// is DERIVED rather than enumerated; it re-walks nothing.
//
//     casts onto collection-keyed types   unchecked-joins
//     dispatch tables and the publish loop collection-dispatch  A, E
//     write routes and invalidation        draft-signal         A
//
// A second copy of `unchecked-joins` would be the parallel-list defect arriving inside the tool
// built to detect it — so the walks below cover ONLY the two categories nobody owns.
//
// ---- ⚠ THE DENOMINATOR AND THE EXCLUSIONS ARE PART OF THE OUTPUT ------------------------------
//
// Two censuses in one session were blind to the very table carrying the defect: one used a matcher
// that could not span `=>`, so it missed every `Record` of functions; one walked `lib/` while the
// list lived in a component. A census with a broken subject is worse than none, because its number
// outlives the session that produced it. So this prints what it walked and what it did not, BY
// NAME, and section A fails if either is empty.
//
// ---- ⚠ AND `ABSENT` IS NOT `GUARDED` -----------------------------------------------------------
//
// Three collections have no schema-key list at all, so there is no second list to compare and the
// honest verdict is ABSENT. Reporting that as "no unguarded lists found" would be a pass on a
// comparison that does not exist — the check-the-denominator defect inside the emitter itself.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blankCommentBodies } from "../strip-comments.mjs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => blankCommentBodies(readFileSync(join(root, p), "utf8"));

/* ⚠ THE COLLECTION SET IS PARSED FROM THE AUTHORITATIVE UNION, NOT LISTED. A fifth collection joins
 * every section below without anyone editing this file — which is the difference between a census
 * and a checklist, and the thing four of this repo's gates were rebuilt to get. */
const COMMIT = read("lib/studio/commit-collection-entry.ts");
const unionText = (COMMIT.match(/export type CollectionName =([^;]+);/) ?? ["", ""])[1];
const COLLECTIONS = [...unionText.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]);

/* ⚠ THE WALK, DECLARED. Everything this census can see. */
const WALKED = ["lib/", "components/studio/", "app/api/studio/", "app/studio/", "keystatic.config.ts"];
/* ⚠ AND WHAT IT CANNOT, BY NAME AND WITH A REASON — not a hedge, a boundary. */
const NOT_WALKED = [
  "components/gallery|blog|case-study — PUBLIC renderers. They read a collection and never key a write path, which is what this census is about.",
  "ralph/ — the gates themselves. A suite naming four collections is a suite, not a hand-keyed production list.",
  "content/ — data, not code. A malformed entry is validate-*'s subject.",
  "node_modules, .next — not authored here.",
];

const files = [];
(function walk(rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return;
  for (const e of readdirSync(abs, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const c = `${rel}/${e.name}`;
    if (e.isDirectory()) walk(c);
    else if (/\.(ts|tsx)$/.test(c)) files.push(c);
  }
})("lib");
for (const d of ["components/studio", "app/api/studio", "app/studio"]) {
  (function walk(rel) {
    const abs = join(root, rel);
    if (!existsSync(abs)) return;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const c = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(c);
      else if (/\.(ts|tsx)$/.test(c)) files.push(c);
    }
  })(d);
}
files.push("keystatic.config.ts");

console.log("\nA · the census states its own subject, because two this session did not");
console.log("      walked      : " + WALKED.join("  "));
for (const x of NOT_WALKED) console.log("      not walked  : " + x);
console.log(`      collections : ${COLLECTIONS.join(", ")}   ·   ${files.length} files`);
t("A1 the collection set was DERIVED from the union, not listed here", COLLECTIONS.length >= 4, true);
t("A2 …and the walk found files, so every verdict below has a subject", files.length > 60, true);
t("A3 …and the exclusions are declared with reasons rather than left implicit",
  [NOT_WALKED.length > 0, NOT_WALKED.every((x) => x.includes("—"))], [true, true]);

// ---------------------------------------------------------------------------------------------
console.log("\nB · the categories that already have owners — named, not re-walked");
/* ⚠ EACH OWNER MUST DERIVE ITS SUBJECT. A suite that enumerates is correct on the day it is written
 * and decays from then on, so naming an owner is only worth anything if the owner cannot fall
 * behind its own population. */
const OWNED = [
  ["casts onto collection-keyed types", "unchecked-joins", /walk\(/],
  ["dispatch tables + publish loop", "collection-dispatch", /Record<CollectionName/],
  ["write routes invalidate", "draft-signal", /readdirSync/],
];
for (const [what, suite] of OWNED) console.log(`      ${what.padEnd(36)} ${suite}`);
t("B1 every named owner exists",
  OWNED.filter(([, s]) => !existsSync(join(root, `ralph/tests/${s}.mjs`))).map(([, s]) => s), []);
t("B2 …and each derives its subject rather than enumerating it",
  OWNED.filter(([, s, re]) => !re.test(read(`ralph/tests/${s}.mjs`))).map(([, s]) => s), []);

// ---------------------------------------------------------------------------------------------
console.log("\nC · parallel key sets — per collection, with ABSENT distinct from UNGUARDED");
/* The schema is the source: `keystatic.config.ts` enumerates cleanly in declaration order. */
const CONFIG = readFileSync(join(root, "keystatic.config.ts"), "utf8");
const schemaKeysOf = (name) => {
  const at = CONFIG.indexOf(`  ${name}: collection({`);
  if (at < 0) return null;
  const sAt = CONFIG.indexOf("schema: {", at);
  if (sAt < 0) return null;
  let d = 0, end = -1;
  for (let i = CONFIG.indexOf("{", sAt); i < CONFIG.length; i++) {
    if (CONFIG[i] === "{") d++;
    else if (CONFIG[i] === "}") { d--; if (d === 0) { end = i; break; } }
  }
  const keys = [];
  let depth = 0;
  for (const L of CONFIG.slice(sAt, end).split("\n")) {
    const m = L.match(/^\s{8}([a-zA-Z][a-zA-Z0-9_]*):/);
    if (m && depth <= 1) keys.push(m[1]);
    depth += (L.match(/\{/g) ?? []).length - (L.match(/\}/g) ?? []).length;
  }
  return keys;
};
/* ⚠ THIS FILE IS EXCLUDED FROM ITS OWN EVIDENCE, AND IT IS EXCLUDED BECAUSE IT FAILED WITHOUT THE
 * EXCLUSION. The comment above naming `BLOG_HEAD_KEYS` — written one edit before this line — made
 * blog report COMPARED, because the census read its own prose as a suite naming the constant. That
 * is the recorded `indexOf` instance verbatim: a matcher finding a construct inside a comment
 * written about it one turn earlier.
 *
 * COMMENTS ARE BLANKED TOO, so a suite that merely DISCUSSES a constant does not count as comparing
 * it. Both halves are needed: the self-exclusion covers this file, the blanking covers the rest. */
const SELF = "collection-readiness.mjs";
const suiteFiles = readdirSync(join(root, "ralph/tests")).filter((f) => f.endsWith(".mjs") && f !== SELF);
const suiteSrc = new Map(suiteFiles.map((f) => [f, blankCommentBodies(readFileSync(join(root, "ralph/tests", f), "utf8"))]));

/* ⚠ THE LIST IS FOUND BY ROLE, NEVER BY NAME — AND THE FIRST VERSION OF THIS SECTION WAS NAME-BLIND
 * AND REPORTED A FALSE `ABSENT`. It matched `<COLLECTION>_SCHEMA_KEYS`, which is what gallery's is
 * called, and blog's is `BLOG_HEAD_KEYS` in `blog-serialize.ts` — six of the schema's seven keys,
 * nothing comparing them, reported as "no second list exists".
 *
 * ⚠ AND THE NAME-THEN-FORM PROGRESSION IS THIS REPOSITORY'S OWN RECORDED HISTORY. The colour census
 * began matching by NAME and missed everything spelled differently; the repair was to match by FORM.
 * That entry is four hundred lines from this file and was read before this one was written.
 *
 * SO: every `as const` array of string literals in a collection's own leaves, whose members are ALL
 * top-level schema keys. That admits a list under any name and excludes the sub-object lists —
 * `PROJECT_FACTS_KEYS` is `role, type, platform, timeline`, which live UNDER `facts` and are not
 * top-level keys, so it is not a parallel copy of the schema and does not belong here. */
const LEAF_RE = (c) => new RegExp(`^lib/studio/${c}-(format|serialize)\\.ts$`);
const MIN_MEMBERS = 3; /* two strings is a pair, not a transcription of a schema. */
const bounds = [];
const keyRows = [];
for (const c of COLLECTIONS) {
  const schema = schemaKeysOf(c);
  const leaves = files.filter((f) => LEAF_RE(c).test(f));
  const lists = [];
  for (const f of leaves) {
    const src = read(f);
    for (const m of src.matchAll(/(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*=\s*\[([^\]]*)\]\s*as const/g)) {
      const members = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      if (members.length < MIN_MEMBERS) continue;
      if (!schema || !members.every((k) => schema.includes(k))) continue;
      /* ⚠ AND THE VERDICT TURNS ON WHAT THE LOOP DOES WITH AN UNLISTED KEY, NOT ON THE LIST EXISTING.
         Two lists of schema keys can be structurally identical and have opposite consequences:

           ORDERING   `for (const k of LIST) …` then `for (const k of Object.keys(obj)) if (!(k in …))`
                      — an unlisted key SURVIVES, at the end. `EXPERIENCE_FIELD_ORDER` is this.
           FILTERING  the same first loop with NO fallthrough — an unlisted key is DROPPED ON SAVE
                      silently. `BLOG_HEAD_KEYS` is this, and it is gallery's exact mechanism.

         Reporting both as UNGUARDED would be the wrong-noun error: one is a defect waiting for the
         next schema field, the other is a stable sort. The fallthrough is what tells them apart. */
      /* ⚠ BOUNDED BY THE ENCLOSING FUNCTION, NOT BY A CHARACTER COUNT — AND THE CHARACTER COUNT
         IS WHY. The first version sliced 900 characters after the list's use site. Writing the
         COMMENT that explains blog's fallthrough pushed the fallthrough to 921, so the mechanism
         landed outside the window that looks for it and C2 stayed red on code that was fixed.

         The explanation displacing its own subject is a new variant of explaining-it-requires-
         writing-it: the earlier instances were prose that BECAME the thing being matched, and this
         is prose that MOVED it out of reach. A fixed window is a guess about how far apart two
         statements sit, and a comment is exactly what changes that distance.

         The end anchor is a `}` in column zero — the close of a top-level function — and C4 asserts
         the slice is genuinely bounded, because an end anchor that misses runs to end-of-file and
         then every list looks like an ordering list. */
      /* ⚠ ANCHORED ON THE USE, NOT ON A LOOP SHAPE. `of ${name}` assumed every list is consumed by
         a for-of; `GALLERY_SCHEMA_KEYS` is consumed by `.includes(k)` inside a validator, so the
         anchor missed entirely, the slice was empty, and the detector reported a verdict having
         looked at nothing. C4 caught that on its first run — a matcher narrower than its concept,
         found by the row written to catch matchers narrower than their concept. */
      const uses = [...src.matchAll(new RegExp(`\\b${m[1]}\\b`, "g"))].map((u) => u.index);
      const at = uses.length > 1 ? uses[1] : -1;
      const tail = at < 0 ? "" : src.slice(at);
      const close = tail.search(/\n\}/);
      const after = close < 0 ? tail : tail.slice(0, close);
      const ordering = /for\s*\(const\s+\w+\s+of\s+Object\.keys\(/.test(after);
      bounds.push({ name: m[1], file: f, span: after.length, bounded: close >= 0 });
      lists.push({ name: m[1], file: f, n: members.length, ordering });
    }
  }
  /* A pair is COMPARED when a suite names the constant AND reads the schema — both directions, which
     is what `collection-dispatch` section G does for gallery. */
  /* ⚠ ONE SUITE, THIS COLLECTION. The first predicate asked whether SOME suite named the constant
     and whether SOME suite read A schema — two conditions joined by nothing, so gallery's suite
     reading gallery's schema satisfied the second half for every collection. A join that does not
     tie its two sides to the same subject is the defect this whole census is about. */
  const compared = lists.length > 0 && lists.every((l) =>
    [...suiteSrc.values()].some((txt) => txt.includes(l.name) && new RegExp(`collections\\.${c}\\.schema`).test(txt)));
  keyRows.push({
    collection: c,
    schemaKeys: schema ? schema.length : "NO SCHEMA FOUND",
    lists,
    verdict: !schema ? "SCHEMA UNREADABLE"
      : lists.length === 0 ? "ABSENT — no second list exists to compare"
      : compared ? "COMPARED (both directions)"
      : lists.every((l) => l.ordering)
        ? `ORDERING ONLY — ${lists.map((l) => l.name).join(", ")}; an unlisted key survives at the end`
        : `UNGUARDED — ${lists.filter((l) => !l.ordering).map((l) => `${l.name} (${l.n}) in ${l.file}`).join(", ")} FILTERS, so a new schema key is dropped on save`,
  });
}
for (const r of keyRows) console.log(`      ${r.collection.padEnd(11)} schema keys ${String(r.schemaKeys).padEnd(4)} ${r.verdict}`);
t("C1 every collection's schema was readable — an unreadable one is a broken subject, not a pass",
  keyRows.filter((r) => r.verdict === "SCHEMA UNREADABLE").map((r) => r.collection), []);
/* ⚠ THE ROW THAT MATTERS. `UNGUARDED` means two lists exist and nothing compares them — a key
 * dropped on save, or a red build, depending which way they drift. `ABSENT` is a different state
 * and is reported rather than failed; see the note below. */
t("C2 ⚠ NO COLLECTION HAS TWO KEY LISTS THAT NOTHING COMPARES",
  keyRows.filter((r) => r.verdict.startsWith("UNGUARDED")).map((r) => r.collection), []);
/* ⚠ AND `ABSENT` IS SURFACED AS A QUESTION RATHER THAN A PASS. Gallery has a key list because it
 * BROKE — four project-shaped files reached main and took the production build down. The other
 * collections have never been compared to their schemas, and whether they should be is a decision
 * nobody has taken. This row asserts the population is REPORTED, not that it is empty. */
const absent = keyRows.filter((r) => r.verdict.startsWith("ABSENT")).map((r) => r.collection);
if (absent.length) {
  console.log(`\n      ⚠ ${absent.length} collection(s) have NO schema-key list: ${absent.join(", ")}`);
  console.log("        Gallery has one because it BROKE. These have never been compared to their");
  console.log("        schemas, and whether they need one is a DECISION NOBODY HAS TAKEN — not a");
  console.log("        pass. It is reported here rather than failed, because inventing three key");
  console.log("        lists to satisfy a gate is the fixed-list shape this repo deletes on sight.");
}
/* ⚠ THE DETECTOR'S OWN SLICE IS ASSERTED, because an unbounded one makes every list read as an
 * ordering list and C2 would go green by looking at the whole file. */
t("C4 every ordering/filtering slice is BOUNDED by its function close, not running to end-of-file",
  bounds.filter((b) => !b.bounded || b.span > 6000).map((b) => `${b.name}:${b.span}`), []);
t("C3 …and the absent set is reported by name rather than summarised",
  absent.every((c) => COLLECTIONS.includes(c)), true);

// ---------------------------------------------------------------------------------------------
console.log("\nD · per-collection tables — a DECLARED inventory, because the guard often lives elsewhere");
/* ⚠ THIS CATEGORY IS NOT SOUNDLY CHECKABLE BY A REGEX, AND THE FIRST VERSION OF THIS SECTION PROVED
 * IT BY REPORTING SIX DEFECTS OF WHICH ZERO WERE DEFECTS.
 *
 * It flagged any literal keyed by every collection whose own window lacked `Record<CollectionName`.
 * Every hit was guarded — by the enclosing function's RETURN type, by the literal's own declared
 * type, by a DIFFERENT mapped type (`Record<PreviewGroup, …>`), or by the CALLEE'S PARAMETER in
 * another file. A regex cannot follow any of those, and `tsc` already enforces all of them.
 *
 * ⚠ THIRD CENSUS IN ONE SESSION WITH A VOCABULARY NARROWER THAN ITS CONCEPT, and this one was
 * written by someone who put that exact requirement in this file's header before running it.
 * Knowing does not prevent.
 *
 * ⚠ AND TWO OF THE SIX ARE NOT COLLECTION TABLES AT ALL: they key the four collections PLUS
 * `skills`, which is a singleton. A table over a DIFFERENT key set is not an unguarded table over
 * this one — the wrong-noun error, arriving in a census subject.
 *
 * SO IT IS AN INVENTORY WITH EACH GUARD NAMED, the shape `unchecked-joins` uses for the same reason:
 * a NEW table fails here and the way to make it pass is to write down where its guard is. That
 * converts an unanswerable question into a decision somebody records. */
const TABLES = {
  "lib/studio/data.ts": "the literal is the return value of `getStudioData`, whose return type is `StudioData` — a named type `tsc` enforces. Adding a collection without extending that type fails to compile.",
  "lib/studio/draft-site-settings.ts": "the literal IS a `DraftBranchState`, and every field is required by that type. A fifth collection missing from it is a compile error — proved this session when `draftGone` was added and tsc named both literals that lacked it.",
  "lib/studio/publish-preview.ts": "`KIND` is a `Record<PreviewGroup, string>` — a different mapped type, and the right one: `PreviewGroup` derives its collection half from `CollectionName` and adds `skills`, `settings`, `image`, `other`.",
  "app/api/studio/publish-preview/route.ts": "the literal is the argument to `buildTitleIndex`, whose parameter is `Record<CollectionName, …>`. MEASURED: removing gallery fails tsc with TS2741 naming the missing key.",
  "app/studio/(dashboard)/layout.tsx": "two literals. The `collections` object is an argument to `buildStudioSearchIndex`, parameter-typed `Record<CollectionName, …>` (TS2741 verified). The `initial` counts object is keyed by four collections PLUS `skills` — a different key set, and `skills` is a singleton rather than a collection.",
  "components/studio/StudioCountsProvider.tsx": "`Counts` keys the four collections PLUS `skills`. Not a CollectionName table: skills is a singleton with no per-entry routes, so a fifth COLLECTION does not belong in it automatically.",
};
const candidates = [];
for (const f of files) {
  const src = read(f);
  for (const m of src.matchAll(new RegExp(`\\b${COLLECTIONS[0]}:`, "g"))) {
    const win = src.slice(Math.max(0, m.index - 400), m.index + 900);
    if (!COLLECTIONS.every((c) => new RegExp(`\\b${c}:`).test(win))) continue;
    if (/Record<\s*CollectionName/.test(win)) continue;
    candidates.push(f);
  }
}
const found = [...new Set(candidates)].sort();
for (const f of found) console.log(`      ${(f in TABLES ? "declared " : "UNDECLARED")}  ${f}`);
t("D1 the matcher finds tables at all, so D2 and D3 are not passing over nothing", found.length > 0, true);
/* ⚠ THE ROW THAT MATTERS: a NEW per-collection table names its guard or fails here. */
t("D2 ⚠ EVERY PER-COLLECTION TABLE IS DECLARED WITH ITS GUARD NAMED — a new one is a decision somebody writes down",
  found.filter((f) => !(f in TABLES)), []);
/* ⚠ AND THE INVENTORY MUST NOT OUTLIVE ITS SUBJECT — a declared file that no longer carries one is a
 * row matching nothing, which this repo deletes on sight. */
t("D3 …and no declared entry has stopped carrying a table, or the inventory is stale",
  Object.keys(TABLES).filter((f) => !found.includes(f)), []);

console.log(`\ncollection-readiness result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
