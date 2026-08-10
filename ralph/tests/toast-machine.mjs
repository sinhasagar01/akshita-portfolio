// The toaster's state machine, exercised directly.
//
// ⚠ /studio IS OWNER-GATED IN MIDDLEWARE AND THE SESSION COOKIE IS httpOnly, so the browser path
// cannot be driven from a gate and is NOT driven here. What this proves is the ARITHMETIC: given
// what happened, what the cards become. A stub proves the state machine; only a real session proves
// the whole path, and the owner is the only instrument for that.
import { push, resolve, dismiss, drains, deployPatch, TOAST_CAP, TOAST_DRAIN_MS, TOAST_SLOW_MS, DEPLOY_DEADLINE_MS }
  from "../../lib/studio/toast-machine.ts";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const T = (id, kind = "pending", title = "t") => ({ id, kind, title, message: "m" });

console.log("A · the constants are real and ordered");
t("A1 the cap, the drain and the slow-warning all exist, against literals",
  [TOAST_CAP, TOAST_DRAIN_MS > 0, TOAST_SLOW_MS > 0], [3, true, true]);
/* ⚠ THE SLOW WARNING MUST OUTLAST THE DRAIN, or a success would be replaced by "taking longer"
 * after it had already resolved and started dismissing itself. */
t("A2 ⚠ AND THE SLOW WARNING FIRES LATER THAN A SUCCESS DRAINS — otherwise a resolved toast is overwritten by a warning about it",
  TOAST_SLOW_MS > TOAST_DRAIN_MS, true);

console.log("\nB · newest on top, oldest dropped past the cap");
t("B1 newest first", push([T(1)], T(2)).map((x) => x.id), [2, 1]);
t("B2 ⚠ PAST THE CAP THE OLDEST GOES — queueing would hide the thing the author just caused",
  push(push(push([T(1)], T(2)), T(3)), T(4)).map((x) => x.id), [4, 3, 2]);

console.log("\nC · resolve IN PLACE — one action never reads as two");
const two = push([T(1)], T(2));
t("C1 the pending card becomes the result, in position",
  resolve(two, 1, { kind: "ok", title: "done", message: "m" }).map((x) => [x.id, x.kind]), [[2, "pending"], [1, "ok"]]);
t("C1a …and the list does not grow", resolve(two, 1, { kind: "ok", title: "done", message: "m" }).length, 2);
/* ⚠ A RESULT WHOSE CARD IS GONE IS RAISED FRESH, NOT DROPPED. The author may have dismissed it, or
 * the cap may have pushed it out — and a result nobody sees is worse than an extra card. */
t("C2 ⚠ A RESULT FOR A DISMISSED CARD IS STILL SHOWN — silently dropping it loses the only record of the outcome",
  resolve([], 9, { kind: "refusal", title: "no", message: "m" }).map((x) => [x.id, x.kind]), [[9, "refusal"]]);

console.log("\nD · ⚠ TWO OPERATIONS IN FLIGHT — the case an id-per-operation design exists for");
/* A shared "current toast" passes this by accident whenever the timing happens to be sequential.
 * Here the SAVE finishes while the PUBLISH is still merging. */
let live = push(push([], T(1, "pending", "Publishing…")), T(2, "pending", "Saving draft…"));
live = resolve(live, 2, { kind: "ok", title: "Draft saved", message: "Blog · a-post" });
t("D1 the save resolves and the publish is untouched",
  live.map((x) => [x.id, x.kind, x.title]), [[2, "ok", "Draft saved"], [1, "pending", "Publishing…"]]);
live = resolve(live, 1, { kind: "refusal", title: "Couldn’t publish", message: "slug: alt text" });
t("D2 …and the publish then resolves onto its OWN card, not the save's",
  live.map((x) => [x.id, x.kind]), [[2, "ok"], [1, "refusal"]]);
t("D3 …and dismissing one leaves the other", dismiss(live, 2).map((x) => x.id), [1]);

console.log("\nE · only a success drains; a refusal waits");
t("E1 ok drains, refusal and pending do not",
  [drains(T(1, "ok")), drains(T(2, "refusal")), drains(T(3, "pending"))], [true, false, false]);

console.log("\nG · a card awaiting a deploy must outlive the drain");
/* ⚠ BUG B. A publish success is `ok`, so it drained at 6s — and the poll keys off the card carrying
 * the sha, so dismissing the card STOPPED THE POLL. A Vercel build takes 60-120s, so READY was
 * unreachable in practice: the seam failed quiet correctly and could never succeed. */
t("G1 ⚠ AN `ok` CARD STILL CARRYING A sha DOES NOT DRAIN — dismissing it would kill the poll that answers it",
  drains({ ...T(1, "ok"), sha: "abc" }), false);
t("G1a …and the same card drains once the question is gone", drains({ ...T(1, "ok"), sha: undefined }), true);
/* ⚠ AND THE WAIT IS BOUNDED, or "stays until answered" becomes "stays forever" — the slow-warning's
 * own defect, one surface out. */
t("G2 ⚠ THE DEPLOY WAIT HAS A DEADLINE, and it outlasts a real build rather than merely existing",
  [DEPLOY_DEADLINE_MS > 0, DEPLOY_DEADLINE_MS > 120000], [true, true]);
t("G3 …and it is longer than the drain, or the card would give up before it could ever show a result",
  DEPLOY_DEADLINE_MS > TOAST_DRAIN_MS, true);

console.log("\nF · the deploy answer — fail QUIET, never open");
t("F1 ready becomes live, and carries the deployment when there is one",
  [deployPatch("ready")?.kind, deployPatch("ready", "https://x")?.action?.label], ["ok", "View deployment"]);
t("F2 a failed build says the merge landed and the SITE DID NOT change — both facts, because either alone misleads",
  [deployPatch("error")?.kind, /merge landed/.test(deployPatch("error")?.message ?? "")], ["refusal", true]);
/* ⚠ #175's RULE, AND THE WHOLE POINT OF THE SEAM. Without a credential the route cannot know, so the
 * card must keep the weaker true claim rather than the stronger false one. `null` means LEAVE IT. */
t("F3 ⚠ `unavailable` AND `building` BOTH LEAVE THE CARD ALONE — a missing credential must never resolve to live",
  [deployPatch("unavailable"), deployPatch("building")], [null, null]);
t("F4 …and no state resolves to live except `ready`",
  ["building", "error", "unavailable"].filter((s) => deployPatch(s)?.title === "Site published"), []);

console.log(`\ntoast-machine result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
