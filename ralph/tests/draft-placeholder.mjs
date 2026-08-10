// The draft placeholder rule, ACROSS BOTH COLLECTIONS.
//
// ⚠ NAMED FOR THE RULE RATHER THAN FOR A COLLECTION, because the defect it exists to stop was a rule
// that held in one place and not the other. A placeholder blocked a blog post and nothing at all
// stopped one reaching a case study, and that asymmetry is invisible from inside either validator.
//
// ⚠ THE BLOG HALF STAYS IN `blog-registry` SECTION M. Moving it here would be churn, and section M
// carries the history of how the sentinel failed, which belongs beside the blog rules it grew from.
// What lives here is the PROJECTS half plus the one claim neither suite could make alone: that the
// two collections share a single definition rather than two spellings of one idea.
//
// ⚠ AND THE PROJECTS VALIDATOR CANNOT BE EXECUTED HERE, which is a stated limit rather than a gap.
// `validate-draft-sections.ts` imports `adaptSections` as a VALUE, and node needs a `.ts` extension
// for that where tsc forbids one — `p4-4bii-block-forms` records the same constraint. So its rows
// are SOURCE-INSPECTION and they say so in their own titles. The corpus row below is the executable
// one, and it is the kind that would actually have caught the blog incident.
import { readFileSync, readdirSync } from "node:fs";
import { hasPlaceholder, DRAFT_MARKER, DRAFT_PHRASES } from "../../lib/studio/validate-blog-post.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const decomment = (b) => b.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const projSrc = decomment(read("lib/studio/validate-draft-sections.ts"));

console.log("A · the rule reaches the projects collection at all");
/* ⚠ THE SEAM THIS SUITE WAS WRITTEN FOR. The projects validator knew nothing about placeholders —
   not at publish, not anywhere — while the blog's rule had existed for arcs. And a case study is
   STRICTLY MORE EXPOSED than a post: the projects collection declares no `status` field, so there
   is no draft state and a placeholder is public the moment it is on main. The collection with no
   safety net was the one with no gate. */
t("A1 the subject is real and non-trivial, against a literal", projSrc.length > 900, true);
t("A2 ⚠ THE PROJECTS VALIDATOR REFUSES A PLACEHOLDER — the seam, source-inspected",
  /hasPlaceholder\(raw\)/.test(projSrc), true);
t("A3 ⚠ …AND IT READS THE RAW DOCUMENT, not a walk over sections — a placeholder in `summary` or `facts` is not in a block",
  /hasPlaceholder\(raw\)/.test(projSrc) && !/hasPlaceholder\(doc/.test(projSrc), true);

/* ⚠ ORDER IS THE ASSERTION, NOT A DETAIL. The sections guard returns ok for any project with no
   `sections` array, so a check placed after it is skipped for exactly the documents nobody looks
   at. Computed by index rather than eyeballed, because "before" is the whole property. */
const atCheck = projSrc.indexOf("hasPlaceholder(raw)");
const atGuard = projSrc.indexOf("Array.isArray(doc.sections)");
t("A3a both landmarks were found, or A4 compares two -1s and passes trivially",
  atCheck >= 0 && atGuard >= 0, true);
t("A4 ⚠ AND IT RUNS BEFORE THE SECTIONS GUARD, which exempts any project without a sections array",
  atCheck < atGuard, true);

console.log("\nB · one definition, not two spellings");
/* ⚠ THE CLAIM NEITHER VALIDATOR COULD MAKE ALONE. Two collections each carrying their own idea of
   what a placeholder is would drift, and the drift would be found the way the first one was: by
   reading the live site. The projects side must IMPORT the rule rather than restate it. */
t("B1 the projects validator imports the shared rule rather than declaring its own",
  /import \{ hasPlaceholder \} from "\.\/validate-blog-post"/.test(projSrc), true);
t("B2 ⚠ …AND SPELLS NEITHER HALF ITSELF — no second sentinel, no second phrase list",
  [/DRAFT_MARKER\s*=/.test(projSrc), /DRAFT_PHRASES\s*=/.test(projSrc)], [false, false]);

console.log("\nC · the corpus — the executable half, and the kind that would have caught it");
/* ⚠ EVERY FIXTURE ROW IN THIS REPO PASSED WHILE A PLACEHOLDER WAS SERVED FROM THE LIVE SITE, because
   a validator only runs at publish and a document already on main is never re-asked. This walks what
   is actually committed. Derived from the directory so a fifth case study cannot join unexamined. */
const dir = new URL("../../content/projects/", import.meta.url);
const docs = readdirSync(dir).filter((f) => f.endsWith(".yaml"))
  .map((f) => [f, readFileSync(new URL(f, dir), "utf8")]);
t("C1 the corpus walk found case studies, against a LITERAL rather than against itself",
  docs.length >= 4, true);
t("C2 ⚠ NO CASE STUDY CARRIES A PLACEHOLDER BY EITHER HALF — and every one of them is public, always",
  docs.filter(([, raw]) => hasPlaceholder(raw)).map(([f]) => f), []);
/* ⚠ THE INSTRUMENT PROVES ITSELF ON THE CORPUS IT JUST CLEARED. A walk that cannot detect anything
   returns the same empty list as a clean corpus — the empty-subject shape, arriving as an inert
   predicate rather than an absent subject. So a real document is damaged in memory and re-asked. */
t("C2a …and the predicate can actually fire on a real document, or C2's empty list means nothing",
  hasPlaceholder(docs[0][1] + "\nsummary: " + DRAFT_MARKER + " 1 OF 3"), true);
t("C2b …by the English half too, which is the half a damaged sentinel leaves behind",
  hasPlaceholder(docs[0][1] + "\nsummary: " + DRAFT_PHRASES[0]), true);

console.log(`\ndraft-placeholder result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
