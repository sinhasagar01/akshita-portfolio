// EVERY ROLE HAS A JOB, RESOLVES TO A RUNG, AND IS NOT A SECOND SPELLING OF A NEIGHBOUR.
// Run: node --experimental-strip-types ralph/tests/role-layer.mjs
//
// ---- ⚠ WHY THE ROLE LAYER IS BEING ADOPTED RATHER THAN INVENTED ------------------------------
//
// It has existed since the tokens were written — `surface`, `border`, `text-primary`,
// `text-secondary`, `accent` — and measured 87 consumers against 232 raw-ladder ones, 77 of that 87
// being `accent` alone. `surface` had ZERO. A layer with role names and no consumers is the shape
// this project deletes; giving it consumers is the honest alternative to deleting it.
//
// The site is gaining a second ground class, and the rule that makes that safe is that a COMPONENT
// MUST NOT CHOOSE — the context selects which values a name resolves to, and the component reads
// one name. That only works if what components name are ROLES. So this suite is the contract the
// migration will be checked against, written before the migration.
//
// ---- ⚠ THE DEFECT THIS EXISTS TO PREVENT: TWO SPELLINGS OF ONE IDEA -------------------------
//
// A role invented for one or two sites, or one that differs from a neighbour only by "a step
// lighter", is a second spelling entering the layer at birth — the defect #330 spent a PR removing
// and #327 tested `text-body` against. Section C is that test, mechanised: two roles may share a
// rung ONLY if a reason is recorded for why they will later diverge.
//
// ---- WHAT THIS CANNOT SEE, STATED -----------------------------------------------------------
//
// It reads `globals.css`. Whether a role's NAME is a good one is a judgement no gate makes; what it
// can check is that the name resolves to a rung, that the registry and the stylesheet agree both
// ways, and that no two roles collide without a stated reason. The jobs below are prose, and a
// person still decides whether they are honest.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

/* The `@theme` block, brace-matched — it nests, so a slice to the first newline-brace stops early. */
const themeBlock = (() => {
  const at = css.indexOf("@theme"), o = css.indexOf("{", at);
  let d = 0, e = -1;
  for (let i = o; i < css.length; i++) { if (css[i] === "{") d++; else if (css[i] === "}" && --d === 0) { e = i; break; } }
  return css.slice(o + 1, e);
})();

/* ⚠ THE REGISTRY DECLARES THE QUESTION AND EACH ENTRY ANSWERS IT — the Z8 shape from
 * `docs/colour-boundary.yaml`, which forces the reasoning to be written rather than matching a list
 * of accepted phrases. `job` answers "what is this colour FOR", and `rung` is what it must resolve
 * to so a role can never drift from the palette. */
const ROLES = {
  /* ⚠ FOUND BY A2 RATHER THAN BY ME. The first registry omitted it and the row that asserts the
   * stylesheet has no unregistered alias reported it immediately — which is the both-ways join
   * doing its job on the turn it was written. It is a real role with a real consumer: `body` paints
   * it at globals.css line 935. */
  "background": { rung: "canvas", job: "the PAGE ground behind every surface — what `body` paints" },
  "surface": { rung: "cream-50", job: "the ground a content CARD draws on — 17 sites spell it bg-cream-50" },
  "surface-well": { rung: "cream-100", job: "the ground a MEDIA FRAME draws — an image well, a video shell, a diagram's outer wrapper; recessed relative to `surface`" },
  "border": { rung: "cream-300", job: "a drawn edge between two surfaces" },
  "text-primary": { rung: "ink-950", job: "body and heading text at full strength" },
  "text-secondary": { rung: "ink-600", job: "supporting text — meta lines, captions, labels" },
  "text-lead": { rung: "ink-800", job: "the DEK — a standfirst above body copy, larger than prose and darker than text-body" },
  "on-accent": { rung: "cream-50", job: "the foreground drawn ON the accent — a pill, a badge, a filled button" },
  "accent": { rung: "accent-500", job: "the brand mark colour, as a foreground and as a fill" },
};

/* ⚠ A COLLISION IS ALLOWED ONLY WITH A REASON THAT SAYS WHEN IT ENDS. Two roles on one rung is
 * exactly what "two spellings of one idea" looks like from outside, so the difference between that
 * and a real pair is whether anyone can say how they will diverge. */
const COLLISIONS = {
  "cream-50": "⚠ `surface` and `on-accent` share this rung TODAY and must not later. Under a dark "
    + "ground `surface` follows the page down; `on-accent` does NOT, because the accent stays a "
    + "mid-tone and its foreground must stay light. Ends when the dark ground ships and the two "
    + "resolve differently — which is the whole reason both names exist now rather than then.",
};

console.log("\nA · every declared role exists and resolves to a rung");

const declared = new Map([...themeBlock.matchAll(/--color-([a-z0-9-]+)\s*:\s*var\(--color-([a-z0-9-]+)\)\s*;/g)]
  .map((m) => [m[1], m[2]]));
console.log(`         ${declared.size} role tokens declared as var() aliases in @theme`);

/* ⚠ CONSTANT, NOT DERIVED FROM THE SUBJECT. #378: a guard computing its expectation from the thing
 * it guards passes when that thing is empty. */
t("A0 the parse found a real population, against a literal", declared.size >= 8, true);
t("A1 ⚠ EVERY REGISTERED ROLE IS DECLARED — a missing one is a name the migration would resolve to nothing",
  Object.keys(ROLES).filter((r) => !declared.has(r)).sort(), []);
t("A2 ⚠ AND EVERY ALIAS IN @theme IS REGISTERED — an unregistered role has no stated job",
  [...declared.keys()].filter((r) => !(r in ROLES)).sort(), []);
t("A3 ⚠ EACH RESOLVES TO THE RUNG ITS REGISTRY ENTRY NAMES — a role that drifts from the palette is a third source of truth",
  Object.entries(ROLES).filter(([r, v]) => declared.get(r) !== v.rung)
    .map(([r, v]) => `${r} -> ${declared.get(r)}, registry says ${v.rung}`), []);

console.log("\nB · the rungs are real, so a role cannot alias a colour that does not exist");

const rungs = new Set([...themeBlock.matchAll(/--color-([a-z0-9-]+)\s*:\s*(?!var\()/g)].map((m) => m[1]));
console.log(`         ${rungs.size} literal rungs in @theme`);
t("B0 the rung population is real", rungs.size >= 20, true);
t("B1 every role's target is a literal rung, not another role — one level of indirection, not a chain",
  Object.entries(ROLES).filter(([, v]) => !rungs.has(v.rung)).map(([r, v]) => `${r} -> ${v.rung}`), []);

console.log("\nC · ⚠ NO ROLE IS A SECOND SPELLING OF A NEIGHBOUR");

const byRung = {};
for (const [r, v] of Object.entries(ROLES)) (byRung[v.rung] ??= []).push(r);
const shared = Object.entries(byRung).filter(([, rs]) => rs.length > 1);
console.log(`         ${shared.length} rung(s) carry more than one role: ${shared.map(([k, rs]) => `${k} (${rs.join(" + ")})`).join(", ") || "none"}`);

t("C1 ⚠ EVERY SHARED RUNG HAS A RECORDED REASON — two roles on one rung with no reason IS the second spelling",
  shared.filter(([k]) => !COLLISIONS[k]).map(([k, rs]) => `${k}: ${rs.join(" + ")}`), []);
t("C2 …and every reason says WHEN IT ENDS, so a collision cannot become permanent by inattention",
  Object.entries(COLLISIONS).filter(([, why]) => !/Ends when|ends when/.test(why)).map(([k]) => k), []);
/* ⚠ AND A STALE EXEMPTION IS THE OTHER DIRECTION. If the two roles diverge, this entry must go —
 * an exemption outliving its subject is what let a dead token survive a contrast floor in #330. */
t("C3 every recorded collision still collides — a stale one exempts a pair that already separated",
  Object.keys(COLLISIONS).filter((k) => (byRung[k] ?? []).length < 2), []);

console.log("\nD · every role states what it is FOR");

t("D1 ⚠ EVERY ROLE DECLARES A JOB — a role without one is a rename, and a rename is not a layer",
  Object.entries(ROLES).filter(([, v]) => !v.job || v.job.length < 25).map(([r]) => r), []);
/* The refusals, recorded where the additions are. A role considered and declined is as much a
 * decision as one added, and leaving it unwritten invites the next person to add it. */
const REFUSED = {
  "cream-200": "gradient ENDPOINTS in four of its nine sites, one highlighted-state card, one illustration constant — no single job",
  "ink-400": "ONE border on a button; CLAUDE.md already rules it never text",
  "ink-200": "ONE hairline inside an illustration file",
};
console.log(`         ${Object.keys(REFUSED).length} rungs were measured for a role and refused: ${Object.keys(REFUSED).join(", ")}`);
t("D2 ⚠ NO REFUSED RUNG QUIETLY GAINED A ROLE — the refusals are a decision, not an omission",
  Object.keys(REFUSED).filter((r) => Object.values(ROLES).some((v) => v.rung === r)), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
