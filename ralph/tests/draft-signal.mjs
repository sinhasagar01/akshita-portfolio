// THE TWO HALVES OF "THE DRAFT BRANCH CHANGED AND SOMETHING SAID SO".
// Run: node ralph/tests/draft-signal.mjs
//
// ---- ⚠ WHY THIS EXISTS: SIX DEFECTS, AND THE SIXTH WAS A COMMENT -----------------------------
//
// A create wrote two commits to the draft branch and the publish pill stayed grey. Nothing was
// lost — `git log` on the branch settled that first, and it is the only thing that could — but the
// author was told the site was published while it was not.
//
// THE CLIENT CALL WAS MISSING AND A COMMENT WAS THE REASON. It claimed a create "navigates straight
// to the new entry, so the bar is re-rendered from fresh server data", which is false in every
// clause: `PublishProvider` seeds `useState(initialDiffers)` once at mount, and `initialDiffers`
// comes from the (dashboard) LAYOUT, which does not re-render on a client navigation inside its own
// segment. The comment was written as the REASON NOT TO ADD THE CALL, so two collections shipped
// without it.
//
// ---- ⚠ AND ONE HALF OF THE REPORTED CAUSE WAS FALSE, WHICH IS WHY BOTH HALVES ARE ASSERTED -----
//
// The diagnosis also claimed `create-entry` never invalidates the cached draft state, so a hard
// refresh would keep under-reporting for 45 seconds. IT DOES INVALIDATE, on the success path. The
// grep behind that claim searched `revalidateTag|revalidatePath|DRAFT_STATE_TAG` — the
// IMPLEMENTATION vocabulary — while the route calls the exported wrapper. A matcher narrower than
// its concept, committed while diagnosing the defect a comment had caused.
//
// So section A pins the server half that was already correct, precisely because it was reported
// broken and nothing was watching it either way.
//
// ---- WHAT IS DERIVED, AND WHY THAT IS THE WHOLE POINT ----------------------------------------
//
// Neither subject is a list. Section A walks `app/api/studio` and derives the mutating routes from
// the HTTP methods they export; section B walks `components/studio` and derives the writing indexes
// from the write routes they POST to. A fifth collection, or a sixth write route, joins both
// subjects without anyone editing this file — which is the difference between a census and a
// checklist this repository has spent an arc on.
import { readdirSync, readFileSync, existsSync } from "node:fs";
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

/* ⚠ COMMENTS BLANKED. This suite's own subject is a comment that lied, and both files it reads
 * quote that comment verbatim so a later reader meets it. An unblanked scan would match the quoted
 * false claim as though it were code — explaining-it-requires-writing-it, which this repository has
 * recorded six times. */

// ---------------------------------------------------------------------------------------------
console.log("\nA · every route that can change the draft branch invalidates the cached state");

const API = "app/api/studio";
const routes = readdirSync(join(root, API), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(root, API, e.name, "route.ts")))
  .map((e) => e.name)
  .sort();

/* ⚠ THE SUBJECT IS DERIVED FROM THE HTTP METHOD, NOT FROM A NAME LIST. A route exporting POST, PUT,
 * PATCH or DELETE is one that can mutate; a GET cannot. So a new write route is in this subject the
 * moment it exists. */
const MUTATING = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/;
const classified = routes.map((name) => {
  const src = read(`${API}/${name}/route.ts`);
  return { name, mutates: MUTATING.test(src), invalidates: /invalidateDraftStateCache\s*\(/.test(src) };
});

/* ⚠ THE TWO SESSION ROUTES ARE THE ONLY EXEMPTIONS AND THEY ARE A PROPERTY, NOT A LIST: they set or
 * clear the owner cookie and touch no content at all. Anything else that mutates touches the draft
 * branch by construction, because the draft branch is the only place /studio writes. */
const SESSION_ONLY = new Set(["login", "logout"]);

t("A1 the walk found routes — a zero subject is not a pass", routes.length > 10, true);
t("A2 …and both classes have members, so A3 and A4 cannot pass by finding nothing",
  [classified.some((r) => r.mutates), classified.some((r) => !r.mutates)], [true, true]);
/* ⚠ THE ROW THE FALSE DIAGNOSIS NEEDED. Reported broken, measured correct — and nothing was
 * asserting it in either direction, so the claim could not be settled by any gate. */
t("A3 ⚠ EVERY MUTATING ROUTE INVALIDATES THE DRAFT STATE — a stale `differs` is the server disagreeing with the branch",
  classified.filter((r) => r.mutates && !r.invalidates && !SESSION_ONLY.has(r.name)).map((r) => r.name), []);
/* ⚠ AND THE COMPLEMENT, because a conditional assertion's filter is where a value and its
 * documentation come apart. A GET that invalidates is either a mislabelled write or a wasted
 * revalidation, and both are worth a red row. */
t("A4 …and no read-only route invalidates, or it is a mislabelled write",
  classified.filter((r) => !r.mutates && r.invalidates).map((r) => r.name), []);
t("A5 …and the session routes are the only mutating exemptions, stated as a property",
  classified.filter((r) => r.mutates && !r.invalidates).map((r) => r.name).sort(), ["login", "logout"]);

// ---------------------------------------------------------------------------------------------
console.log("\nB · every index that writes marks the site unpublished");

/* ⚠ THE SUBJECT IS DERIVED FROM WHAT EACH COMPONENT POSTS TO. An index that calls a write route
 * changes the draft branch, so it owes the pill a signal — and that is checkable without naming a
 * single collection. `J1` asserts the same seam for PANELS that save; this is the INDEX half, and
 * nothing asserted it for any collection until a create shipped without it twice. */
const WRITE_ROUTES = classified
  .filter((r) => r.mutates && !SESSION_ONLY.has(r.name))
  .map((r) => r.name);

const COMPONENTS = "components/studio";
const writers = readdirSync(join(root, COMPONENTS))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => ({ file: f, src: read(`${COMPONENTS}/${f}`) }))
  /* Only the surfaces that call a write route directly. A component that renders one is not one. */
  .filter((c) => WRITE_ROUTES.some((r) => c.src.includes(`/api/studio/${r}`)))
  .map((c) => ({ ...c, marks: /setUnpublished\s*\(\s*true\s*\)/.test(c.src) }));

/* ⚠ A COMPONENT MAY MARK ITSELF OR DELEGATE, AND THE FIRST VERSION OF THIS ROW KNEW ONLY THE FIRST.
 * It reported four defects and all four were correct code: `HeroFigureField` and
 * `SettingsPhotoField` take an `onUploaded` prop, `SegmentedToggle` takes `onSaved`, and every
 * parent wires those to `setUnpublished(true)`. A guard whose vocabulary is narrower than its
 * concept — the shape this repository has repaired six times in one session and committed here in
 * the suite written to close a different instance of it.
 *
 * ⚠ AND DELEGATION IS ONLY SAFE IF IT IS WIRED, so the callback is followed to its call sites
 * rather than accepted as present. A prop nobody connects is the dead-gate shape: it reads as a
 * signal and emits nothing. */
const CALLBACK = /\b(onUploaded|onSaved)\b/;
const delegates = (c) => CALLBACK.test(c.src);

/* ⚠ ONE EXEMPTION, AS A PROPERTY RATHER THAN A NAME. The component that PUBLISHES must not mark the
 * site unpublished — that is the one write whose success means the opposite. Keyed on the route it
 * calls, so a second publisher would inherit it and a renamed `PublishBar` would not lose it. */
const publishes = (c) => c.src.includes("/api/studio/publish\"") || /api\/studio\/publish[^-]/.test(c.src);

t("B1 the write-route list is real, so B3 is not matching an empty set", WRITE_ROUTES.length > 5, true);
t("B2 …and the walk found writing components", writers.length > 3, true);
t("B3 ⚠ EVERY COMPONENT THAT CALLS A WRITE ROUTE SIGNALS — it marks, delegates, or it publishes",
  writers.filter((c) => !c.marks && !delegates(c) && !publishes(c)).map((c) => c.file).sort(), []);
t("B3a …and all three classes have members, so B3 cannot pass by every writer landing in one",
  [writers.some((c) => c.marks), writers.some((c) => delegates(c) && !c.marks), writers.some(publishes)],
  [true, true, true]);
/* ⚠ THE DELEGATION IS FOLLOWED. Every component that reports through a callback must have at least
 * one caller that wires it to the mark, or the signal stops at a prop. */
{
  const all = readdirSync(join(root, COMPONENTS)).filter((f) => f.endsWith(".tsx"))
    .map((f) => ({ file: f, src: read(`${COMPONENTS}/${f}`) }));
  const unwired = [];
  for (const c of writers.filter((c) => !c.marks && delegates(c) && !publishes(c))) {
    const tag = "<" + c.file.replace(/\.tsx$/, "");
    const callers = all.filter((o) => o.file !== c.file && o.src.includes(tag));
    const wired = callers.some((o) => {
      const at = o.src.indexOf(tag);
      const win = o.src.slice(at, at + 600);
      /* Wired directly at the call site... */
      if (/(onUploaded|onSaved)=\{[^}]*setUnpublished\(\s*true\s*\)/.test(win)) return true;
      /* ⚠ ...OR FORWARDED, WHICH IS THE THIRD TIME THIS SUITE'S VOCABULARY WAS NARROWER THAN ITS
         CONCEPT. `ProjectsEditPanel` renders `<SegmentedToggle onSaved={onSaved} />` from an inner
         component, and the same FILE resolves that identifier to `() => setUnpublished(true)`. A
         bare forward is sound exactly when the forwarding file marks, because the identifier is
         scoped to it — so this follows one hop and stops, rather than pretending to do dataflow. */
      return /(onUploaded|onSaved)=\{\s*(onUploaded|onSaved)\s*\}/.test(win)
        && /setUnpublished\(\s*true\s*\)/.test(o.src);
    });
    if (!wired) unwired.push(c.file);
  }
  t("B3b ⚠ AND EVERY DELEGATING WRITER HAS A CALLER THAT WIRES ITS CALLBACK TO THE MARK — a prop nobody connects is a dead gate",
    unwired.sort(), []);
}

/* ⚠ AND THE ORDERING, WHICH IS THE ACTUAL DEFECT RATHER THAN THE ABSENCE. A component that marks
 * AFTER navigating has marked nothing a user will see — the push unmounts nothing here, but the
 * state update lands on a provider the destination re-uses, and reasoning about which wins is
 * exactly the reasoning that produced the false comment. Marking first is unconditional and needs
 * no model of the router. `CaseStudyIndex` has always done it; gallery and blog had not. */
console.log("\nC · and it marks BEFORE it navigates, which is the ordering the false comment got wrong");
const navWriters = writers.filter((c) => /router\.push\(`\/studio\//.test(c.src));
t("C1 there are components that both write and navigate, or C2 is vacuous", navWriters.length >= 3, true);
{
  const late = [];
  for (const c of navWriters) {
    /* Per create-success block: find each `router.push` that follows a create-entry fetch, and
       require a mark between the fetch and the push. Bounded to the enclosing function body by the
       next `\n  }` at function indentation, so the scan cannot run past its subject — the
       unbalanced-matcher family's newest member was an extractor whose END was unanchored. */
    const at = c.src.indexOf("/api/studio/create-entry");
    if (at < 0) continue;
    const end = c.src.indexOf("\n  }", at);
    const body = c.src.slice(at, end > at ? end : c.src.length);
    const mark = body.indexOf("setUnpublished(true)");
    const push = body.indexOf("router.push(");
    if (push >= 0 && (mark < 0 || mark > push)) late.push(c.file);
  }
  t("C2 ⚠ THE MARK PRECEDES THE PUSH ON EVERY CREATE PATH — after the navigation is a signal nobody receives",
    late.sort(), []);
}

/* ⚠ ABSENCE DIRECTION, WHICH IS THE SOUND ONE: the false claim must not come back as code's
 * justification. It is QUOTED in both files, so this asserts the shape of the claim rather than its
 * words — a comment asserting the bar re-renders from fresh server data on navigation. */
console.log("\nD · the false justification cannot return");
for (const f of ["GalleryIndex.tsx", "BlogIndex.tsx"]) {
  const raw = readFileSync(join(root, COMPONENTS, f), "utf8");
  t(`D1 ${f} keeps the retraction rather than deleting the claim`,
    /EVERY CLAUSE IS\s*\n?\s*FALSE|EVERY CLAUSE IS FALSE/.test(raw), true);
}

console.log(`\ndraft-signal result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
