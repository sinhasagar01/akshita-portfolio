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
  /* ⚠ THE ONLY ROLE THAT IS AN INK RATHER THAN A FINISHED COLOUR. Consumers keep their own alpha
   * (`border-etch/8`, `bg-etch/15`), because seven distinct weights are in use and one baked alpha
   * could not serve them. Measured: every weight lands within 6% of its light separation on a dark
   * ground, so a consumer's choice survives the ground change. */
  "etch": { rung: "ink-950", job: "the ink a SURFACE MARK is incised with — a hairline, a placeholder bar, a device dot; consumers supply the alpha" },
  "on-accent": { rung: "cream-50", job: "the foreground drawn ON the accent — a pill, a badge, a filled button" },
  "accent": { rung: "accent-500", job: "the brand mark colour, as a foreground and as a fill" },
};

/* ⚠ ONE REGISTRY, NOT TWO. This began as a `COLLISIONS` map in section C and a `MULTI_ROLE` map in
 * section F — the SAME KEYS answering two questions ("is this a second spelling?" and "which rungs
 * may a sweep not map?"). Two lists of one fact is what this project deletes, and the second entry
 * arriving is what made the duplication visible: `ink-950` had to be added twice or neither section
 * would hold the truth.
 *
 * ⚠ A COLLISION IS ALLOWED ONLY WITH A REASON THAT SAYS WHEN IT ENDS. Two roles on one rung is
 * exactly what "two spellings of one idea" looks like from outside; the difference between that and
 * a real pair is whether anyone can say how they diverge and how to tell them apart today. */
const MULTI_ROLE = {
  "cream-50": { roles: ["surface", "on-accent"],
    why: "⚠ the card ground and the label drawn ON the accent share this rung TODAY and must not "
       + "later. Under a dark ground `surface` follows the page down; `on-accent` does NOT, because "
       + "the accent stays a mid-tone and its foreground must stay light. Disambiguated by utility "
       + "KIND: a ground prefix means `surface`, a foreground prefix means `on-accent`. Ends when "
       + "the dark ground ships and the two resolve differently." },
  "ink-950": { roles: ["text-primary", "etch"],
    why: "⚠ TEXT and a SURFACE MARK share this ink. Disambiguated by utility KIND and by ALPHA: an "
       + "opaque foreground is `text-primary`, anything carrying an opacity modifier is `etch`. Both "
       + "invert on a dark ground, so they are not distinguished by that — they are separate roles "
       + "because one is READ and one is FELT, and the etch keeps a consumer-supplied weight where "
       + "text never does. Ends if the etch ever needs an ink the text does not." },
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
  shared.filter(([k]) => !MULTI_ROLE[k]).map(([k, rs]) => `${k}: ${rs.join(" + ")}`), []);
t("C2 …and every reason says WHEN IT ENDS, so a collision cannot become permanent by inattention",
  Object.entries(MULTI_ROLE).filter(([, v]) => !/Ends when|Ends if|ends when/.test(v.why)).map(([k]) => k), []);
/* ⚠ AND A STALE EXEMPTION IS THE OTHER DIRECTION. If the two roles diverge, this entry must go —
 * an exemption outliving its subject is what let a dead token survive a contrast floor in #330. */
t("C3 every recorded collision still collides — a stale one exempts a pair that already separated",
  Object.keys(MULTI_ROLE).filter((k) => (byRung[k] ?? []).length < 2), []);

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

console.log("\nG · ⚠ A PAIR MIGRATES WHOLE OR NOT AT ALL");

/* ⚠ THE GENERAL FORM OF THE ACCENT-BADGE DEFECT. An element that brings BOTH its ground and its
 * foreground is a self-contained surface, and the two halves must agree about whether they follow
 * the page. Migrating only the foreground puts a page-following text role on a ground that does not
 * follow — so under a dark page the element draws light text on a light box.
 *
 * `HeroCover`'s rating chip is the live instance and it is DEFERRED rather than migrated: its ground
 * is `cream-200`, which section D records as refused a role. It moves when that rung earns one.
 *
 * ⚠ AND THIS IS WHY THE ACCENT CASE WAS THE SAME BUG. There the ground was `bg-accent-500`, which
 * also does not follow the page — the only difference is that an accent ground is not in the ladder,
 * so the earlier guard could not see it. E2/E4 handle the accent ground; this handles the rest. */
const ROLE_FG = ["text-primary", "text-secondary", "text-lead"];
const ROLE_BG = ["surface", "surface-well", "background"];
const RAW_RUNGS = ["ink-950","ink-800","ink-600","ink-400","ink-200","cream-50","cream-100","cream-200","cream-300","canvas"];
const split = [];
let pairAttrs = 0;
for (const f of tsxFiles) {
  const rel = f.replace(new URL("../../", import.meta.url).pathname, "");
  if (/^components\/studio\/|^app\/studio\/|ProjectCardSvgs|illustrations\/index/.test(rel)) continue;
  for (const m of readFileSync(f, "utf8").matchAll(/className=(?:\{`|["`'])([\s\S]*?)(?:`\}|["`'])/g)) {
    const cls = m[1];
    const rawBg = RAW_RUNGS.filter((r) => new RegExp("\\b(?:bg|from|via|to)-" + r + "\\b(?!/)").test(cls));
    const roleFg = ROLE_FG.filter((r) => new RegExp("\\btext-" + r + "\\b").test(cls));
    const roleBg = ROLE_BG.filter((r) => new RegExp("\\b(?:bg|from|via|to)-" + r + "\\b").test(cls));
    const rawFg = RAW_RUNGS.filter((r) => new RegExp("\\btext-" + r + "\\b(?!/)").test(cls));
    if (rawBg.length || roleBg.length) pairAttrs++;
    /* a MIGRATED foreground on a RAW ground — the half-migrated pair */
    if (rawBg.length && roleFg.length) split.push(`${rel}: text-${roleFg[0]} on a raw bg-${rawBg[0]}`);
    /* and the mirror — a RAW foreground on a MIGRATED ground */
    if (roleBg.length && rawFg.length) split.push(`${rel}: raw text-${rawFg[0]} on bg-${roleBg[0]}`);
  }
}
console.log(`         ${pairAttrs} className attributes carry a ground`);
t("G0 the scan found grounds to check, against a literal", pairAttrs >= 20, true);
t("G1 ⚠ NO ELEMENT MIXES A MIGRATED HALF WITH A RAW ONE — under a dark page that inverts",
  [...new Set(split)].sort(), []);

console.log("\nH · ⚠ THE CONSTANTS — colours the role layer must NOT reach");

/* ---- ⚠ THE DISCRIMINATOR, WHICH IS THE PART THAT HAS TO SURVIVE WITHOUT CONTEXT ------------
 *
 * A component naming a rung because THE THING IT DEPICTS IS THAT COLOUR is a CONSTANT. A component
 * naming a rung because THAT IS WHERE IT HAPPENS TO SIT is a MIGRATION.
 *
 * ⚠ IN SOURCE THE TWO LOOK IDENTICAL. `bg-ink-950` on a phone bezel and `bg-ink-950` on a dark card
 * are the same six characters. Only the question "what is this drawing" separates them, which is
 * why a mechanical sweep cannot and a reader can — #383's sweep gave the bezel a TEXT role, and
 * under a dark ground the phone frame would have turned white.
 *
 * The same question separated the process diagram's accent OUTLINE (this site's hand sketching, so
 * it themes) from its FILLS (a wireframe of somebody else's product, so they do not). It is the
 * oldest discriminator in this project and it keeps arriving in new clothes.
 *
 * ---- WHY THIS IS A REGISTRY AND NOT A COMMENT ----------------------------------------------
 *
 * A constant with a reason written only at the site survives until someone runs the next sweep.
 * Listing them here means the next sweep has something to JOIN AGAINST, and H2 means a constant
 * that quietly gains a role fails rather than passing.
 *
 * ⚠ EACH ENTRY NAMES WHAT IT DEPICTS, not why it is exempt. "Excluded because it is artwork" is a
 * label; "a phone bezel is near-black because phones are" is a reason someone can disagree with. */
const CONSTANTS = {
  "components/case-study/DeviceImage.tsx": {
    rung: "ink-950 and the cream ladder, RAW ON BOTH HALVES",
    depicts: "a DEVICE — a phone bezel and a browser window. The frame is near-black because devices "
           + "are; the chrome bar is light because browser chrome is. #383 migrated the mock's "
           + "GROUNDS while leaving its dots and url pill raw, so on a dark page the bar would have "
           + "darkened and the dots vanished. A depicted object does not half-theme, so #386 "
           + "reverted the grounds rather than migrating the fills.",
  },
  "components/case-study/blocks/VideoEmbed.tsx": {
    rung: "ink-950 and the cream ladder, RAW ON BOTH HALVES",
    depicts: "the same browser window shape, deliberately — a video and a screenshot must read as "
           + "the same kind of object on the page, so they share the chrome and share this ruling.",
  },
  "components/case-study/blocks/HeroCover.tsx": {
    rung: "on-dark",
    depicts: "text that ALWAYS sits on the dark hero band. Naming the dark vocabulary there is not "
           + "a component choosing its context — it is a component that has only one.",
  },
  "components/case-study/SectionRenderer.tsx": {
    rung: "on-dark",
    depicts: "the same dark band, for the same reason — the quote band's identity line and numeral.",
  },
  "components/sections/ProjectCardSvgs.tsx": {
    rung: "several",
    depicts: "ILLUSTRATIONS of four products. 77 of the site's 82 SVG colour attributes live here; "
           + "the file's purpose is depiction, so it is excluded whole rather than attribute by "
           + "attribute.",
  },
  "components/case-study/illustrations/index.tsx": {
    rung: "several",
    depicts: "the Fosfor diagrams — a product's own interface being drawn, not this site's.",
  },
};

/* ⚠ AND THE REGISTRY MUST DESCRIBE REAL FILES. A path that stopped existing would exempt nothing
 * while reading like protection — the stale-exemption shape, four sections in a row. */
const missing = Object.keys(CONSTANTS).filter((f) => {
  try { readFileSync(new URL("../../" + f, import.meta.url), "utf8"); return false; } catch { return true; }
});
console.log(`         ${Object.keys(CONSTANTS).length} files hold colours the role layer must not reach`);
t("H0 every declared constant file exists — a stale path exempts nothing and reads like protection",
  missing, []);
t("H1 ⚠ EVERY ENTRY SAYS WHAT IT DEPICTS — 'excluded because artwork' is a label, not a reason anyone can disagree with",
  Object.entries(CONSTANTS).filter(([, v]) => !v.depicts || v.depicts.length < 40).map(([k]) => k), []);
/* ⚠ THE ONE THAT WOULD HAVE CAUGHT #383. The bezel file must still name its rung raw; if a future
 * sweep gives it a role, this goes red instead of the phone turning white on a dark page. */
t("H2 ⚠ THE BEZEL STILL NAMES ITS RUNG RAW — a sweep that gives it a role fails here rather than in a render",
  /bg-ink-950/.test(readFileSync(new URL("../../components/case-study/DeviceImage.tsx", import.meta.url), "utf8")), true);
t("H3 …and the on-dark constants still name the dark vocabulary rather than a page-following role",
  ["components/case-study/blocks/HeroCover.tsx", "components/case-study/SectionRenderer.tsx"]
    .filter((f) => !/on-dark/.test(readFileSync(new URL("../../" + f, import.meta.url), "utf8"))), []);

console.log("\nI · ⚠ NO COMPONENT CHOOSES BY GROUND — the acceptance test, fired and passed");

/* ⚠ THIS ROW PINNED THE COUNT AT ONE AND NOW PINS IT AT ZERO, WHICH IS THE TEST WORKING RATHER
 * THAN THE TEST BEING EDITED. `PullQuote` picked `on-dark-quote` or `accent-600` from a `dark`
 * prop — the one true violation of "a component may choose what KIND of thing it is, never WHERE
 * it lives". #385 could not repair it: the dark band was applied inline with no context attribute
 * to override against, so collapsing the branch would have repainted the band's quote. It was
 * pinned instead, with the failure condition explicit — if the branch could not disappear when the
 * ground switch landed, shape C had failed and that was to be SAID rather than patched.
 *
 * ⚠ IT DISAPPEARED, AND WITHOUT THE NEW ROLE THE REPAIR SEEMED TO NEED. The obvious fix was a
 * `quote` role resolving per ground. Unnecessary: the prop was MISNAMED rather than misconceived.
 * The variant is a full-bleed quote BAND — a kind of quote, chosen when it is a section's sole
 * block — and a band is always dark, so `on-dark-quote` there is a CONSTANT of the variant. A
 * COMPONENT WITH ONLY ONE GROUND IS NOT CHOOSING, which is the rule `HeroCover` already sat under.
 *
 * The row stays rather than being deleted: it is the assertion that catches the NEXT component
 * reaching for a ground flag, and a zero it can no longer reach is what makes it falsifiable. */
const chooseByGround = [];
for (const f of tsxFiles) {
  const rel = f.replace(new URL("../../", import.meta.url).pathname, "");
  if (/^components\/studio\/|^app\/studio\//.test(rel)) continue;
  const src = readFileSync(f, "utf8");
  const body = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
  /* a component BRANCHING on a ground flag AND naming a dark-vocabulary colour in code */
  if (!/\bdark\s*[?&]|\bdark\s*=\s*false|if\s*\([^)]*\bdark\b/.test(body)) continue;
  if (!/on-dark/.test(body)) continue;
  chooseByGround.push(rel);
}
console.log(`         ${chooseByGround.length} component(s) branch on a ground flag AND name a dark colour`);
t("I1 ⚠ ZERO COMPONENTS CHOOSE BY GROUND — the context resolves it, which is the whole of shape C",
  chooseByGround.sort(), []);
/* ⚠ AND THE DENOMINATOR, because a zero is exactly what an empty scan reports. */
t("I1a the scan read real files, against a literal", tsxFiles.length >= 50, true);
t("I2 …and PullQuote records how it was resolved, so the next reader meets the reasoning",
  /THE ACCEPTANCE TEST FIRED, AND IT PASSED/.test(
    readFileSync(new URL("../../components/case-study/blocks/PullQuote.tsx", import.meta.url), "utf8")), true);

console.log("\nJ · ⚠ AND A PAIR SPLIT ACROSS PARENT AND CHILD");

/* ⚠ SECTION G's VOCABULARY WAS NARROWER THAN ITS CONCEPT — THE THIRD TIME AT THIS BOUNDARY. G reads
 * ONE className, so it sees a ground and a foreground only when they sit on the same element. The
 * browser mock puts the ground on a parent and the dots on its children, and G was green while the
 * bar moved with the page and the dots did not.
 *
 * The earlier two: the accent-ground guard recognised grounds only from the cream/ink ladder, and
 * E2 read `className` while two of its four subjects lived in style objects. THREE FAILURES AT THE
 * SAME SEAM — a rule stated about ELEMENTS and implemented against ATTRIBUTES.
 *
 * A window of following lines is coarse and deliberately so: it reports candidates a person judges,
 * and it is the only shape that reaches a parent/child split in flat source. */
const nested = [];
let groundsSeen = 0;
for (const f of tsxFiles) {
  const rel = f.replace(new URL("../../", import.meta.url).pathname, "");
  if (/^components\/studio\/|^app\/studio\/|ProjectCardSvgs/.test(rel)) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((ln, i) => {
    if (!/\b(?:bg|from|via|to)-(?:surface|surface-well|background)\b/.test(ln)) return;
    groundsSeen++;
    const win = lines.slice(i + 1, i + 12);
    const raw = win.filter((l) => /\b(?:bg|from|via|to)-(?:ink-950|cream-\d+|canvas)\b/.test(l));
    if (raw.length) nested.push(`${rel}:${i + 1} — a migrated ground with ${raw.length} raw fill(s) beneath it`);
  });
}
console.log(`         ${groundsSeen} migrated grounds scanned for raw fills beneath them`);
t("J0 the scan found grounds, against a literal", groundsSeen >= 10, true);
t("J1 ⚠ NO MIGRATED GROUND HAS A RAW FILL INSIDE IT — the browser mock's bar moved while its dots did not",
  [...new Set(nested)].sort(), []);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
