// The save coalescing in useDraftForm — the shape, not the behaviour.
// Run: node --experimental-strip-types ralph/tests/coalescing-save.mjs
//
// WHY THIS ONE EARNS ITS PLACE WHEN #200's COPY SUITE DID NOT. A suite pinning wording fails
// on every future rewrite without catching a defect. This one can fail for a REASON: the
// guard it protects used to read `if (!dirty || savingRef.current) return;`, and that bare
// return silently discarded an author's second edit whenever it landed inside a save. A
// "simplification" back to it loses data, produces no error, and nothing else in this repo
// would notice. The state is even reported honestly the whole time — `dirty` stays true —
// which is what made it invisible rather than loud.
//
// THE BEHAVIOUR IS BROWSER-DRIVEN, and deliberately not faked here. `saveDraft` is an async
// React callback around `fetch`; plain node cannot run it, and a fake would prove the fake.
// The gate that proves the retry posts the LATEST values stubs a slow save-draft and reads
// the second request body — see the PR. What a suite CAN hold is that the pieces which make
// that possible are still present and still wired to each other.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Comment-stripped, so prose explaining the old guard cannot satisfy an assertion about the
 *  new one — this file's own header quotes the bare `return` it forbids. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const hook = code("components/studio/useDraftForm.ts");
const canvas = code("components/studio/BlogBlocksEditPanel.tsx");

/* ================================================================= A. THE GUARD COALESCES
 * The regression this exists for. */
t("A: an in-flight save RECORDS an owed save",
  /if \(savingRef\.current\) \{\s*saveOwedRef\.current = true;\s*return;\s*\}/.test(hook), true);
// THE BARE FORM IS FORBIDDEN. This is the exact line that dropped the edit.
t("A: the old dropping guard is GONE",
  /if \(!dirty \|\| savingRef\.current\) return;/.test(hook), false);
t("A: …and the owed save is fired when the in-flight one settles",
  /if \(saveOwedRef\.current\) \{\s*saveOwedRef\.current = false;\s*void saveDraft\(\);\s*\}/.test(hook), true);
// It must fire from `finally`, or an error path would strand the owe forever.
{
  const fin = hook.slice(hook.indexOf("} finally {"));
  t("A: the retry lives in `finally`, so an error path cannot strand it",
    /saveOwedRef\.current/.test(fin), true);
}

/* ================================================================= B. THE RETRY READS FRESH
 * Coalescing without this is WORSE than the bug: two requests fire and both carry the
 * pre-edit snapshot, which looks like a working retry and is #174's stale-closure defect
 * rebuilt. The refs are what make the recursion correct. */
t("B: a latest-values ref is assigned every render",
  /const valuesRef = useRef\(values\);\s*valuesRef\.current = values;/.test(hook), true);
t("B: a latest-baseline ref is too",
  /const baselineRef = useRef\(savedBaseline\);\s*baselineRef\.current = savedBaseline;/.test(hook), true);
t("B: the POST body is built from the REF, not the closure",
  /buildCommitted\(valuesRef\.current\)/.test(hook), true);
t("B: …and the dirty check reads both refs",
  /isDirty\(valuesRef\.current, baselineRef\.current\)/.test(hook), true);
// The closure forms must be GONE from saveDraft, or the stale read is back.
{
  const fn = hook.slice(hook.indexOf("async function saveDraft"), hook.indexOf("function cancel"));
  t("B: saveDraft no longer builds from the closed-over `values`",
    /buildCommitted\(values\)/.test(fn), false);
  t("B: …and no longer gates on the closed-over `dirty`", /\bif \(!dirty\b/.test(fn), false);
}

/* ================================================================= C. THE BASELINE IS SYNCHRONOUS
 * `setSavedBaseline` lands on the NEXT render; the retry fires in `finally`, before it. Without
 * the synchronous assignment the retry compares against the old baseline, decides the
 * just-saved values still differ, and fires a redundant save. */
t("C: the baseline ref is set synchronously beside the setState",
  /baselineRef\.current = committed;\s*setSavedBaseline\(committed\);/.test(hook), true);

/* ================================================================= D. NO SECOND MECHANISM
 * The canvas cleared `pendingSave` BEFORE calling saveDraft, which lost the owe back when
 * saveDraft dropped it. The shared fix closes that at the source, so the canvas needs no
 * guard of its own — and a guard that cannot fire is a defence that is not defending. */
t("D: the canvas still clears its flag before the call",
  /pendingSave\.current = false;\s*void saveDraft\(\);/.test(canvas), true);
t("D: …and adds no competing in-flight guard of its own",
  /savingRef|saveOwedRef/.test(canvas), false);

/* ================================================================= E. THE INDICATOR IS WHERE EDITING IS
 * Below the fold the canvas view rendered NO indicator while being the only view where inline
 * editing works. Both conditions are required: `canvasBar` renders unconditionally above the
 * swapped content, so `!inspectorFits` alone would duplicate it in the inspector view. */
t("E: the canvas strip carries a Body indicator below the fold",
  /\{!inspectorFits && view === "canvas" \? \(\s*<SaveIndicator label="Body"/.test(canvas), true);
t("E: …gated on BOTH conditions, or it duplicates in the inspector view",
  /!inspectorFits && view === "canvas"/.test(canvas), true);
// The inspector's own copy stays — above the fold it is the only one.
t("E: the inspector's Body indicator is still there",
  (canvas.match(/<SaveIndicator label="Body"/g) ?? []).length, 2);

/* ============================================================================================
   F · THE LATEST-VALUES REF IS WRITTEN SYNCHRONOUSLY, NOT ONLY ON RENDER.

   ⚠ `saveDraft` OPENS WITH A DIRTY CHECK AGAINST `valuesRef.current`, so that ref decides whether
   a save happens at all. It used to be assigned ONLY during render, which makes it "the values as
   of the last render" while the dirty check reads it as "the latest values". Those agree only when
   nothing asks to save before React re-renders.

   ⚠ THE BLOG STATUS CONTROL DID EXACTLY THAT and lost every status change silently. It set a field
   and called `saveDraft` in the same tick through `queueMicrotask`; the ref still held the pre-click
   values, they equalled the baseline, and the function RETURNED WITHOUT SAVING — no request, no
   error, no indicator. There is no Save button on that panel, so nothing else could rescue it: an
   author set a post to Published, pressed Publish site, and got a draft.

   ⚠ THE ONE-SITE PRINCIPLE THE HOOK STATES IS KEPT. `applyValues` is the single mutation path, so
   there is still one line to keep in sync — these rows assert that it is, and that no mutation site
   went back to calling `setValues` directly.
============================================================================================ */
console.log(`\nF · the latest-values ref is written synchronously`);
/* `hook` is already read at the top of this file — reused rather than re-read, since a second
   binding for the same source is a second thing to keep in step. */
const panel = code("components/studio/BlogEditPanel.tsx");

t("F1 ⚠ THE HOOK HAS ONE MUTATION PATH — a second would be a site to miss, which is the note's own rule",
  (hook.match(/setValues\(/g) ?? []).length, 1);
t("F1a …and that one call is inside `applyValues`, not scattered through the callbacks",
  /function applyValues[\s\S]{0,160}setValues\(/.test(hook), true);
t("F2 ⚠ `applyValues` WRITES THE REF BEFORE SCHEDULING THE RENDER — the whole defect in one line",
  /function applyValues[^)]*\)\s*\{\s*valuesRef\.current = next;\s*setValues\(next\);/.test(hook), true);
t("F3 …and every mutation site routes through it, so a save in the same tick sees the edit",
  (hook.match(/applyValues\(/g) ?? []).length >= 4, true);
t("F4 ⚠ AND NO SAVE PATH DEPENDS ON MICROTASK ORDERING — the timing fix that would look like this one",
  /queueMicrotask\s*\(\s*saveDraft/.test(hook + panel), false);
/* ⚠ THE WINDOW IS GENEROUS ON PURPOSE. `code()` blanks comment BODIES but leaves their newlines,
 * so a well-commented handler puts hundreds of characters of whitespace between the two statements
 * this row cares about. A tight window here would be a matcher narrower than its concept, which is
 * the failure this suite exists to catch elsewhere — widen to the concept, never bend the subject. */
t("F5 …and the status control still commits on click, since this panel has no Save button",
  /setField\("status"[\s\S]{0,600}saveDraft\(\)/.test(panel), true);
t("F5a …asserted against the absence of a Save button, so F5 is load-bearing rather than belt-and-braces",
  /<SaveButton|type="submit"/.test(panel), false);

console.log(`\ncoalescing-save result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
