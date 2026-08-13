// THE ITEM TYPE INSIDE A KEY, WHICH NO KEY-SET COMPARISON CAN SEE.
// Run: node ralph/tests/singleton-item-shape.mjs
//
// ---- ⚠ WHY THIS EXISTS: EVERY SKILLS SAVE FAILED FOR TWO DAYS ---------------------------------
//
// `47e59f1` (2026-08-12) made a skill an OBJECT — `{ name, glow }` — where it had been a plain
// string. It moved THREE of the four places that describe that shape: `keystatic.config.ts`,
// `SkillsEditor.tsx`, `content/skills.yaml`. It did not move the sanitizer.
//
// ⚠ AND IT DID NOT MOVE IT BECAUSE THE CHANGE HAD NO REASON TO OPEN THAT FILE. Adding a field to a
// schema, a form and some content is a coherent unit; nothing in it points at a validator two
// directories away. THAT IS THE MECHANISM, not carelessness — and it is why a rule ("remember the
// sanitizer") would not have helped.
//
// The form has posted objects ever since, so `items.some(i => typeof i !== "string")` refused EVERY
// save. The owner found it while adding a glow word; the panel had been unable to save anything.
//
// ---- ⚠ AND A KEY-SET COMPARISON WOULD NEVER HAVE CAUGHT IT ------------------------------------
//
// `collection-readiness` C compares KEY SETS between a schema and a serializer, and it covers
// COLLECTIONS only. Here both lists agreed on `items`; what diverged was the TYPE INSIDE it. So this
// is a new subject rather than a widening of that one — and singletons had no coverage at all.
//
// ---- ⚠ WHAT IT CHECKS, AND THE HONEST LIMIT ----------------------------------------------------
//
// For each hand-maintained key list that mirrors a schema `fields.object({…})`, both directions: a
// field in the schema and not the list is SILENTLY DROPPED ON SAVE; a field in the list and not the
// schema is a validator guarding something that cannot arrive.
//
// It does NOT check the TYPE of each field — that a `glow` is text rather than an array. Doing that
// means resolving Keystatic's field constructors, and this file must stay a parser. What it does
// catch is the shape that actually broke: a list that has stopped describing its object.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONFIG = readFileSync(join(root, "keystatic.config.ts"), "utf8");

/* ⚠ THE REGISTRY IS DECLARED AND BOTH DIRECTIONS ARE GATED, because it is itself a parallel list —
 * the defect this file exists for, one level up. `anchor` is the unique text in the config that
 * opens the object the list mirrors; `A2` fails if it matches anything other than exactly once. */
const LISTS = [
  { const: "ITEM_KEYS", file: "lib/studio/skills-format.ts",
    /* ⚠ ANCHORED ON THE FIELD, NOT THE KEY. `items: fields.array(` occurs FOUR times in the config
       — three inside case-study blocks — and the first draft of this registry silently resolved to
       one of those, reporting `label, value` as skills fields. A2 caught it, which is the row
       earning its place on this gate's first run. */
    anchor: 'name: fields.text({ label: "Skill" })', why: "one skill row — the list that went stale" },
  { const: "CATEGORY_KEYS", file: "lib/studio/skills-format.ts",
    anchor: "categories: fields.array(", why: "one skill category" },
  { const: "STAGE_KEYS", file: "lib/studio/site-settings-format.ts",
    anchor: "processStages: fields.array(", why: "one process stage" },
  { const: "HERO_TAB_KEYS", file: "lib/studio/site-settings-format.ts",
    anchor: "heroTabs: fields.array(", why: "one hero tab" },
  { const: "LINK_KEYS", file: "lib/studio/site-settings-format.ts",
    anchor: "links: fields.array(", why: "one elsewhere link" },
];

/** The immediate field names of the `fields.object({…})` opened at `anchor`. */
function schemaFields(anchor) {
  const at = CONFIG.indexOf(anchor);
  if (at < 0) return null;
  /* The anchor may sit INSIDE the object (a unique field) or just before it (a unique key), so the
     opening brace is the nearest `fields.object({` at or before the anchor, else the next one. */
  const before = CONFIG.lastIndexOf("fields.object({", at);
  const after = CONFIG.indexOf("fields.object({", at);
  const objAt = before >= 0 && at - before < 400 ? before : after;
  if (objAt < 0) return null;
  let d = 0, end = -1;
  for (let i = CONFIG.indexOf("{", objAt); i < CONFIG.length; i++) {
    if (CONFIG[i] === "{") d++;
    else if (CONFIG[i] === "}") { d--; if (d === 0) { end = i; break; } }
  }
  const body = CONFIG.slice(objAt, end);
  const base = body.split("\n")[1]?.match(/^(\s*)/)?.[1]?.length ?? 0;
  const keys = [];
  let depth = 0;
  for (const line of body.split("\n").slice(1)) {
    const m = line.match(/^(\s*)([a-zA-Z][a-zA-Z0-9_]*):/);
    if (m && m[1].length === base && depth === 0) keys.push(m[2]);
    depth += (line.match(/[{([]/g) ?? []).length - (line.match(/[})\]]/g) ?? []).length;
  }
  return keys;
}
const listValues = (file, name) => {
  const src = readFileSync(join(root, file), "utf8");
  const m = src.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
};

console.log("\nA · the registry binds to the schema, in both directions");
t("A1 the config was read and is real", CONFIG.length > 5000, true);
t("A2 ⚠ EVERY ANCHOR MATCHES EXACTLY ONE PLACE — a duplicate or missing anchor silently changes the subject",
  LISTS.filter((l) => CONFIG.split(l.anchor).length - 1 !== 1).map((l) => l.anchor), []);
t("A3 …and every declared list exists in its file",
  LISTS.filter((l) => listValues(l.file, l.const) === null).map((l) => l.const), []);
/* ⚠ A CENSUS OF THE EXPOSURE, PRINTED. Two singletons, and this many hand-maintained lists mirroring
 * a schema object — every one able to drift exactly as ITEM_KEYS did. */
t("A4 …and the subject is non-empty, so B cannot pass over nothing", LISTS.length >= 5, true);

console.log("\nB · each list still describes its object");
const drift = [];
for (const l of LISTS) {
  const schema = schemaFields(l.anchor), list = listValues(l.file, l.const);
  if (!schema) { drift.push(`${l.const}: schema object not parsed`); continue; }
  const missing = schema.filter((k) => !list.includes(k));
  const extra = list.filter((k) => !schema.includes(k));
  console.log(`      ${l.const.padEnd(14)} schema ${String(schema.length).padStart(2)}  list ${String(list.length).padStart(2)}  ${missing.length || extra.length ? "DRIFT" : "ok"}   ${l.why}`);
  /* ⚠ THE TWO DIRECTIONS MEAN DIFFERENT THINGS AND BOTH ARE FAILURES. In the schema and not the
     list: SILENTLY DROPPED ON SAVE. In the list and not the schema: a validator guarding a field
     that cannot arrive — harmless today, and a lie about what the shape is. */
  if (missing.length) drift.push(`${l.const}: in the schema and NOT the list — dropped on save: ${missing.join(", ")}`);
  if (extra.length) drift.push(`${l.const}: in the list and NOT the schema — guards nothing: ${extra.join(", ")}`);
}
t("B1 ⚠ EVERY HAND-MAINTAINED ITEM LIST STILL MATCHES ITS SCHEMA OBJECT — this is what went stale for two days",
  drift, []);

console.log(`\nsingleton-item-shape result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
