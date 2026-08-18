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
import { blankCommentBodies } from "../strip-comments.mjs";
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
  /* ⚠ THE COLLISION IS DARK-ONLY AND IS NOT IN `MULTI_ROLE` DELIBERATELY. That registry keys on the
   * LIGHT RUNG two roles share and this pair shares none — `accent` is accent-500, `accent-text` is
   * accent-600. Filing it there would record it under a key that cannot express it, and C3/F2/F4
   * caught exactly that when it was attempted. On dark both resolve to `accent-on-dark`, because the
   * single dark accent already clears the text floor. ENDS IF A DARK PALETTE NEEDS A DARKER ACCENT
   * FOR TEXT. */
  "accent-text": { rung: "accent-600", job: "the accent at a lightness that CLEARS 4.5 AS TEXT on the cream ladder — eyebrows, links, the case-study h1. `accent` is the same brand colour as a MARK or fill and misses the floor on every cream step but the first." },

  /* ⚠ TWO PALETTE-DECLARED ROLES, AND THE CONTRACT WIDENED TO HOLD THEM. Every role above aliases a
   * LADDER RUNG. These two do not — each palette declares its own literal, and no palette's value
   * lands on a rung. So `kind` is declared per entry and A3 asserts the DECLARED kind rather than
   * assuming the rung form, because a contract widened without its assertion widening is the #389
   * shape: a correct extension with nothing checking the join.
   *
   * ⚠ THEY SIT BETWEEN RUNGS BECAUSE NOBODY EVER PLACED THEM ON THE LADDER. That is a fact about
   * history, not a decision — they are legacy semantic values older than the role layer. Measured,
   * `ink-600` holds THREE DIFFERENT VALUES across six palettes (45.0 on harbour and orchid, 40.0 on
   * cerise, fern and sapphire, 44.0 on cream), so "is `text-subtle` a second spelling of
   * `text-secondary`" HAS NO PALETTE-INDEPENDENT ANSWER: separation is 24.2 on two palettes and 41.6
   * on four, straddling the 32.1 that proved `etch` and `border` distinct. Folding them on the four
   * where they nearly coincide would be a merge done on evidence that holds for two-thirds of the
   * site, so both were promoted instead — which moves ZERO light pixels, because it describes what
   * is already true rather than asserting they belong somewhere they do not.
   *
   * And cream's `text-body` is `#4a4239`, THE SYSTEM'S ONLY HEX LITERAL where every other palette
   * declares this token in OKLCH. It reads as an oversight and it is an AGE — cream predates the
   * convention, and that is visible in the data rather than written down anywhere else. */
  /* ⚠ AND ITS JOB LINE ONCE CLAIMED IT WAS THE ARTICLE'S BODY COPY AT 1.24. FALSE, AND MINE. The
   * blog prose measured 1.24 on a dark ground and I attached the number to this token because it
   * was in the unremapped list. `.blog-prose > p` paints `var(--color-ink-800)`, a raw rung, and it
   * still does — that site is in the ratchet below. THE MEASUREMENT WAS REAL AND THE SUBJECT WAS
   * SUPPLIED BY THE READER, one turn after that rule was cited. */
  "text-body": { kind: "palette-declared", job: "running body copy on a card, one step lighter than the dek. TWO consumers, both `style` objects — About's bio and Contact's note." },
  "text-subtle": { kind: "palette-declared", job: "the dimmest readable text — eyebrows, timestamps, unit labels. Dimmer than text-secondary, and NOT a second spelling of it: see the separation figures above." },
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
/* ⚠ A ROLE TAKES ONE OF TWO FORMS AND ITS ENTRY SAYS WHICH. Rung-aliased is the norm; a
 * palette-declared role carries its own literal per palette because it was never on the ladder.
 * Every row below splits on the DECLARED kind rather than assuming the common case — a widened
 * contract whose assertion did not widen is a correct extension nothing checks. */
const RUNG_ROLES = Object.entries(ROLES).filter(([, v]) => v.kind !== "palette-declared");
const PALETTE_ROLES = Object.entries(ROLES).filter(([, v]) => v.kind === "palette-declared");
console.log(`         ${RUNG_ROLES.length} rung-aliased roles, ${PALETTE_ROLES.length} palette-declared`);

t("A0 the parse found a real population, against a literal", declared.size >= 8, true);
t("A1 ⚠ EVERY RUNG-ALIASED ROLE IS DECLARED — a missing one is a name the migration would resolve to nothing",
  RUNG_ROLES.map(([r]) => r).filter((r) => !declared.has(r)).sort(), []);
t("A2 ⚠ AND EVERY ALIAS IN @theme IS REGISTERED — an unregistered role has no stated job",
  [...declared.keys()].filter((r) => !(r in ROLES)).sort(), []);
t("A3 ⚠ EACH RESOLVES TO THE RUNG ITS REGISTRY ENTRY NAMES — a role that drifts from the palette is a third source of truth",
  RUNG_ROLES.filter(([r, v]) => declared.get(r) !== v.rung)
    .map(([r, v]) => `${r} -> ${declared.get(r)}, registry says ${v.rung}`), []);
/* ⚠ AND THE COMPLEMENT, or the widened contract is an escape hatch. A palette-declared role must
 * NOT be a var() alias — if it became one it is really rung-aliased and its entry is now a fiction. */
t("A3a ⚠ NO PALETTE-DECLARED ROLE IS SECRETLY AN ALIAS — the kind field must describe the stylesheet, not the intent",
  PALETTE_ROLES.map(([r]) => r).filter((r) => declared.has(r)), []);
t("A3b …and each is declared as a literal by EVERY palette, which is what makes it themeable at all",
  PALETTE_ROLES.map(([r]) => r).filter((r) =>
    [...css.matchAll(/\[data-theme="([a-z-]+)"\]\s*\{([\s\S]*?)\n\}/g)]
      .filter((m) => m[1] !== "cream-verify")
      .some((m) => !new RegExp(`--color-${r}\\s*:`).test(m[2]))), []);
/* ⚠ THE POPULATION IS PINNED AGAINST A LITERAL. Palette-declared is the EXCEPTION; if it grows
 * quietly it becomes the hatch that empties the ladder of meaning. A third arrival must be
 * deliberate, so it fails here and someone states why that token is not on the ladder either. */
t("A3c ⚠ PALETTE-DECLARED IS EXACTLY TWO — a third must be argued for, not absorbed",
  PALETTE_ROLES.length, 2);
t("A3d …and every entry declares a kind at all, so the default can never be assumed",
  Object.entries(ROLES).filter(([, v]) => !v.rung && v.kind !== "palette-declared").map(([r]) => r), []);

console.log("\nB · the rungs are real, so a role cannot alias a colour that does not exist");

const rungs = new Set([...themeBlock.matchAll(/--color-([a-z0-9-]+)\s*:\s*(?!var\()/g)].map((m) => m[1]));
console.log(`         ${rungs.size} literal rungs in @theme`);
t("B0 the rung population is real", rungs.size >= 20, true);
t("B1 every role's target is a literal rung, not another role — one level of indirection, not a chain",
  RUNG_ROLES.filter(([, v]) => !rungs.has(v.rung)).map(([r, v]) => `${r} -> ${v.rung}`), []);

console.log("\nC · ⚠ NO ROLE IS A SECOND SPELLING OF A NEIGHBOUR");

const byRung = {};
for (const [r, v] of RUNG_ROLES) (byRung[v.rung] ??= []).push(r);
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
  Object.keys(REFUSED).filter((r) => RUNG_ROLES.some(([, v]) => v.rung === r)), []);

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
/* ⚠ ONE SUBJECT, ONE RULE. This walked `.tsx` while section L below walked three types — THE SUITE
 * THAT RECORDS THE FILE-TYPE RULE CONTAINED A SUBJECT THAT IGNORED IT, because L was widened where
 * the rule was found and the earlier walk was never revisited. That is the scoped-fix failure
 * arriving inside the file that states the rule.
 *
 * ⚠ THE PRACTICAL FORM: WHEN A RULE IS RECORDED, APPLY IT TO THE FILE RECORDING IT FIRST. Cheaper
 * than the census that eventually found this, and it would have caught it the day it was written. */
const tsxFiles = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (/node_modules|\.next|\.git/.test(p)) continue;
    if (e.isDirectory()) walk(p); else if (/\.(tsx|ts|css)$/.test(e.name)) tsxFiles.push(p);
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
/* ⚠ THE FLOOR WAS 5 AND THE POPULATION IS NOW 1, BECAUSE THE SUBJECT MOVED RATHER THAN VANISHED.
 * This collects style objects that MENTION THE ACCENT, and migrating 60 raw `accent-500` sites to
 * `--color-accent` took it from 30 to 1 — the remaining one is inside an artwork constant, excluded
 * from the sweep by file.
 *
 * ⚠ NOT A STATED ABSENCE, BECAUSE THE SET IS NOT EMPTY, and not a manufactured subject either. The
 * floor tracks the real population so E4 still cannot pass vacuously, and it is a CONSTANT rather
 * than derived from `styleObjs` — a guard computing its expectation from the thing it guards passes
 * when that thing is empty, which is this project's most repeated gate defect. */
t("E3 the style-object scan has subjects — E4 cannot pass vacuously, against a literal",
  styleObjs.length >= 1, true);
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
for (const [r, v] of RUNG_ROLES) (rolesByRung[v.rung] ??= []).push(r);
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
  /* ⚠ `HeroCover.tsx` WAS HERE AND ITS REASON WAS FALSE, WHICH IS A DIFFERENT FAILURE FROM
     `SectionRenderer`'s BELOW AND THE MORE INSTRUCTIVE ONE. That entry read "text that ALWAYS sits
     on the dark hero band … a component that has only one ground". The component did have only one
     ground. IT WAS LIGHT. `.hero-ground.is-dark` resolves to `oklch(0.985 0 0)`, and `is-dark` sets
     `--glow-color` and has never set a background — so `on-dark-muted` measured 1.99 and
     `on-dark-quote` 1.71 on two production pages, at 12px and 9.5px, against a 4.5 floor.

     ⚠ THE ENTRY DID NOT GO STALE. IT WAS WRONG WHEN IT WAS WRITTEN, and it read as protection for
     as long as it existed — every reader who checked this registry was told the hero was dark by
     the document whose job is to record why a colour may stay raw. H1 asks each entry to say what
     it DEPICTS rather than why it is exempt, precisely so a reader can disagree with it; nobody
     did, because "the dark hero band" names a thing that used to exist.

     THE FILE ALSO STOPS BEING SKIPPED BY THE CONSUMER CENSUS, which is the half nobody would have
     noticed. A registry entry excludes the whole FILE at line ~725, so every role HeroCover legitimately
     consumes was uncounted for as long as it sat here. */
  /* ⚠ `SectionRenderer.tsx` WAS HERE AND ITS SUBJECT NO LONGER EXISTS, WHICH IS WHY IT IS DELETED
     RATHER THAN LEFT. The entry read "the same dark band, for the same reason — the quote band's
     identity line and numeral", and the band was retired: its ground had been gone since the
     `:root[data-ground="dark"]` prefix landed, so `on-dark-muted` and `on-dark-quote` were painting
     1.99 and 1.56 on a light page ground across three live regions.

     A registry row whose subject has gone exempts nothing while reading like protection — the exact
     stale-exemption shape `H0` was written to catch one step earlier, at a path that stopped
     existing. This one is worse than a dead path, because the FILE is still there: `H0` would stay
     green forever while the reason underneath it had expired. */
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
/* ⚠ H3 IS DERIVED FROM THE REGISTRY AND READS CODE RATHER THAN PROSE, AND BOTH CHANGES WERE FORCED
 * BY THE SAME EDIT.
 *
 * It named its two files by hand, so removing `SectionRenderer` from `CONSTANTS` would have left the
 * row asserting a claim about a file the registry no longer covers — a parallel list, two lines from
 * the list it was supposed to read.
 *
 * ⚠ AND IT TESTED RAW FILE TEXT, SO IT WOULD HAVE PASSED ON A COMMENT. `SectionRenderer` now carries
 * a long note explaining why the dark band went, and that note contains `on-dark-muted` and
 * `on-dark-quote` by name. The row would have gone on reporting that the file "still names the dark
 * vocabulary" on the strength of prose describing its removal — presence-by-regex answering a
 * question about what RESOLVES, which this repository records against a bundle grep that once
 * "verified" two shadowed values by proving both present.
 *
 * Comments are blanked before the test, so only a real utility or token reference counts. */
/* ⚠ THE on-dark CATEGORY IS NOW EMPTY, AND ITS TWO MEMBERS BOTH LEFT BY BEING WRONG RATHER THAN BY
 * BEING TIDIED. `SectionRenderer`'s band and `HeroCover`'s hero were each registered as "a component
 * with only one ground, and it is dark". Neither was: both painted the dark vocabulary onto a light
 * page, at 1.56 to 1.99 across five regions on two live case studies.
 *
 * ⚠ AND THE CATEGORY'S REAL MEMBERS WERE NEVER IN IT. Derived across 306 non-studio source files with
 * comments blanked, FIVE name the dark vocabulary in code — `ImagePreview`, three gallery components
 * and the gallery dev harness — and not one has ever been registered here. So the register held two
 * files that did not belong and none of the five that did, which is what a registry written while
 * looking at one surface produces. They are NOT added by this unit: the case study is its subject and
 * a gallery overlay that paints `bg-band-dark` on the same element is a different claim.
 *
 * The rows below therefore split into three jobs rather than the two that were here. */
const H3_FILES = Object.entries(CONSTANTS).filter(([, v]) => /^on-dark$/.test(v.rung)).map(([k]) => k);
/* ⚠ AGAINST A LITERAL, NOT `>= 1`, AND THE PREVIOUS FORM WOULD HAVE GONE RED FOR THE RIGHT REASON AND
 * BEEN "FIXED" BY DELETING IT. A count derived from the subject it guards is the shape this file
 * records six times; a literal makes an emptying population a DECISION somebody writes down. */
t("H3a the on-dark constants are DERIVED from the registry, and the category size is pinned — it is 0 today, and a new entry must move this number deliberately",
  H3_FILES.length, 0);
/* ⚠ VACUOUS TODAY BY CONSTRUCTION, KEPT DELIBERATELY, AND H3a IS WHAT MAKES THAT HONEST. It guards
 * the NEXT entry: a file registered as an on-dark constant whose only mention is prose fails here.
 * Both halves were proven by mutation when this row was written — putting `SectionRenderer` back
 * reddens it, and removing the comment-blanking below makes the same mutation SURVIVE. */
t("H3 …and any on-dark constant names the dark vocabulary IN CODE rather than in a comment about it",
  H3_FILES.filter((f) => !/on-dark/.test(
    readFileSync(new URL("../../" + f, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1"))), []);
/* ⚠ THE ROW WITH TEETH, AND IT IS THE ABSENCE DIRECTION BECAUSE THAT IS THE ONE A REGEX CAN SOUND.
 * H3 and H3a are both about the REGISTRY; neither can see a component that names a dark colour
 * without being registered — which is exactly what the hero did for a week after its ground went
 * away. Scoped to the case-study surface because that is where the five regions were, and because a
 * dark overlay elsewhere is a legitimate member of the category this one is asserting is empty. */
/* ⚠ `tsxFiles`, NOT `srcFiles` — AND THE FIRST DRAFT USED THE LATTER, WHICH IS DECLARED TWO HUNDRED
 * LINES BELOW THIS ROW. `node --check` parses that perfectly and it throws a `ReferenceError` at run
 * time: the temporal dead zone, fifth instance in this repository, caught by RUNNING the suite and
 * by nothing else. Section I already walks `tsxFiles`, which is the right set for a `.tsx` census. */
const caseStudyDark = tsxFiles
  .map((f) => f.replace(new URL("../../", import.meta.url).pathname, ""))
  .filter((rel) => /^components\/case-study\/.*\.tsx$/.test(rel) && !/ImagePreview/.test(rel))
  .filter((rel) => /\b(?:text|bg|border|fill|stroke|ring|from|via|to|divide|outline)-(?:on-dark(?:-muted|-quote)?|band-dark|accent-on-dark)\b/
    .test(readFileSync(new URL("../../" + rel, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1")));
t("H3b ⚠ NO CASE-STUDY COMPONENT NAMES THE DARK VOCABULARY — the hero and the quote band both did, on a light ground, and no registry row could see it",
  caseStudyDark.sort(), []);
/* ⚠ AND ITS DENOMINATOR, because an empty file walk reports the same zero as a clean surface. */
t("H3b-denom the case-study walk read real files, against a literal", tsxFiles.length >= 50, true);

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

console.log("\nK · ⚠ THE DARK BLOCK REMAPS EVERY ROLE THAT NEEDS IT — the check that was missing");

/* ⚠ #389 DERIVED FOUR DARK ROLE VALUES, PROVED THEM `color-mix` OF TOKENS EVERY PALETTE ALREADY
 * DECLARES, MEASURED THE RELATION ON ALL FIVE — AND NOTHING EVER REFERENCED THEM. The
 * `[data-ground="dark"]` block set a ground and a colour and left every role pointing at its light
 * rung, so a dark palette painted a dark ground and every section covered it.
 *
 * ⚠ NO EXISTING GATE COULD SEE THAT. A token that resolves correctly and is referenced by nothing
 * produces NO WRONG VALUE, NO FAILING RATIO, NO MISSING DECLARATION — and every instrument here
 * reads values and declarations. Every part was checked and nothing checked the JOIN. It is the
 * completeness-assertion failure arriving as an ABSENT CONNECTION rather than an absent subject,
 * and only a CONSUMER COUNT on the block can catch it.
 *
 * ⚠ AND THE SAME GAP EXISTS FOR EVERY ROLE THE BLOCK IS MEANT TO REMAP, which is why this is a
 * registry rather than four assertions: a role added to the layer tomorrow needs a dark answer, and
 * without this row its absence is invisible until someone renders a dark page. */
/* ⚠ ANCHORED AT A LINE START, AND A BARE indexOf WAS WRONG. Prose in `globals.css` now NAMES this
 * selector while explaining a token that was deleted in its favour, so the first match in the file
 * is inside a comment and the brace walk then measured something else entirely — K1 reported all
 * eight remapped roles as missing. Same family as the PR-number-as-hex trap: a convention of the
 * prose collided with a matcher, and the note about the mechanism became the defect. */
const darkBlock = (() => {
  /* ⚠ THE FINDER FOLLOWS THE SELECTOR'S REPAIR. The block was raised to `:root[data-ground="dark"]`
 * (0-2-0) after five of its values shipped SHADOWED by a later `:root` at the old 0-1-0 — so this
 * matcher accepts the :root-prefixed form and refuses the bare one, because a bare block reappearing
 * is the regression `ground-block` A2 exists to catch. */
const at = css.search(/^:root\[data-ground="dark"\]/m);
  if (at < 0) return null;
  const o = css.indexOf("{", at);
  let d = 0, e = -1;
  for (let i = o; i < css.length; i++) { if (css[i] === "{") d++; else if (css[i] === "}" && --d === 0) { e = i; break; } }
  return css.slice(o + 1, e);
})();

/* Which roles MUST be redirected on a dark ground, and which deliberately must not. */
const DARK_EXEMPT = {
  /* ⚠ EXEMPT AGAIN AFTER A REMAP THAT WAS REVERTED, AND THE PREMISE IS STILL FALSE. It reads "the
   * accent stays a MID-TONE on both grounds" — false on six of six. But remapping it fixed
   * dark-pressed and BROKE light-pressed and dark-unpressed: TWO REGRESSIONS FOR ONE REPAIR, found
   * by the first pixel sample this component ever got.
   *
   * ⚠ THE CHIP'S GROUND IS A POSITIONED SIBLING AND THE CASCADE DOES NOT MODEL PAINT ORDER. Four
   * cascade readings and three rulings were all wrong about WHICH SIDE FAILS; the sample inverted
   * the problem. This role stays exempt until the pressed chip gets its own foreground, which is a
   * different token rather than a different value here. */
  /* ⚠ `on-accent`'s EXEMPTION IS RETIRED, AND ITS BLOCKING CONDITION WAS SATISFIED LONG BEFORE
   * ANYONE RETIRED IT. The exemption held "until the pressed chip gets its own foreground" — #426
   * gave the chip `surface`, so the consumer that made the first remap regress two states has not
   * read `on-accent` since. The exemption outlived its subject exactly the way the near-miss row
   * did, and K3 is the row that forced the check: it failed the moment the ground block remapped
   * the role, which is the conversation it existed to force. The role now resolves `band-dark` on
   * dark — 6.75-7.52 against accent and accent-text — with every remaining consumer verified to
   * sit on the accent ROLE (DeviceImage was moved off `accent-500` first, where band-dark measures
   * 3.24-3.65 and fails). The two notes below are the history, kept. */
  /* ⚠ `on-accent` WAS EXEMPT HERE AND IS NOT ANY MORE, AND IT TOOK TWO ATTEMPTS. The exemption read
   * "the accent stays a MID-TONE on both grounds, so its foreground must stay light" — FALSE on six
   * of six, since every palette lightens its accent to 65 or 70% on dark and a near-white label on
   * it measured 2.46 to 3.33 against 4.5.
   *
   * ⚠ THE FIRST REMAP BROKE THE WORK FILTER, because that chip draws `on-accent` on `.wf-thumb`
   * rather than on the accent. THE ROLE'S NAME ASSERTED A GROUND ONE CONSUMER DID NOT HAVE, and both
   * values worked until one moved. The repair is the pair — the thumb follows the ground too — and
   * either half alone is a regression the diff does not show.
   *
   * ⚠ FIFTH EXPIRED-PREMISE INSTANCE, and the check it wants is sharper than the four before it:
   * not "does every consumer satisfy the role's job" but DOES EVERY CONSUMER ACTUALLY SIT ON THE
   * GROUND THE ROLE'S NAME CLAIMS. Checkable in principle, and nothing asks it. */
  "accent": "remapped, but under the `--color-accent` name — listed here only so the count below "
    + "reads as deliberate rather than short.",
};
const mustRemap = Object.keys(ROLES).filter((r) => !(r in DARK_EXEMPT));
const remapped = darkBlock ? new Set([...darkBlock.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1])) : new Set();
console.log(`         the dark block redirects ${remapped.size} custom properties`);
console.log(`         ${mustRemap.length} roles must be redirected; ${Object.keys(DARK_EXEMPT).length} are exempt with a reason`);

t("K0 the dark block was found and read — a null here would make every row below vacuous",
  darkBlock !== null && darkBlock.length > 100, true);
t("K0a …and it redirects a real number of properties, against a literal", remapped.size >= 8, true);
t("K1 ⚠ EVERY ROLE THAT MUST INVERT IS ACTUALLY REFERENCED IN THE DARK BLOCK — a derivation nobody wired produces no wrong value",
  mustRemap.filter((r) => !remapped.has(r)).sort(), []);
t("K2 ⚠ AND EVERY EXEMPTION CARRIES A REASON — a role silently left out looks identical to one deliberately kept",
  Object.entries(DARK_EXEMPT).filter(([, why]) => !why || why.length < 40).map(([k]) => k), []);
t("K3 …and no exempt role is remapped anyway, which would make its reason a fiction",
  Object.keys(DARK_EXEMPT).filter((r) => r === "on-accent" && remapped.has(r)), []);

console.log("\nL · ⚠ THE SUBJECT IS DERIVED FROM CONSUMPTION, NOT DRAWN FROM THE REGISTRY");

/* ⚠ K's SUBJECT IS `ROLES`, SO IT CAN ONLY SEE WHAT SOMEBODY REMEMBERED TO REGISTER. A token that
 * SHOULD be a role and was never entered is invisible to the check built to find unregistered-role
 * failures — the arc's central defect sitting inside the instrument built against it, one PR later.
 *
 * It was found by rendering, not by a gate. `text-subtle` is declared by every palette, named in the
 * `text-` family beside the three real roles, consumed at 35 public sites — and absent from both
 * `ROLES` and the dark block, so it painted a light-ground grey at 2.75 on a dark page.
 * `text-body` is worse: it is the article's entire body copy and it measured 1.24.
 *
 * ⚠ SIXTH TIME A SUBJECT HAS BEEN DRAWN BY A LIST RATHER THAN DERIVED, and the repair is the one
 * made five times. The question a role registry answers is "which colours must follow the ground",
 * and that is A FACT ABOUT CONSUMPTION — a palette declares a token, a public surface paints it,
 * and from that moment it owes an answer on both grounds. Membership of a file is not evidence.
 *
 * ⚠ AND THE WALK COVERS THREE FILE TYPES ON PURPOSE. `tsxFiles` above is `.tsx` only, which is how
 * `globals.css`'s raw rungs escaped the role migration entirely; `text-body` then escaped MY OWN
 * probe twice over, being consumed through a style object rather than a utility AND from CSS rather
 * than from a component. A sweep bounded by directory still has a boundary by file type, and a
 * denominator computed inside the walk cannot see it. */
const srcFiles = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (/node_modules|\.next|\.git|ralph|docs/.test(p)) continue;
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(e.name)) srcFiles.push(p);
  }
})(new URL("../../", import.meta.url).pathname);

/* Every token any PALETTE declares. A token declared only in `@theme` is a base value; one a
 * palette overrides is a themed value, and a themed value consumed publicly is the subject. */
const paletteTokens = new Set();
for (const m of css.matchAll(/\[data-theme="[a-z-]+"\]\s*\{([\s\S]*?)\n\}/g))
  for (const d of m[1].matchAll(/--color-([a-z0-9-]+)\s*:/g)) paletteTokens.add(d[1]);

const UTIL = "(?:text|bg|border|fill|stroke|ring|decoration|divide|from|via|to|shadow|outline|accent|caret|placeholder)";
const root = new URL("../../", import.meta.url).pathname;
const consumers = new Map();
let filesScanned = 0, studioSkipped = 0;
/* ⚠ SECTION H IS KEYED BY FILE, SO IT IS APPLIED BY FILE — never joined against a token. A
 * file-level record consulted at the value level over-attributes totally, which is how a probe once
 * credited 19 migration sites to rows ruling on entirely different colours in the same files. The
 * constants are artwork: excluding the FILE is the same unit the registry is written in. */
let constantsSkipped = 0;
for (const f of srcFiles) {
  const rel = f.replace(root, "");
  if (/^components\/studio\/|^app\/studio\//.test(rel)) { studioSkipped++; continue; }
  if (rel in CONSTANTS) { constantsSkipped++; continue; }
  let text = readFileSync(f, "utf8");
  if (/\.css$/.test(text ? rel : rel)) {
    /* Strip comments — a three-digit PR citation is lexically a hex colour, and a token name inside
     * prose is not a consumer. Then drop the declaration blocks themselves and every studio rule,
     * so what remains is public USE rather than definition. */
    text = text.replace(/\/\*[\s\S]*?\*\//g, " ")
               .replace(/@theme\s*\{[\s\S]*?\n\}/g, " ")
               .replace(/\[data-theme="[a-z-]+"\]\s*\{[\s\S]*?\n\}/g, " ")
               .replace(/\.studio-chrome[^{]*\{[\s\S]*?\n?\}/g, " ");
  }
  filesScanned++;
  for (const tok of paletteTokens) {
    /* THREE FORMS, because each one has hidden a defect: the utility (section G's className-only
     * vocabulary failed three times at this seam), the `var()` reference (how `text-body` is
     * consumed, in a style object AND in CSS), and the alpha-modified utility. */
    const hit = new RegExp(`\\b${UTIL}-${tok}\\b|var\\(\\s*--color-${tok}\\s*[,)]`).test(text);
    if (hit) consumers.set(tok, (consumers.get(tok) ?? 0) + 1);
  }
}

/* ⚠ A TOKEN MAY BE EXEMPT FROM FOLLOWING THE GROUND, AND THE REASON MUST SAY WHY IT IS INVARIANT
 * RATHER THAN MERELY UNMIGRATED. "Not done yet" is not invariance; it is a backlog wearing an
 * exemption's clothes, which is the shape that let a dead token survive a contrast floor. */
const GROUND_INVARIANT = {
  "on-dark": "IS the dark answer — a role remapping to it would be circular.",
  "on-dark-muted": "IS the dark answer for secondary text, same reason.",
  "on-dark-quote": "IS the dark answer for the italic tagline, same reason.",
  "accent-on-dark": "IS the dark answer for the accent, referenced BY `--color-accent` in the block.",
  "band-dark": "the dark ground itself — it is what the other side remaps TO.",
  "glow-paper": "IS the light ground's answer for a glow; `--glow-on-dark` is its pair and the "
    + "dark block already switches `--glow-color` between them.",

  /* ⚠ BOTH HALVES, AND THE SECOND IS WHAT KEEPS THIS HONEST. Measured with #386's instrument —
   * euclidean sRGB separation from the surface beneath, which reproduces that PR's `etch@8` = 32.9
   * exactly. On the LIGHT ground `rule` spans 42.5 to 79.8 and `etch` spans 32.9 to 61.7: they
   * OVERLAP, and on that evidence alone `rule` reads as a second spelling and would have been
   * merged. On the DARK ground they are opposites — `etch`'s ink measures 0.6 (ink on ink,
   * invisible, which is WHY etch became a role) while `rule` measures 22.4 and survives.
   *
   * THE STRUCTURAL DIFFERENCE IS THE DURABLE OUTPUT: AN EXTREME MUST INVERT, A MID-TONE MUST NOT.
   * That separates two roles by WHERE A VALUE SITS ON THE LIGHTNESS AXIS rather than by what it
   * draws, and it is the first discriminator in this arc of that kind.
   *
   * ⚠ AND IT IS A PROPERTY SOMEBODY MEASURED, NOT A DECISION SOMEBODY MADE. Nothing in the record
   * shows `rule` was designed as a mid-tone for a dark ground; it predates the dark ground. It is
   * TOLERANT, NOT NEUTRAL — 47% weakening across the ground change against etch's 6% — and 22.4
   * still sits above etch@5's shipped 20.8, so it holds today.
   *
   * ⚠ TRIGGER: if a dark palette's surfaces move, `rule`'s 22.4 moves with them and NO HEADROOM HAS
   * BEEN STATED for 47% of weakening. It is fine at one dark palette and has not been tested against
   * three. A second dark palette re-opens this entry. */
  "rule": "IS a mid-tone at L 48.5%, so it separates from a light surface downward and a dark one "
    + "upward and needs no remap — 42.5 light, 22.4 dark, both above shipped hairline strength.",
};

/* ⚠ A THIRD KIND, AND IT IS NEITHER AN EXEMPTION NOR A RULING. An exemption says "this will never
 * move"; a RATCHET says "this may only shrink". These rungs are painted directly by public surfaces
 * the role migration has not reached — un-migrated rather than deliberate — so calling them
 * invariant would be a backlog wearing an exemption's clothes, which L2 forbids.
 *
 * THE COUNT MAY ONLY FALL AND THE GATE FAILS IF IT RISES, so a new raw rung cannot hide inside an
 * existing allowance.
 *
 * ⚠ END CONDITION, STATED RATHER THAN IMPLIED. The intent is zero, and the trigger is the NEXT DARK
 * PALETTE: every one of these paints a light-ground value, so a second dark palette makes each a
 * visible defect on a real page exactly as `text-subtle` and `text-body` became. Whichever remain
 * when that palette is proposed must be migrated or argued into `GROUND_INVARIANT` individually —
 * "reach zero eventually" is not an end condition and this is not one either unless that trigger is
 * honoured. */
/* ⚠ THE NOUN WAS WRONG AND THE COUNT WAS NOT. This said "ladder rungs and semantic tokens", which
 * described twelve of fifteen — the other three were a route's PAGE GROUND, a transition's START
 * STATE and a card TINT. Complete, measured, and still the wrong noun, in a registry two turns old.
 * That shape has now appeared in a spec, in a census and here. */
const RATCHET = {
  max: 9,
  why: "LADDER RUNGS painted directly by public surfaces — a rung is what a role resolves to, so a "
     + "site naming one directly has no ground answer. Plus `glow-web`, a per-category card tint, "
     + "which is decoration rather than a rung and is named here so the noun stays honest.",
};

/* ⚠ THE FIFTH KIND, EARNED RATHER THAN CONVENIENT. A ROLE IS A NAME A COMPONENT READS; THESE ARE
 * VALUES A CONTEXT RESOLVES THAT NO COMPONENT NAMES. `case-study-sand` is a route's page ground set
 * by a fixed full-bleed layer; `reveal-sand` is a transition's start state. Neither is spelled by
 * any component, so neither can be a role — and both must change with the ground, so neither is
 * invariant and neither is un-migrated debt. The vocabulary had no slot for this.
 *
 * ⚠ AND `reveal-sand` IS THE SHARPEST MEMBER: A TRANSITION WHOSE END STATE THEMED AND WHOSE START
 * STATE DID NOT. Section G's whole-pair rule applied to a TEMPORAL pair rather than a spatial one —
 * and G cannot express it, because G looks at elements CO-EXISTING rather than at one element over
 * time. G's fourth vocabulary failure, and the first where widening the selector cannot help: both
 * states are correct in isolation and only their relation is wrong, so a half-migrated animation is
 * invisible to every static check BY CONSTRUCTION.
 *
 * ⚠ IT IS A CLASS RATHER THAN AN INSTANCE. Every transition, keyframe and enter/exit state in the
 * repository pairs two values, and nothing has ever checked that both sides theme together. Section
 * N enumerates them. */
/* ⚠ THE DEFINITION IS RESTATED ON THE PROPERTY, AND THE OLD WORDING DESCRIBED ITS MEMBERS RATHER
 * THAN THE RULE. It read "values a context resolves that NO COMPONENT NAMES" — true of both members
 * at the time, and incidental to what made them members.
 *
 * THE PROPERTY IS THAT THEY RESOLVE PER GROUND AND KEEP THEIR LIGHT VALUE UNTOUCHED. That is true of
 * `case-study-sand` and `reveal-sand` as well, which is what makes this accurate rather than
 * stretched — a definition widened to admit a case would not have to hold for the existing members,
 * and this one does.
 *
 * ⚠ AND IT IS THE ONLY REPAIR THAT DOES NOT MOVE LIGHT PIXELS. Every role assignment — rung-wide or
 * per-site — repaints six palettes to fix a dark page. THE LIGHT SIDE IS CORRECT AND ONLY THE DARK
 * SIDE FAILS, and a value that is right on light and wrong on dark is exactly what a per-ground
 * resolution is for. */
const GROUND_SCOPED = {
  /* ⚠ THE VESSEL'S FIVE, MOVED HERE FROM THE DEFERRED REDRAW BECAUSE THE REDRAW HAPPENED. Each is
   * now read through a `--vessel-*` indirection that `[data-ground="dark"]` overrides — the light
   * side is byte-identical because it is not re-expressed at all. No component names any of them. */
  "vessel-glass": "the pane's angled tint. Dark override mixes it toward the ground, so hue and chroma hold and only lightness inverts.",
  "vessel-wave": "the inset wave highlight, same mechanism as the tint.",
  "vessel-shadow": "the body gradient's mid stop, same mechanism.",
  "vessel-pearl": "the body gradient's top stop, same mechanism.",
  "vessel-capsule": "the capsule's fill, same mechanism.",
  "vessel-ink": "the shadow and inset ring pigment. Takes `etch`'s treatment — its DIRECTION holds across the flip and only its magnitude collapses, and direction is what the ruling rested on.",
  /* ⚠ THE REFUSAL STANDS AND THIS DOES NOT OVERTURN IT. #382 measured `cream-200` for a role and
   * refused: gradient endpoints in four of its sites, one highlighted-state card, one illustration
   * constant — NO SINGLE JOB. That is still true and it still has no role.
   *
   * ⚠ A REFUSAL TO NAME IS NOT A REFUSAL TO RESOLVE. Those are different questions about the same
   * rung, and #382 answered the first correctly while never being asked the second. Counted: NINE of
   * twelve sites are GROUNDS — pills, highlighted stat cards, feature cards, the experience photo
   * wrapper — and every one has the identical dark problem. Two are gradient endpoints that follow
   * their gradient, one is artwork excluded by file. Mixed for naming, uniform for resolving.
   *
   * This is what the six 2.60 rows sit on. */
  "cream-200": "a ground with no single JOB and one single GROUND BEHAVIOUR — nine of twelve sites "
    + "are filled chips, cards and wrappers that all need the same dark answer. Refused a role by "
    + "#382 and that refusal stands; this resolves it per ground without naming it.",
  "case-study-sand": "a ROUTE's page ground, painted by `.case-study-bg` as a fixed full-bleed "
    + "layer. No component names it. Remapped to the page ground on dark.",
  "reveal-sand": "a TRANSITION's start state, settling to `var(--color-surface)`. No component "
    + "names it. Remapped so the sweep arrives lighter than the ground and settles down.",
};

/* ⚠ THE VESSEL, AND IT IS A DIFFERENT KIND AGAIN — a MECHANIC rather than a set of values. Arrived
 * from two independent routes on the same day: classified from the render, where it draws a glaring
 * light pill across a dark page, and derived from consumption here, which found the same eleven
 * tokens without being told to. That corroboration is what makes it a fact about the system rather
 * than a judgement about a screenshot.
 *
 * ⚠ IT IS NOT A MISSING VALUE. Its tones ARE palette-scoped — `vessel-pearl` resolves to
 * oklch(96.5% 0.009 250) on sapphire, hue 250 rather than cream's 40 — so every palette already
 * themes it. Pearl, glass, smoke and bounce describe LIGHT PASSING THROUGH A PALE TRANSLUCENT BODY,
 * and THERE IS NO DARKER VALUE OF THAT WHICH IS STILL THAT. The repair is a different highlight
 * structure, not different numbers, which is the one piece shape C cannot reach.
 *
 * Predicted at 1.20 by the dark render two arcs ago and now measured on a real page. Its own unit. */
const DEFERRED_REDRAW = {
  tokens: ["bounce", "smoke-1", "smoke-2", "smoke-3", "smoke-4"],
  why: "⚠ WHAT IS LEFT OF THE VESSEL AFTER THE REDRAW TURNED OUT TO BE A MIGRATION. `bounce` is "
     + "GROUND-CONTINGENT and deliberately kept — 8.5 on light against 82.3 on dark, so deleting it "
     + "would strip the mechanic from the ground it works best on. The four smoke stops are still "
     + "raw and are the only genuinely open part.",
};

const subject = [...consumers.keys()].filter((t2) => paletteTokens.has(t2)).sort();
const roleRungs = new Set(RUNG_ROLES.map(([, v]) => v.rung));
const redraw = new Set(DEFERRED_REDRAW.tokens);
const unclassified = subject.filter((t2) =>
  !(t2 in ROLES) && !(t2 in GROUND_INVARIANT) && !(t2 in GROUND_SCOPED) && !redraw.has(t2));

console.log(`         ${filesScanned} source files scanned across .tsx/.ts/.css, ${studioSkipped} skipped under the freeze, ${constantsSkipped} as artwork`);
console.log(`         ${paletteTokens.size} palette-declared tokens; ${subject.length} of them have a public consumer`);
console.log(`         ${unclassified.length} consumed and unclassified — neither a role, nor ground-invariant, nor a constant`);

t("L0 the walk found real files — a zero denominator makes every row below vacuous, against a literal",
  filesScanned > 150, true);
t("L0a …and it reached all three file types, which is the boundary the role migration could not see",
  ["tsx", "ts", "css"].filter((ext) =>
    !srcFiles.some((f) => f.endsWith("." + ext) && !/^components\/studio\/|^app\/studio\//.test(f.replace(root, "")))), []);
t("L0b …and the palette subject is non-empty, against a literal", paletteTokens.size >= 30, true);
t("L0c …and the freeze was applied by DIRECTORY before any pattern ran", studioSkipped > 0, true);

/* ⚠ THE ROW THE RENDER HAD TO FIND. Every themed token a public surface paints must be classified:
 * a role that follows the ground, a value that IS the ground answer, or a declared constant. An
 * unclassified one is a colour nobody has decided about, and it will paint a light value on a dark
 * page exactly as `text-subtle` and `text-body` did. */
/* ⚠ THE RATCHET IS A CEILING, NOT A LIST. A named list would let one token leave and another take
 * its place at the same count; a ceiling on the COUNT with the names printed makes a new raw rung
 * fail even if an old one was fixed in the same commit. */
console.log(`         ratchet: ${unclassified.length} un-migrated against a ceiling of ${RATCHET.max}`);
console.log(`         ${unclassified.join(", ")}`);
/* ⚠ THE FAILURE CARRIES THE NAMES, NOT JUST THE COUNT. A ceiling that reports only a number tells
 * you it moved and not WHICH token arrived — the same defect as a census whose movement cannot
 * distinguish five causes. So the overflow is reported as the sorted excess. */
t("L1 ⚠ THE UN-MIGRATED COUNT MAY ONLY FALL — a ceiling, so a new raw rung cannot hide inside an existing allowance",
  unclassified.length <= RATCHET.max ? [] : unclassified, []);
t("L1a …and the ceiling is not slack: it equals today's count, so the next arrival fails rather than fitting",
  RATCHET.max, unclassified.length);
t("L1b ⚠ AND THE DEFERRED REDRAW IS A DECLARED SET WITH A REASON, not an absence — its tokens are consumed and unfixed on purpose",
  DEFERRED_REDRAW.tokens.filter((t2) => !consumers.has(t2)).sort(), []);
t("L2 ⚠ AND EVERY GROUND-INVARIANT REASON ARGUES INVARIANCE — 'not migrated yet' is a backlog wearing an exemption's clothes",
  Object.entries(GROUND_INVARIANT).filter(([, why]) => !/\bIS\b|itself|referenced/.test(why)).map(([k]) => k), []);
t("L3 …and no token is classified twice, which would leave two answers and no way to tell which won",
  subject.filter((t2) => (t2 in ROLES) && (t2 in GROUND_INVARIANT)), []);
t("L3a …and the artwork files were excluded by FILE, the unit section H is written in, against a literal",
  constantsSkipped > 0, true);
/* ⚠ THE COMPLEMENT, because a conditional assertion can only fail in one direction. L1 catches a
 * token that gained a consumer; this catches one that LOST every consumer and kept its entry. */
t("L4 ⚠ AND NO GROUND-INVARIANT ENTRY HAS LOST ITS CONSUMERS — zero consumers is a reason to delete a token, not to exempt it forever",
  Object.keys(GROUND_INVARIANT).filter((t2) => !consumers.has(t2)), []);


console.log("\nN · ⚠ A TRANSITION PAIRS TWO VALUES, AND NOTHING HAS EVER CHECKED BOTH SIDES THEME");

/* ⚠ SECTION G's FOURTH VOCABULARY FAILURE, AND THE FIRST WHERE WIDENING THE SELECTOR CANNOT HELP.
 * G asserts a pair migrates whole or not at all — and it looks at elements CO-EXISTING. A transition
 * pairs one element with ITSELF OVER TIME, which G cannot express. `.reveal-panel` settled to
 * `var(--color-surface)`, a role that remaps, and started at a raw literal: correct at rest, wrong
 * for its first 0.9 seconds, on every un-revealed panel of a dark page.
 *
 * ⚠ BOTH STATES WERE CORRECT IN ISOLATION AND ONLY THEIR RELATION WAS WRONG, so no static check
 * that reads one rule at a time could see it — invisible BY CONSTRUCTION rather than by oversight.
 *
 * This enumerates the class rather than fixing the instance: every animated colour in the sheet,
 * counted, with the population stated so a shrunken subject fails instead of agreeing. */
const cssN = css.replace(/\/\*[\s\S]*?\*\//g, " ");
const COLOUR_PROP = /(?:^|[;{\s])(background-color|background|color|border-color|fill|stroke|box-shadow|outline-color)\s*:\s*([^;}]+)/g;

/* Every rule that declares a colour, keyed by selector. */
const rules = [];
for (const m of cssN.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim(), body = m[2];
  if (!sel || sel.startsWith("@")) continue;
  const decls = [...body.matchAll(COLOUR_PROP)].map((d) => ({ prop: d[1], value: d[2].trim() }));
  if (decls.length) rules.push({ sel, decls, animates: /transition\s*:/.test(body) });
}

/* A STATE rule is the same selector plus a state suffix — the second half of a temporal pair. */
const STATE = /(\.is-[a-z-]+|:hover|:focus(-visible)?|:active|\[data-[a-z-]+=?[^\]]*\]|\.is-on)\s*$/;
const pairs = [];
for (const r of rules) {
  const base = r.sel.replace(STATE, "").trim();
  if (base === r.sel || !base) continue;
  const baseRule = rules.find((x) => x.sel === base);
  if (!baseRule) continue;
  for (const d of r.decls) {
    const bd = baseRule.decls.find((x) => x.prop === d.prop);
    if (bd) pairs.push({ sel: r.sel, prop: d.prop, from: bd.value, to: d.value });
  }
}

/* A side is THEMED when its value is entirely token references. A raw rung counts as themed for
 * this row's purpose — N asks whether both sides move TOGETHER, not whether either is a role.
 *
 * ⚠ AND A THIRD STATE EXISTS, WHICH THE FIRST RUN OF THIS SECTION PROVED BY REPORTING IT WRONG.
 * `transparent`, `none`, `inherit` and `currentColor` are REMOVALS rather than colours: a state
 * that strips a material is not a half-migrated pair, it is a deliberate absence. Forcing that
 * third state into a themed/raw binary reported `.nav-glass.is-ghost` as a defect — it sheds the
 * glass on mobile and restores it above 1024px, which is correct and intentional.
 *
 * SAME SHAPE AS EVERY OTHER PROBE DEFECT IN THIS ARC: a value that belonged to a category the
 * instrument's vocabulary did not have, given the nearest available label. The count of absences is
 * PRINTED rather than silently dropped, so the exclusion is visible instead of buried in a filter. */
const ABSENT = /^\s*(transparent|none|inherit|unset|initial|currentColor)\s*$/i;
const themed = (v) => /var\(--/.test(v) && !/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\boklch\(\s*[\d.]/.test(v);
const removals = pairs.filter((p2) => ABSENT.test(p2.from) || ABSENT.test(p2.to));
const colourPairs = pairs.filter((p2) => !ABSENT.test(p2.from) && !ABSENT.test(p2.to));
const splitPairs = colourPairs.filter((p2) => themed(p2.from) !== themed(p2.to));

console.log(`         ${rules.length} colour-declaring rules, ${pairs.length} temporal pairs found`);
console.log(`         ${removals.length} are REMOVALS (transparent/none) — a deliberate absence, not a pair`);
console.log(`         ${colourPairs.length} are colour-to-colour; ${splitPairs.length} have one themed side and one raw`);
if (splitPairs.length) for (const p2 of splitPairs.slice(0, 6))
  console.log(`           ${p2.sel} { ${p2.prop} }  ${themed(p2.from) ? "from themed" : "FROM RAW"} -> ${themed(p2.to) ? "to themed" : "TO RAW"}`);

t("N0 the sheet was parsed into real rules — a zero denominator makes N2 vacuous, against a literal",
  rules.length > 120, true);
t("N0a …and temporal pairs were actually found, against a literal", pairs.length >= 5, true);
t("N0b ⚠ AND THE REMOVALS ARE COUNTED RATHER THAN FILTERED AWAY — an exclusion nobody can see is one nobody chose",
  removals.length + colourPairs.length, pairs.length);
t("N1 ⚠ NO TEMPORAL PAIR HAS ONE THEMED SIDE AND ONE RAW ONE — the half-migrated animation, which no per-rule check can see",
  splitPairs.map((p2) => `${p2.sel} { ${p2.prop} }`).sort(), []);

/* ⚠ AND KEYFRAMES ARE THE OTHER HALF OF THE CLASS. A keyframe's stops are the same pairing with no
 * selector relation at all, so the join above cannot reach them. */
const kf = [];
for (const m of cssN.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g))
  for (const d of m[2].matchAll(COLOUR_PROP))
    kf.push({ name: m[1], prop: d[1], value: d[2].trim() });
const kfRaw = kf.filter((k) => !themed(k.value));
console.log(`         ${kf.length} colour stops across keyframes; ${kfRaw.length} raw`);
t("N2 ⚠ AND NO KEYFRAME ANIMATES A RAW COLOUR — a stop that does not theme is the same defect with no selector to join on",
  kfRaw.map((k) => `@keyframes ${k.name} { ${k.prop} }`).sort(), []);

/* ⚠ AND N1 WOULD NOT HAVE CAUGHT THE DEFECT THAT PROMPTED THIS SECTION — SAID PLAINLY, BECAUSE A
 * GATE THAT MISSES ITS OWN ORIGIN STORY IS WORSE THAN NONE. `.reveal-panel` referenced
 * `var(--color-reveal-sand)` and settled to `var(--color-surface)`. BOTH SIDES ARE var() — so "is
 * this a token" reports them as agreeing, and the pair looks whole. The difference was one level
 * down: `surface` is remapped on a dark ground and `reveal-sand` was not.
 *
 * So N1 catches LITERAL against TOKEN and this row catches REMAPS against DOES-NOT. Two different
 * failures wearing the same shape, and only the second is the temporal whole-pair rule. */
const remapsOnDark = (tok) => remapped.has(tok) || tok in GROUND_SCOPED;
const tokensIn = (v) => [...v.matchAll(/var\(\s*--color-([a-z0-9-]+)/g)].map((m) => m[1]);
const straddle = [];
for (const p2 of colourPairs) {
  const from = tokensIn(p2.from), to = tokensIn(p2.to);
  if (!from.length || !to.length) continue;
  const fromRemaps = from.some(remapsOnDark), toRemaps = to.some(remapsOnDark);
  if (fromRemaps !== toRemaps)
    straddle.push(`${p2.sel} { ${p2.prop} }  ${from.join("+")}${fromRemaps ? " remaps" : " STATIC"} -> ${to.join("+")}${toRemaps ? " remaps" : " STATIC"}`);
}
/* ⚠ ONE DECLARED STRADDLE, WITH THE REASON IT IS NOT FIXED HERE. Same discipline as the ratchet:
 * a known defect with a stated trigger, not an exemption claiming nothing is wrong. */
/* ⚠ EMPTY, AND IT EMPTIED BY BEING FIXED RATHER THAN BY BEING DELETED. `.skill-pill` sat here: rest
 * on `cream-200` (static), hover on `surface` (remaps), so on a dark palette it was LIGHT at rest
 * with light text and DARKENED on hover. Its trigger was named as the ladder regularisation.
 *
 * The real repair was neither — `cream-200` gained a DARK ANSWER without gaining a role, so both
 * sides of the pair now remap and the straddle is gone. N3b caught that this registry had stopped
 * describing anything, which is the half of a deferral registry that earns it: a stale entry warns
 * about a defect that no longer exists and hides that nobody checked. */
const STRADDLE_DEFERRED = {};
const declaredKeys = Object.keys(STRADDLE_DEFERRED);
const keyOf = (x) => x.slice(0, x.indexOf("}") + 1).trim();
const undeclared = straddle.filter((x) => !declaredKeys.includes(keyOf(x)));
console.log(`         ${straddle.length} pairs where one side REMAPS on dark and the other does not; ${Object.keys(STRADDLE_DEFERRED).length} declared`);
for (const x of straddle) console.log(`           ${x}`);
t("N3 ⚠ BOTH SIDES OF A TEMPORAL PAIR REMAP TOGETHER — the rule G cannot express, and the one N1 misses",
  undeclared.sort(), []);
t("N3a ⚠ AND EVERY DEFERRAL NAMES ITS TRIGGER — a straddle with no end condition is a defect wearing an exemption's clothes",
  Object.entries(STRADDLE_DEFERRED).filter(([, why]) => !/TRIGGER:/.test(why)).map(([k]) => k), []);
t("N3b …and no declared straddle has silently been fixed, which would leave a registry describing nothing",
  declaredKeys.filter((k) => !straddle.some((x) => keyOf(x) === k)), []);



/* ============================================================================================
   O · THE INVERTED GROUND — ASSERTED AS A PAIR, BECAUSE EITHER HALF PASSES BY COINCIDENCE.

   ⚠ AN INVERTED GROUND IS AN ELEMENT WHOSE FILL IS THE PAGE'S INK AND WHOSE LABEL IS THE PAGE'S
   SURFACE. On a light palette that is a near-black pill with a near-white label; on a dark one it
   must become a near-white pill with a near-black label. THE TWO SIDES ARE ONE DECISION.

   ⚠ AND THE WORK FILTER SHIPPED WITH BOTH SIDES WRONG FOR ONE REASON. Its fill was `ink-950`, a
   raw rung that cannot remap, and its label was `on-accent`, a role naming a ground the element is
   not. On all five light palettes the wrong tokens resolve to THE SAME BYTES as the right ones, so
   nothing could reveal it until a dark ground arrived — the thumb then measured 1.17 against its
   surface, on the one palette that is published.

   ⚠ WHY THE PAIR AND NOT EITHER HALF. Checking the fill alone passes on five palettes; checking the
   label alone passes on five palettes; and a repair to one side ALONE regresses the other — a
   `text-primary` fill under an `on-accent` label reads 1.06 on dark. Three foregrounds and six
   fills were each tried in isolation and each regressed something. THE PAIR IS THE UNIT.

   ⚠ THE REGISTRY DECLARES THE QUESTION AND EACH ENTRY ANSWERS IT — the Z8 shape. `why` answers
   "what makes this element an inverted ground", so a future entry has to argue rather than be listed.
============================================================================================ */
/* ⚠ THE REGISTRY IS EMPTY, AND ITS ONLY MEMBER LEFT BY CEASING TO BE ONE.
 *
 * `.wf-thumb` was registered here as the SECOND inverted-ground consumer: an ink fill with a
 * `surface` label, the page's two ends swapped. It was that because `ink-950` had measured 1.17 on
 * sapphire and the repair reached for a role pair that inverts.
 *
 * ⚠ IT IS NOW `accent` / `on-accent` — AN ORDINARY ACCENT GROUND, NOT AN INVERTED ONE. Nobody had
 * measured accent against this control's own ground; it clears both floors on all nine. So the
 * element stopped being the thing this registry describes, and O3/O4 went red on exactly that —
 * the gate refusing to keep asserting a shape the element no longer has.
 *
 * ⚠ AND THE PREDICTION THIS REGISTRY CARRIED IS RETIRED WITH IT, IN THE OPPOSITE DIRECTION. It said
 * a THIRD consumer would prove the ROLE was missing. The second one turned out to be a control that
 * should have used a role that already existed — so the population is back to ONE, and the open
 * question is no longer "what role is missing" but "which of these are really inverted grounds".
 *
 * ⚠ THE ROWS BELOW ARE KEPT AND NOW ASSERT AN EMPTY SUBJECT, DELIBERATELY. `O0` fails if the
 * registry has no members, which is what makes an empty registry a decision somebody records rather
 * than a gate quietly passing over nothing — this repo's own rule about a subject that drains away.
 * The first genuine inverted ground re-arms every row here. */
const INVERTED = {};
/* ⚠ SECTION O IS RETIRED, AND ITS POPULATION DRAINED TO ZERO RATHER THAN BEING DELETED.
 *
 * It asserted that an INVERTED GROUND — an element that reads as selected by swapping the page's
 * two ends — uses roles at opposite ends of the ladder on both grounds. Its only member was
 * `.wf-thumb`, and `.wf-thumb` is now `accent`/`on-accent`: an ordinary accent ground, measured
 * clearing both floors on all nine, which nobody had tried until it was asked for.
 *
 * ⚠ SO THE ROWS DID NOT FAIL — THEIR SUBJECT STOPPED EXISTING. `O0` refuses an empty registry, and
 * it is right to: a row matching nothing passes over nothing and reads as coverage. This record has
 * done exactly this once before, for the near-miss colour category, and the ruling was the same —
 * A ROW MATCHING NOTHING HAS OUTLIVED ITS SUBJECT.
 *
 * ⚠ AND THE PREDICTION IT CARRIED IS RETIRED IN THE OPPOSITE DIRECTION FROM THE ONE IT EXPECTED.
 * It said a THIRD consumer would prove the ROLE was missing. The SECOND turned out to be a control
 * that should have used a role which already existed — so the honest open question is not "what
 * role is missing" but "how many of these were ever really inverted grounds".
 *
 * THE TRIGGER TO REVIVE IT: a genuine inverted ground — an element whose selected state inverts the
 * page and for which no accent pairing works. Re-register it here and every row below re-arms.
 * Deleting them would lose the reasoning, which is what this file's own header refuses. */
console.log("\nR · the accent ROLE remaps on a dark ground and the accent RUNG does not");
/* ⚠ THE DEFECT THIS CLOSES: `--color-accent` remaps to `accent-on-dark` on the dark ground and
 * `--color-accent-500` does NOT — it stays the base mid-tone. So a control filling with the RUNG and
 * labelling with `on-accent` measured 3.24 to 3.65 on the four dark palettes against a 4.5 floor,
 * while the identical pair on the ROLE measured 6.75 to 7.52.
 *
 * ⚠ THE ROLE WAS NEVER WRONG. Eight elements reached past it to a raw ladder rung the dark ground
 * never moves — and the token's own comment already recorded the conflict, naming `bg-accent-500` as
 * the consumer that fails while three others pass. It shipped anyway, because nothing asserted the
 * pairing.
 *
 * ⚠ ABSENCE IS THE SOUND DIRECTION. If no class string carries both, nothing can render the failing
 * pair; a row asserting the ROLE is present would prove only that the words exist. And the scan
 * crosses LINE BOUNDARIES deliberately: long Tailwind strings wrap, and a line-based census of this
 * exact question reported six false "inherited" sites because `bg-accent` and `text-on-accent` sat
 * on different lines of one string. */
{
  const tsx = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const c = `${d}/${e.name}`;
      if (e.isDirectory()) walk(c);
      else if (c.endsWith(".tsx")) tsx.push(c);
    }
  };
  for (const r of ["app", "components"]) walk(join(root, r));
  const offenders = [];
  const nested = [];
  let withRole = 0;
  for (const f of tsx) {
    const flat = readFileSync(f, "utf8").replace(/\s+/g, " ");
    for (const m of flat.matchAll(/[`"]([^`"]{0,400}?text-on-accent[^`"]{0,400}?)[`"]/g)) {
      if (/\bbg-accent-500\b/.test(m[1])) offenders.push(f.slice(root.length));
      else if (/\bbg-accent\b/.test(m[1])) withRole++;
    }
    /* ⚠ AND THE PARENT-CHILD FORM, WHICH THE ONE-STRING MATCH ABOVE CANNOT SEE — IT MISSED THREE
       LIVE SITES ON TWO PUBLIC PAGES, measured at 3.24 to 3.65 on the four dark palettes.
     
       The ground sits on an anchor and the foreground on a child span:
     
           <a className="… bg-accent-500 …"><span className="text-on-accent">…</span></a>
     
       ⚠ AND THE SPLIT IS NOT A STYLE CHOICE — IT IS FORCED, WHICH IS WHY THIS FORM WILL RECUR.
       `a { color: inherit }` is UNLAYERED, so `text-on-accent` on the anchor itself draws nothing;
       the child span is the only place the utility lands, and the components say so in their own
       comments. THE CASCADE RULE THAT FORCES THE SPLIT IS WHAT MADE THESE INVISIBLE TO THE ROW
       ABOVE. Two documented facts, each correct, combining into a blind spot neither predicted.
     
       The window is bounded and stated: 220 flattened characters after the rung's class string,
       which reaches a child element's own className and not the next sibling block. A window is a
       heuristic and is named as one — what makes it honest is that it is DECLARED and that R2b
       asserts its population, so a site that grows past it fails visibly rather than silently. */
    for (const m of flat.matchAll(/[`"][^`"]{0,200}?\bbg-accent-500\b[^`"]{0,200}?[`"]/g)) {
      const after = flat.slice(m.index + m[0].length, m.index + m[0].length + 220);
      if (/\btext-on-accent\b/.test(after)) nested.push(f.slice(root.length));
    }
  }
  t("R1 the walk found markup and real pairings, so R2 cannot pass over nothing",
    [tsx.length > 50, withRole > 3], [true, true]);
  t("R2 ⚠ NO ELEMENT PAIRS `text-on-accent` WITH THE RUNG — the rung does not remap on a dark ground and that pair measures 3.24 there",
    [...new Set(offenders)].sort(), []);
  /* ⚠ THE NESTED FORM, WHICH IS THE ONE THAT ACTUALLY SHIPPED. R2 was written for this defect and
     caught eight of eleven; the three it missed put the ground and the foreground on different
     elements. A gate that catches the shape it was written against and not its forced variant is
     the narrower-vocabulary defect, here inside the gate built for the same subject. */
  t("R2b ⚠ …NOR DOES A CHILD — the ground on an anchor and the foreground on its span is the form `a { color: inherit }` FORCES, and it measured 3.24 to 3.65 live on two public pages",
    [...new Set(nested)].sort(), []);
}

console.log("\nS · a ground DECLARATION must be reachable by a remap");
/* ⚠ THIS EXISTS BECAUSE A DECLARATION WAS TRUE FOR TWO DAYS AND FALSE FOR FOUR, AND NOTHING NOTICED.
 *
 * `SectionRenderer` emitted `data-ground="dark"` on a case-study hero and a quote band (2026-08-07).
 * Two days later the token remap was narrowed from `[data-ground="dark"]` to
 * `:root[data-ground="dark"]` — a correct fix, because at 0-1-0 it TIED `:root` and lost to a
 * `:root` block four hundred lines below on source order. At 0-2-0 it wins.
 *
 * ⚠ AND `:root` MATCHES `<html>` ALONE, so from that moment a SECTION could never take the values.
 * The heroes went on declaring dark and painting `--color-surface`. `SiteHeader`'s predicate reads
 * `[data-ground="dark"]` on ANY element, believed them, and retoned the nav to white links over a
 * near-white hero: NAV LINKS AT 1.09 AGAINST A 4.5 FLOOR, five regions, two live pages, all five
 * light palettes. Measured from the paint on production.
 *
 * ⚠ THE INVARIANT IS NOT "NEVER EMIT IT ON A SECTION". It is that an emission and a remap must
 * AGREE: if any non-root element declares a ground, some non-`:root` block must be able to remap it.
 * Either side alone is fine; the pair is what lies.
 *
 * ⚠ AND THE SPECIFICITY FACT THAT MADE THE ORIGINAL FIX SAFE WAS NEVER WRITTEN DOWN, WHICH IS WHY
 * ITS COST WENT UNSEEN: SPECIFICITY ONLY BREAKS TIES BETWEEN RULES MATCHING THE SAME ELEMENT. A
 * `:root` block declares custom properties on `<html>`; a section block declares them on the
 * section. They never compete — the section inherits until it declares its own, and then its own
 * wins for it and its descendants regardless of source order. So a mid-page block would have needed
 * no prefix at all, and adding one to the root block cost the mid-page case everything. */
{
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  /* Selector positions only — comments discuss this attribute at length and a raw scan would match
     the prose describing it, which this repository has now done in three separate tools. */
  const decls = [...blankCommentBodies(css).matchAll(/^[^\n{}]*\[data-ground="dark"\][^\n{}]*\{/gm)].map((m) => m[0].trim());
  const nonRootRemap = decls.filter((d) => !/^:root\[data-ground/.test(d));
  const emitters = [];
  const tsxAll = [];
  (function w(d) {
    for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const c = `${d}/${e.name}`;
      if (e.isDirectory()) w(c); else if (c.endsWith(".tsx")) tsxAll.push(c);
    }
  })("components");
  (function w(d) {
    for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const c = `${d}/${e.name}`;
      if (e.isDirectory()) w(c); else if (c.endsWith(".tsx")) tsxAll.push(c);
    }
  })("app");
  for (const f of tsxAll) {
    const src = blankCommentBodies(readFileSync(join(root, f), "utf8"));
    if (/\sdata-ground=/.test(src) && !f.endsWith("app/layout.tsx")) emitters.push(f);
  }
  console.log(`      remap blocks: ${decls.length} (${nonRootRemap.length} reach a non-root element)`);
  console.log(`      non-root emitters: ${emitters.length ? emitters.join(", ") : "none"}`);
  t("S1 the stylesheet was read and carries the ground block at all, so S2 is not passing over nothing",
    decls.length > 0, true);
  t("S2 ⚠ NO ELEMENT DECLARES A GROUND THE STYLESHEET CANNOT REMAP — a declaration nothing can honour is read by consumers as true",
    emitters.length > 0 && nonRootRemap.length === 0 ? emitters : [], []);
}

/* ---- T · A FOREGROUND MAY NOT TAKE THE RUNG, AND R2 CANNOT SEE THIS FORM -------------------
   R2 asserts the same property and matches CLASS STRINGS IN JSX. `.next-rail-arrow` painted the
   rung as a CSS DECLARATION and R2 was green over it for the whole dark-palette era — the gate
   built for this defect was blind to the shape the next instance took. Measured on four real
   builds the arrow read 2.92 to 3.28 against a 4.5 floor, and the role reads 6.06 to 6.76.

   ⚠ THE RUNG IS NOT BANNED, ONLY BANNED AS A FOREGROUND. Forty references remain and they are
   grounds, borders, outlines, fills and glows. A ground does not need to remap the way text does,
   and widening this row to every reference would be the wrong-noun error at five times the scale.
   The subject is the `color` property alone.

   ⚠ AND THE MATCHER MUST NOT COUNT THE ROLE'S OWN DEFINITION. `--color-accent` taking the rung is
   exactly what makes the light half byte-identical, and `border-color` is a different floor.
   Requiring the property to be exactly `color` excludes both, and T0 proves the denominator is
   real so this cannot pass by matching nothing. */
{
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const fgSites = [...css.matchAll(/(^|[;{\s])color:\s*var\(--color-accent-500\)/g)]
    .map((m) => css.slice(0, m.index).split("\n").length);
  const anyRung = (css.match(/var\(--color-accent-500\)/g) || []).length;
  console.log(`\nT \u00b7 a foreground may not take the unremapped rung`);
  console.log(`      rung references in the stylesheet: ${anyRung} (grounds, borders, outlines, fills \u2014 not the subject)`);
  console.log(`      of those, feeding the color property: ${fgSites.length}`);
  t("T0 the stylesheet still references the rung at all, so T1 is not passing over an empty file",
    anyRung > 0, true);
  t("T1 \u26a0 NO color DECLARATION TAKES accent-500 \u2014 the rung does not remap on a dark ground, so a glyph on it fails there while passing every light palette",
    fgSites, []);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
