// The publish toaster — what the status line could not do, and the freeze it sits inside.
//
// ⚠ IT IS NOT A RESTYLE OF PublishBar'S LINE. That line holds ONE string, is overwritten by the next
// status and carries no action, so a refusal named the post that was wrong and offered no way to
// reach it. The toast adds PERSISTENCE, AN ACTION and A STACK. The split is standing state versus
// event result, and these rows are what stop it drifting back.
import { readFileSync } from "node:fs";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const src = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const toaster = src("components/studio/PublishToaster.tsx");
const bar = src("components/studio/PublishBar.tsx");
const css = src("app/globals.css");

console.log("A · the subject exists and is wired on BOTH paths");
t("A1 the component is real, against a literal", toaster.length > 2000, true);
/* ⚠ THE YIELD IS THE POINT. PublishBar returns null when something transient owns the corner —
 * right for a pill the author can re-summon, wrong for the only record of why a publish failed. */
t("A2 ⚠ THE TOASTER SURVIVES `anyOccluding` — the bar yields the corner and the refusal must not go with it",
  /if \(anyOccluding\) \{[\s\S]{0,200}?<PublishToaster/.test(bar), true);
t("A2a …and it renders on the normal path too, so the guard is a branch and not the only mount",
  (bar.match(/<PublishToaster/g) ?? []).length, 2);

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
  (bar.match(/resolveToast\(|refusal\(|dismissToast\(pendingId/g) ?? []).length >= 9, true);
t("B3 …and a pending toast MORPHS rather than stacking, so one action never reads as two",
  /pendingId\.current/.test(bar) && /prev\.map\(\(x\) => \(x\.id === id/.test(bar), true);

console.log("\nC · the validator's sentence ships unmodified");
/* ⚠ `publishBlockers` is the one source — the inspector's advisory mark reads it too. A client-side
 * rewrite would be a second spelling of the same rule and would drift from what actually refuses. */
t("C1 ⚠ THE SERVER'S MESSAGE IS THE TOAST'S MESSAGE — no client-side rewording",
  /const serverMsg[^\n]*json\?\.error\?\.message/.test(bar), true);
t("C2 …and the fallback is only used when the server sent nothing",
  /message: serverMsg \|\| fallback/.test(bar), true);

console.log("\nD · the timer and the bar that depicts it cannot disagree");
const msTs = (toaster.match(/TOAST_DRAIN_MS = (\d+)/) ?? [])[1];
const msCss = (css.match(/\.studio-toast-drain \{ animation: studio-toast-drain (\d+)ms/) ?? [])[1];
t("D0 both durations were found, or D1 compares two nulls", [!!msTs, !!msCss], [true, true]);
t("D1 ⚠ THE DRAIN'S DURATION EQUALS THE TIMEOUT IT VISUALISES — a bar emptying at a different rate is a control reporting a state it has not reached",
  msTs, msCss);
t("D2 …and only `ok` drains; a refusal waits for the author", /filter\(\(t\) => t\.kind === "ok"\)/.test(toaster), true);
t("D3 …and the cap is enforced by dropping the OLDEST rather than queueing the newest",
  /\.slice\(0, TOAST_CAP\)/.test(bar), true);

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

console.log(`\npublish-toast result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
