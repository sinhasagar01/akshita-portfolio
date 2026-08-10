// The publish toaster — what the status line could not do, and the freeze it sits inside.
//
// ⚠ IT IS NOT A RESTYLE OF PublishBar'S LINE. That line holds ONE string, is overwritten by the next
// status and carries no action, so a refusal named the post that was wrong and offered no way to
// reach it. The toast adds PERSISTENCE, AN ACTION and A STACK. The split is standing state versus
// event result, and these rows are what stop it drifting back.
import { readFileSync, readdirSync } from "node:fs";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const toaster = src("components/studio/PublishToaster.tsx");
const machine = src("lib/studio/toast-machine.ts");
const bar = src("components/studio/PublishBar.tsx");
const css = src("app/globals.css");
const draft = src("components/studio/useDraftForm.ts");
const prov = src("components/studio/PublishProvider.tsx");

console.log("A · the subject exists and is wired on BOTH paths");
t("A1 the component is real, against a literal", toaster.length > 2000, true);
/* ⚠ REVERSED: THE PILL NO LONGER YIELDS, SO NEITHER DOES THE TOASTER. These rows asserted the
 * toaster survived `anyOccluding` while the bar returned null — correct while the sections rail
 * suppressed the pill. Live use showed that suppression IS the defect: a primary action that
 * VANISHES with nothing explaining why is worse than one that moves. The rail now registers as a
 * bar and the pill rises above it, so there is one mount and no yield to survive. */
t("A2 ⚠ THE TOASTER MOUNTS UNCONDITIONALLY — no branch can suppress the only record of why a publish failed",
  (bar.match(/<PublishToaster/g) ?? []).length, 1);
t("A2a …and nothing in the bar unmounts on occlusion any more",
  /if \(anyOccluding\)/.test(bar), false);

console.log("\nB · the split — the line keeps standing state, the toaster owns events");
/* Each of these still sets the LINE, because each is a fact about now rather than a result. */
t("B1 the standing-state strings are still the line's, unmoved",
  ["Unpublished changes", "All changes published", "Couldn't load your draft"].filter((s) => !bar.includes(s.replace("'", "’")) && !bar.includes(s)), []);
/* ⚠ THE MATCHER COUNTS BOTH SPELLINGS, AND ITS FIRST VERSION COUNTED ONE. Terminal branches reach a
 * toast either directly or through the `refusal` helper, so a regex naming only `resolveToast` saw
 * five of nine and failed a correct implementation — the vocabulary-narrower-than-the-concept shape
 * inside a row written to guard against losing results. Widened to the CONCEPT: any branch that
 * raises, resolves or withdraws. One match is the helper's own definition, hence 9 rather than 8. */
t("B2 ⚠ AND EVERY TERMINAL PUBLISH BRANCH RAISES OR RESOLVES A TOAST — a result that only reaches the line is one the author can lose to the next status",
  (bar.match(/resolveToastById\(|refusalT\(|dismissToast\(opId/g) ?? []).length >= 9, true);
/* Resolution-in-place is the MACHINE's rule now, and it also states what happens when the pending
 * card is already gone — raised fresh rather than dropped, because a result nobody sees is worse. */
t("B3 …and a pending toast MORPHS rather than stacking, so one action never reads as two",
  /list\.map\(\(t\) => \(t\.id === id \? \{ \.\.\.patch, id \} : t\)\)/.test(machine), true);

console.log("\nC · the validator's sentence ships unmodified");
/* ⚠ `publishBlockers` is the one source — the inspector's advisory mark reads it too. A client-side
 * rewrite would be a second spelling of the same rule and would drift from what actually refuses. */
t("C1 ⚠ THE SERVER'S MESSAGE IS THE TOAST'S MESSAGE — no client-side rewording",
  /const serverMsg[^\n]*json\?\.error\?\.message/.test(bar), true);
t("C2 …and the fallback is only used when the server sent nothing",
  /message: serverMsg \|\| fallback/.test(bar), true);

console.log("\nD · the timer and the bar that depicts it cannot disagree");
/* ⚠ THE CONSTANTS MOVED TO THE PURE LEAF, and this matcher followed them rather than the file it
 * was written against. `toast-machine.ts` now owns what a toast BECOMES; the component paints. */
const msTs = (machine.match(/TOAST_DRAIN_MS = (\d+)/) ?? [])[1];
const msCss = (css.match(/\.studio-toast-drain \{ animation: studio-toast-drain (\d+)ms/) ?? [])[1];
t("D0 both durations were found, or D1 compares two nulls", [!!msTs, !!msCss], [true, true]);
t("D1 ⚠ THE DRAIN'S DURATION EQUALS THE TIMEOUT IT VISUALISES — a bar emptying at a different rate is a control reporting a state it has not reached",
  msTs, msCss);
/* ⚠ THE MATCHER NAMES THE CONCEPT, NOT THE LOOP SHAPE. It pinned `.filter(drains)` and went stale
 * the moment the timer became one-per-card — the third matcher in this arc to fail a change that
 * improved the code. What matters is that the RENDERER asks the machine rather than deciding. */
t("D2 …and only `ok` drains; a refusal waits for the author",
  [/kind === "ok"/.test(machine), /drains\(/.test(toaster)], [true, true]);
t("D3 …and the cap is enforced by dropping the OLDEST rather than queueing the newest",
  /\[t, \.\.\.list\]\.slice\(0, TOAST_CAP\)/.test(machine), true);

console.log("\nE · reduced motion keeps the END state, not the start");
/* #198's trap: gating the animation without gating its end leaves the element in its FROM state —
 * here an invisible toast and an undrained bar, reading as a stalled publish. */
/* ⚠ THE MATCHER FOLLOWED THE SCOPE. These selectors gained `.studio-chrome ` when `studio-ink` C8
 * required it, and this row went stale the moment they did — a matcher pinned to an unscoped
 * spelling passes only until the scope it ignores is applied. */
const rmAt = css.indexOf("@media (prefers-reduced-motion: reduce) {\n  .studio-chrome .studio-toast");
const rm = rmAt >= 0 ? css.slice(rmAt, rmAt + 400) : "";
t("E0 the reduced-motion block was located, or E1 passes over an empty string", rm.length > 100, true);
t("E1 ⚠ THE TOAST IS VISIBLE AND THE BAR IS DRAINED UNDER `reduce`, not left at opacity 0",
  [/\.studio-toast \{ animation: none; opacity: 1/.test(rm), /\.studio-toast-drain \{ animation: none; width: 0/.test(rm)], [true, true]);

console.log("\nF · the freeze — the studio chrome has ONE ground and must not gain another");
/* ⚠ TWO OF THIS UNIT'S THREE DERIVATIONS HAD NO SUBJECT. A dark shadow tier and a nine-ground chip
 * check were carried from the public arc into a surface that is immune BY CONSTRUCTION (#323).
 * A REQUIREMENT INHERITED FROM THE WRONG SURFACE is a measurement on the wrong ground, one level up. */
t("F1 ⚠ NO PUBLIC PALETTE REFERENCE IN THE TOASTER — the freeze, asserted where it would be easiest to break",
  /--color-(?!studio-)[a-z]/.test(toaster.replace(/\/\*[\s\S]*?\*\//g, "")), false);
t("F2 …and its CSS names only studio tokens",
  (css.slice(css.indexOf("THE PUBLISH TOASTER"), css.indexOf("--studio-lift-popover")).match(/var\(--color-(?!studio-)[a-z]/g) ?? []), []);
t("F3 …and no dark variant of any of it exists, because there is no dark studio ground",
  /data-ground[^\n]*studio-toast|studio-toast[^\n]*data-ground/.test(css), false);

console.log("\nG · it sits between the pill and the modal, deliberately");
t("G1 ⚠ ABOVE THE PILL (z-40) AND BELOW THE MODALS (z-50) — the spec's z-60 would float over a blocking surface the publish flow runs through",
  /z-\[45\]/.test(toaster), true);
t("G2 …and it is top-right where the pill is bottom-centre, so the corners cannot contend",
  /fixed right-4 top-\[76px\]/.test(toaster), true);

console.log("\nR · the controls that could not render, and the timers that could not stop");
/* ⚠ BUG A. `action.retry` was never SET by anything, so the Retry button and its handler were dead
 * code — the slow-warning offered it before the state moved to the provider, and the provider's
 * signature dropped the parameter. A control that cannot render is worse than one that is missing,
 * because the branch reads as covered. */
t("R1 ⚠ THE PROVIDER ACCEPTS A RETRY AND THE SLOW WARNING SETS IT — otherwise the button is unreachable",
  [/beginToast: \(title: string, message: string, onRetry\?: \(\) => void\)/.test(prov),
   /retry: true as const/.test(prov)], [true, true]);
t("R1a …and the publish supplies one, so the warning it raises can act",
  /beginToast\("Publishing…"[^)]*, publish\)/.test(bar), true);
t("R1b …and the retry is keyed by OPERATION, not by component — two can be pending at once",
  /retryToast: \(id: number\) => void/.test(prov) && /onRetry\?: \(id: number\) => void/.test(toaster), [true, true][0]);
/* ⚠ BUG C. The drain effect rebuilt every timer on each `toasts` change, so a card five seconds old
 * got a fresh six whenever another toast appeared — while its CSS bar, which runs once from mount,
 * had already emptied. The bar and the dismissal then described different amounts of time. */
t("R2 ⚠ ONE DRAIN TIMER PER CARD, ARMED ONCE — a rebuild on every change desynchronises the bar from the dismissal",
  /drainTimers/.test(toaster) && /live\.has\(t\.id\)/.test(toaster), true);
/* ⚠ BUG D. `push` slices past the cap silently, and only dismiss/resolve cleared timers. */
t("R3 ⚠ THE CAP'S SILENT DROP IS FORGOTTEN EXPLICITLY — a pure slice cannot clean up after itself",
  /if \(!next\.some\(\(n\) => n\.id === t\.id\)\) forget\(t\.id\)/.test(prov), true);

console.log("\nS · the save path raises its own toasts, from the same stack");
/* ⚠ THE SUBJECT IS DERIVED FROM THE FILESYSTEM, NOT LISTED — and the miss this row exists for is
 * the reason. Four panels were labelled and reported as done when the population was ELEVEN, so
 * Theme, Blog, Skills, Experience and Case studies saved in silence until an author found them.
 * An enumerated subject is correct the day it is written and decays from then on; a derived one
 * cannot fall behind its own population. */
const panels = readdirSync(new URL("../../components/studio/", import.meta.url))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => [f, readFileSync(new URL(`../../components/studio/${f}`, import.meta.url), "utf8")])
  .filter(([, src]) => /useDraftForm[<(]/.test(src) && !/^\s*\*/.test(src));
t("S0 the walk found the real population of save panels, against a literal", panels.length >= 10, true);
t("S0a ⚠ EVERY useDraftForm CONSUMER PASSES A toastLabel — a panel that saves in silence is one an author has to discover",
  panels.filter(([, src]) => !/toastLabel:/.test(src)).map(([f]) => f), []);
/* ⚠ THE STATE LIVES IN THE PROVIDER BECAUSE TWO UNRELATED SURFACES RAISE INTO IT — publish results
 * from the bar, save results from every panel's `useDraftForm`. They share no ancestor but this. */
t("S1 the provider owns the stack and exposes the three operations",
  ["toasts:", "beginToast:", "resolveToast:", "dismissToast:"].filter((k) => !prov.includes(k)), []);
t("S2 …and the bar RENDERS them rather than keeping a second copy",
  /const \{[\s\S]{0,220}?toasts, beginToast, resolveToast/.test(bar) && !/useState<Toast\[\]>/.test(bar), true);
/* ⚠ ONE CARD PER SAVE OPERATION, NOT PER BLUR. Coalesced saves re-enter through the in-flight guard,
 * so the begin runs once per settle — a card per keystroke would flood a three-card stack. */
t("S3 ⚠ THE SAVE RAISES INSIDE THE IN-FLIGHT GUARD — a card per keystroke would flood the stack",
  /savingRef\.current = true;[\s\S]{0,400}?toastLabel \? beginToast\(/.test(draft), true);
t("S4 …and a panel that passes no label raises nothing, so labelling was additive",
  /toastLabel \? beginToast\([^)]*\) : null/.test(draft), true);
/* fs mode wrote nothing to a draft branch, so "Draft saved" would name a thing that did not happen.
 * VERIFIED IN THE RUNNING STUDIO: the card appears as "Saving draft… Site settings — Hero" and is
 * then withdrawn — caught with a MutationObserver, because an fs save returns in ~15ms and a poll
 * after the fact measures a state that has already gone. */
t("S5 ⚠ fs MODE WITHDRAWS THE CARD RATHER THAN CLAIMING A SAVE THAT DID NOT HAPPEN",
  /json\.mode === "fs"[\s\S]{0,300}?dismissToast\(toastId\)/.test(draft), true);
t("S6 …and a failure carries the SERVER's message, the same rule the publish refusals follow",
  /error\?\.message[\s\S]{0,200}?resolveToast\(toastId, \{ kind: "refusal"/.test(draft), true);

console.log("\nT · one language for results — the page-level banners are gone and the standing state is not");
/* ⚠ THE RULE THIS SECTION GATES, STATED ONCE SO NO ROW HAS TO CARRY IT: INLINE STAYS FOR STATE ABOUT
 * THE CONTROL YOU ARE TOUCHING; THE TOASTER TAKES RESULTS OF DISCRETE OPERATIONS. "Saving…" is
 * continuous and proximate, so it belongs beside the field. A create, a delete, a reorder or a
 * discard is an EVENT that can fail, and the surface showing it usually unmounts — a dialog closes,
 * a row disappears, `router.replace` navigates. AN ERROR PINNED TO A CONTROL THAT VANISHES IS AN
 * ERROR NOBODY READS.
 *
 * ⚠ THE SUBJECT IS DERIVED, NOT LISTED. A named set of files is correct on the day it is written and
 * decays from then on — the sixth instance of that in this repo. So the population is every studio
 * component that performs a discrete write, found by its own fetch. */
const studioDir = new URL("../../components/studio/", import.meta.url);
/* ⚠ COMMENT-STRIPPED, AND THAT IS NOT TIDINESS. The first draft walked raw source, so a terminal
 * call COMMENTED OUT still satisfied T2 — the mutation that proved it was itself a comment-out, and
 * the row reported the mutation as withstood. Every matcher run over source in this repo has met
 * this; the PR-number-as-hex trap is the same collision from the other side. */
const decomment = (b) => b.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const writers = readdirSync(studioDir)
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
  .map((f) => [f, decomment(src(`components/studio/${f}`))])
  .filter(([, body]) => /fetch\("\/api\/studio\//.test(body));
t("T1 the derived population is non-empty and plausible, against a LITERAL rather than against itself",
  writers.length >= 5, true);

/* ⚠ THE FIRST VERSION OF T2 COUNTED `beginToast` AGAINST `resolveToast` PER FILE, AND MUTATION KILLED
 * IT: commenting out one terminal in a file holding four left the count still passing. The count was
 * narrower than the concept — it could only ever catch a file with NO terminals at all. Seventh time
 * in this repo a gate's vocabulary has fallen short of its idea, and repaired the same way, by
 * widening to the concept rather than bending the subject.
 *
 * ⚠ THE CONCEPT IS THE `catch`. Every other branch of a write is an answer the server gave, and the
 * author can see the outcome in the list. A THROWN request is the one path with no answer and no
 * visible change, so a card left pending there is the only place the toaster can silently lie. That
 * is derivable exactly — slice the catch, ask whether the operation's own id is terminated in it —
 * where "every branch terminates" is not.
 *
 * ⚠ AND IT FOUND ONE, IN CODE THAT HAD ALREADY SHIPPED. `publish()` declared its id INSIDE the try,
 * so its catch could not reach the toast. Not a card stuck forever — TOAST_SLOW_MS gave up after 20
 * seconds — but its sentence says the request may still land, which a thrown fetch has ruled out. */
const catchGaps = [];
for (const [f, body] of writers) {
  for (const m of body.matchAll(/(\w+) = beginToast\(/g)) {
    const id = m[1];
    const head = body.lastIndexOf("function ", m.index);
    const open = body.indexOf("{", head);
    let d = 0, close = -1;
    for (let i = open; i < body.length; i++) {
      if (body[i] === "{") d++;
      else if (body[i] === "}" && --d === 0) { close = i; break; }
    }
    const fn = body.slice(open, close);
    const c = fn.indexOf("} catch");
    if (c < 0) { catchGaps.push([f, id, "no catch at all"]); continue; }
    const cOpen = fn.indexOf("{", c);
    let e = 0, cClose = -1;
    for (let i = cOpen; i < fn.length; i++) {
      if (fn[i] === "{") e++;
      else if (fn[i] === "}" && --e === 0) { cClose = i; break; }
    }
    const block = fn.slice(cOpen, cClose);
    if (!new RegExp(`(resolveToast|resolveToastById|dismissToast)\\(${id}\\b`).test(block)) catchGaps.push([f, id, "catch does not terminate it"]);
  }
}
t("T2 ⚠ EVERY THROWN WRITE TERMINATES ITS OWN CARD — the one path where a pending toast can lie in silence",
  catchGaps, []);
t("T2a …and the walk found begin-sites to check, against a LITERAL rather than against itself",
  writers.reduce((n, [, b]) => n + (b.match(/= beginToast\(/g) ?? []).length, 0) >= 6, true);

/* ⚠ ASSERTED AS THE ABSENCE OF THE STATE, NOT OF A STRING IN JSX. A row pinned to the sentence
 * would pass the moment someone reworded it — five matchers in this repo have already failed a
 * change that improved the code. What must not come back is a PLACE for a discard result to live. */
t("T3 the pill holds no discard-result state — the result is an event and belongs in the stack",
  /discardMsg/.test(bar), false);
/* ⚠ AND ITS COMPLEMENT, WHICH IS THE HALF THAT CATCHES A FUTURE CLEANUP. `discardStatus` is STANDING
 * STATE — it gates `canDiscard` and labels the button while the request is in flight — so deleting
 * it alongside `discardMsg` would be the same mistake in the other direction. A conditional
 * assertion needs its complement asserted too. */
t("T3a ⚠ …AND `discardStatus` SURVIVES, because it is standing state rather than a result",
  /discardStatus === "discarding"/.test(bar) && /setDiscardStatus\("discarding"\)/.test(bar), true);
t("T3b …and the discard failure offers the operation itself as the retry, which is safe because a failed discard deleted nothing",
  /beginToast\("Discarding[\s\S]{0,80}?, discard\)/.test(bar), true);

/* ⚠ THE REORDER FIELD IS DELETED RATHER THAN LEFT RETURNING NULL. A field every consumer must
 * remember to ignore is a second surface waiting to be re-rendered by the next person who reads the
 * hook's type. Asserted on the RETURN SHAPE, which is the property. */
const reorder = src("components/studio/useListReorder.ts");
t("T4 the reorder hook returns no error field at all",
  /reorderError/.test(reorder.replace(/\/\*[\s\S]*?\*\//g, "")), false);
t("T4a …and it raises into the stack instead, so a reorder failure outlives the row that moved",
  /beginToast\(/.test(reorder), true);

console.log(`\npublish-toast result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
