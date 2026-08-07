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
// ⚠ SECTION E READS TWO OF THE THREE FORMS A COLOUR CAN TAKE. E2 reads `className` strings and E4
// reads `style={{ }}` objects. The third is a BARE JSX ATTRIBUTE — `<path stroke="var(--color-…)">`
// — and the accent context for one of those lives in the PARENT's conditional, not on the element,
// so no static scan reaches it. `ProcessSection`'s checkmark is that case: it is correct, it is
// commented at the site, and a gate does not protect it. Stated rather than papered over.
//
// It reads `globals.css`. Whether a role's NAME is a good one is a judgement no gate makes; what it
// can check is that the name resolves to a rung, that the registry and the stylesheet agree both
// ways, and that no two roles collide without a stated reason. The jobs below are prose, and a
// person still decides whether they are honest.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

console.log("\nE · ⚠ A GROUND AND ITS FOREGROUND AGREE — the check #383's sweep needed and did not have");

/* ⚠ THIS EXISTS BECAUSE A RUNG WITH TWO ROLES CANNOT BE MIGRATED BY A RUNG-TO-ROLE MAP. `cream-50`
 * is both `surface` (a card ground) and `on-accent` (a foreground on the accent). The map has ONE
 * answer per rung, so #383's sweep sent all four accent-badge labels to `surface` — the exact bug
 * `on-accent` had been created one PR earlier to prevent, described in that PR's own comment.
 *
 * ⚠ AND THE PAIR TEST THAT SHOULD HAVE CAUGHT IT HAD A NARROWER VOCABULARY THAN ITS CONCEPT. It
 * skipped any element carrying both a ground and a foreground — but looked only for grounds from
 * the CREAM/INK LADDER, and an accent ground is in neither. So `bg-accent-500` with a light label
 * read as one-sided and was swept. The concept was "this element brings its own ground"; the
 * implementation was "this element uses a ladder background".
 *
 * ⚠ AND THE CENSUS MOVED IN THE DIRECTION I HAD PREDICTED, WHICH IS HOW IT ALMOST SURVIVED.
 * `cascade-public` C1 went 6 to 5, and 6 to 5 is what "a role name replacing a raw one reclassifies
 * a colour" was supposed to look like. It was two distinct collisions COLLAPSING INTO ONE NAME
 * because both had been given the wrong role. Repairing the sites restored it to 6. A PREDICTION
 * THAT A NUMBER WILL MOVE MAKES ANY MOVEMENT LOOK LIKE THE PREDICTED ONE — which is why that suite
 * says the number moving tells you nothing about which of five things happened. */
const tsxFiles = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (/node_modules|\.next|\.git/.test(p)) continue;
    if (e.isDirectory()) walk(p); else if (/\.tsx$/.test(e.name)) tsxFiles.push(p);
  }
})(new URL("../../", import.meta.url).pathname);

/* Foreground roles that follow the PAGE ground. On an accent ground every one of them is wrong,
 * because the accent does not follow the page and its label must not either. */
const PAGE_FOREGROUNDS = ["surface", "surface-well", "background", "text-primary", "text-secondary", "text-lead"];
const fgOnAccent = [];
let classAttrs = 0;
for (const f of tsxFiles) {
  const rel = f.replace(new URL("../../", import.meta.url).pathname, "");
  if (/^components\/studio\/|^app\/studio\//.test(rel)) continue;
  for (const m of readFileSync(f, "utf8").matchAll(/className=(?:\{`|["`'])([\s\S]*?)(?:`\}|["`'])/g)) {
    classAttrs++;
    const cls = m[1];
    if (!/\bbg-accent-\d/.test(cls)) continue;
    for (const role of PAGE_FOREGROUNDS) {
      if (new RegExp("\\btext-" + role + "\\b").test(cls)) fgOnAccent.push(`${rel}: text-${role} on an accent ground`);
    }
  }
}
console.log(`         ${classAttrs} className attributes scanned outside /studio`);
/* ⚠ CONSTANT. The subject is the scan, not the hits — a scan that read nothing must fail, and a
 * clean site must be able to report zero without the gate reading as broken. */
t("E0 the scan has subjects, against a literal", classAttrs >= 200, true);
t("E1 …and it finds accent grounds at all, so E2 is not vacuous",
  tsxFiles.some((f) => /bg-accent-\d/.test(readFileSync(f, "utf8"))), true);
t("E2 ⚠ NO PAGE-FOLLOWING FOREGROUND SITS ON AN ACCENT GROUND — that label must be `on-accent`, or it inverts on a dark page",
  fgOnAccent.sort(), []);

/* ⚠ AND THE SAME SHAPE IN A STYLE OBJECT, WHICH E2 ABOVE CANNOT SEE. A mutation proved it: putting
 * #384's `ProcessSection` mistake back left E2 green, because that site is a `var()` inside a
 * `style={{ }}` and E2 reads `className`. Two of the four sites this rule exists for live there.
 *
 * A style object is scanned as a WINDOW rather than as one attribute — the background and the
 * foreground are separate properties on separate lines, so the test is whether an accent background
 * and a page-following foreground appear within the same brace-delimited object. Coarser than E2 and
 * it covers the form E2 structurally cannot. */
const styleObjs = [];
for (const f of tsxFiles) {
  const rel = f.replace(new URL("../../", import.meta.url).pathname, "");
  if (/^components\/studio\/|^app\/studio\//.test(rel)) continue;
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/style=\{\{([\s\S]{0,900}?)\}\}/g)) {
    const body = m[1];
    if (!/--color-accent-\d/.test(body)) continue;   // per-property test below decides
    styleObjs.push({ rel, body });
  }
}
/* ⚠ PARSED PER PROPERTY, AND TWO REGEX DEFECTS IN THE FIRST VERSION ARE WHY. A JS object literal
 * has NO SEMICOLONS, so a `[^;]*` window spanned the entire object and matched a background against
 * a border three properties away. And `(color|...)` matched `backgroundColor`, which CONTAINS
 * "Color" — so a themed background read as a foreground. Both produced a confident false positive on
 * a clean tree.
 *
 * Properties are split on top-level commas and each is tested as `name: value`, with the name
 * anchored. Slower and correct. */
const propsOf = (body) => {
  const out = []; let depth = 0, cur = "";
  for (const ch of body) {
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((p) => { const i = p.indexOf(":"); return i < 0 ? null : { k: p.slice(0, i).trim().replace(/["']/g, ""), v: p.slice(i + 1) }; })
    .filter(Boolean);
};
const FG_PROP = /^(color|stroke|fill|WebkitTextFillColor)$/;
const BG_PROP = /^(background|backgroundColor|backgroundImage)$/;

const styleBad = [];
for (const o of styleObjs) {
  const props = propsOf(o.body);
  const hasAccentBg = props.some((p) => BG_PROP.test(p.k) && /--color-accent-\d/.test(p.v));
  if (!hasAccentBg) continue;
  for (const p of props) {
    if (!FG_PROP.test(p.k)) continue;
    for (const role of PAGE_FOREGROUNDS)
      if (new RegExp("--color-" + role + "\\b").test(p.v))
        styleBad.push(`${o.rel}: \`${p.k}\` uses --color-${role} where the background is the accent`);
  }
}
console.log(`         ${styleObjs.length} style objects mention the accent`);
/* ⚠ E4's DENOMINATOR, AND IT WAS LOST IN AN EDIT. Rewriting the property parser dropped this row,
 * and E4 went on passing — over a scan whose subject nothing was asserting. Exactly the empty-subject
 * shape, introduced by a repair to the same section. */
t("E3 the style-object scan has subjects — two of this rule's four sites live in this form",
  styleObjs.length >= 5, true);
t("E4 ⚠ NOR IN A STYLE OBJECT — the form E2 structurally cannot read, and where the mutation escaped",
  [...new Set(styleBad)].sort(), []);

console.log("\nF · ⚠ WHICH RUNGS CARRY MORE THAN ONE ROLE — the map's SHAPE, not its entries");

/* ⚠ A RUNG-TO-ROLE MAP IS A FUNCTION AND A MULTI-ROLE RUNG IS NOT IN ITS DOMAIN. #383's sweep sent
 * four accent-badge labels to `surface` because `cream-50` has two roles and the map had one answer.
 * No correction to the map's ENTRIES fixes that — the map is the wrong SHAPE.
 *
 * ⚠ AND #384 FOUND TWO MORE OF THE SAME SITES BY HAND, in `ProcessSection`: the step label and the
 * checkmark, both drawn only when the dot is filled with the accent. A second sweep with a corrected
 * rung map would have sent both to `surface` again.
 *
 * The repair is a key of (RUNG, UTILITY KIND) rather than rung alone — `bg-` resolves the ground
 * role, `text-`/`fill`/`stroke` the foreground one. That IS a function over the domain, and this
 * section asserts the multi-role set is DECLARED so the next sweep knows which rungs it may not
 * map. It is a list that must SHRINK or stay still, never grow silently. */
const MULTI_ROLE = {
  "cream-50": { roles: ["surface", "on-accent"],
    why: "the card ground and the label drawn ON the accent share this rung until the dark ground "
       + "ships. Disambiguated by utility KIND: a ground prefix means `surface`, a foreground prefix "
       + "means `on-accent`. Ends when the two rungs resolve differently." },
};
const rolesByRung = {};
for (const [r, v] of Object.entries(ROLES)) (rolesByRung[v.rung] ??= []).push(r);
const actualMulti = Object.entries(rolesByRung).filter(([, rs]) => rs.length > 1).map(([k]) => k).sort();
console.log(`         rungs carrying >1 role: ${actualMulti.join(", ") || "none"}`);

t("F1 ⚠ EVERY MULTI-ROLE RUNG IS DECLARED — an undeclared one is a rung the next sweep will map wrongly",
  actualMulti.filter((r) => !MULTI_ROLE[r]), []);
t("F2 …and every declaration still describes a real collision — a stale entry warns about a rung that separated",
  Object.keys(MULTI_ROLE).filter((r) => !actualMulti.includes(r)).sort(), []);
t("F3 ⚠ AND EACH NAMES HOW TO DISAMBIGUATE, so the warning is actionable rather than a caution",
  Object.entries(MULTI_ROLE).filter(([, v]) => !/utility KIND|Disambiguated/.test(v.why)).map(([k]) => k), []);
/* The declared roles must match what the registry actually says, or F1 guards a fiction. */
t("F4 the declared role pair matches the registry, both ways",
  Object.entries(MULTI_ROLE).filter(([r, v]) => JSON.stringify(v.roles.sort()) !== JSON.stringify(rolesByRung[r]?.sort())).map(([k]) => k), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
