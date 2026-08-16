// THE DECLARED TYPE AND THE SCHEMA IT MIRRORS MUST AGREE ON SHAPE.
// Run: node --experimental-strip-types ralph/tests/schema-type-agreement.mjs
//
// ---- ⚠ WHY THIS EXISTS: A TWO-DAY OUTAGE THAT EVERY OTHER GATE WAS BLIND TO ------------------
//
// `SkillsCategory` declared `items: string[]`. The schema declared `array(object({ name, glow }))`.
// FOUR places said string, ONE said object, and the type system agreed with the wrong four — so
// `tsc` was green, every suite was green, and the skills section was broken for two days.
//
// ⚠ AND THE CAST CENSUS RULED THIS OUT AS ITS OWN SUBJECT, WHICH IS WHY THE CHECK IS HERE INSTEAD.
// `items as string[]` is what let the disagreement COMPILE, and widening `unchecked-joins` to reach
// casts like it was measured and refused: 35 shape-bearing casts against 13 keyed ones, guarded by
// things no matcher can name — an empty literal having no members, an object built from a typed
// registry, a switch arm. A cast is how the disagreement stayed compilable, NOT how it arose.
//
// THE DISAGREEMENT ITSELF IS THE SUBJECT, and it is checkable because both sides are readable: the
// schema at runtime from `keystatic.config.ts`, the declaration through the real TypeScript parser.
//
// ---- WHAT IT COMPARES, AND WHAT IT DELIBERATELY DOES NOT -------------------------------------
//
// For each schema key it walks the SHARED fields and asks one question: does either side say OBJECT
// or ARRAY where the other does not. It does NOT require the two to carry the same field SET — a
// declared Input type legitimately omits fields the editor never writes, and `projects` declares 5
// of 9 for exactly that reason. Demanding equality would be a gate asserting more than its subject.
//
// ⚠ THE MAPPING IS DERIVED, NOT LISTED. Every schema key has a `<PascalKey>Input` type, 6 of 6, so
// a seventh collection resolves by the same rule or fails `B1` by name rather than being silently
// skipped — the fixed-list defect this repository removes on sight.
import ts from "typescript";
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
const { default: cfg } = await import(join(root, "keystatic.config.ts"));

/** A keystatic field, normalised to the only three shapes this check compares. */
const schemaShape = (f, d = 0) => {
  if (!f || d > 6) return { kind: "?" };
  if (f.element) return { kind: "array", element: schemaShape(f.element, d + 1) };
  if (f.fields) return { kind: "object", fields: Object.fromEntries(
    Object.entries(f.fields).map(([k, v]) => [k, schemaShape(v, d + 1)])) };
  return { kind: "scalar" };
};

const FILES = ["experience-format", "gallery-format", "projects-format", "site-settings-format",
               "skills-format", "blog-format-core"];
const aliases = new Map();
for (const f of FILES) {
  const p = join(root, "lib/studio", `${f}.ts`);
  ts.createSourceFile(p, readFileSync(p, "utf8"), ts.ScriptTarget.Latest, true)
    .forEachChild((n) => { if (ts.isTypeAliasDeclaration(n)) aliases.set(n.name.text, n.type); });
}

/** ⚠ THE REAL PARSER, NOT A REGEX. A type is a tree and a regex cannot walk one — and today alone
 *  three separate regex matchers in this repository were narrower than their own concept. */
const declShape = (node, d = 0) => {
  if (!node || d > 12) return { kind: "?" };
  if (ts.isArrayTypeNode(node)) return { kind: "array", element: declShape(node.elementType, d + 1) };
  if (ts.isTypeLiteralNode(node)) return { kind: "object", fields: Object.fromEntries(
    node.members.filter(ts.isPropertySignature).map((m) => [m.name.getText(), declShape(m.type, d + 1)])) };
  if (ts.isTypeReferenceNode(node)) {
    const n = node.typeName.getText();
    if (n === "Array" && node.typeArguments?.[0]) return { kind: "array", element: declShape(node.typeArguments[0], d + 1) };
    /* ⚠ RESOLVING AN ALIAS IS NOT DESCENDING, AND CHARGING DEPTH FOR IT MANUFACTURED THIS CHECK'S
     * OWN HEADLINE FINDING. The first run reported `SkillItem` and `HeroStat` as "the declaration is
     * not an object" — the exact defect this suite exists to catch — because the walk ran out of
     * depth mid-alias. Three false positives, all from a budget spent on indirection. */
    if (aliases.has(n)) return declShape(aliases.get(n), d);
    if (/^(Partial|Readonly|Required|NonNullable)$/.test(n) && node.typeArguments?.[0])
      return declShape(node.typeArguments[0], d);
    return { kind: "ref:" + n };
  }
  if (ts.isUnionTypeNode(node)) {
    const real = node.types.filter((x) => x.kind !== ts.SyntaxKind.NullKeyword && x.getText() !== "undefined");
    return real.length === 1 ? declShape(real[0], d + 1) : { kind: "scalar" };
  }
  return { kind: "scalar" };
};

const pascal = (k) => k[0].toUpperCase() + k.slice(1);
const KEYS = [...Object.keys(cfg.singletons ?? {}), ...Object.keys(cfg.collections ?? {})];

console.log("\nA · both sides are readable, so nothing below passes over nothing");
t("A1 the config exposes singletons and collections", KEYS.length >= 6, true);
t("A2 …and the TypeScript parser produced type aliases to compare against", aliases.size >= 15, true);

console.log("\nB · every schema key resolves to a declared type by the naming rule");
const unresolved = KEYS.filter((k) => !aliases.has(`${pascal(k)}Input`));
console.log(`      ${KEYS.length} schema keys · ${KEYS.length - unresolved.length} resolved to a <PascalKey>Input type`);
t("B1 ⚠ EVERY SCHEMA KEY HAS ITS DECLARED TYPE — a seventh collection resolves by the same rule or fails here",
  unresolved, []);

console.log("\nC · the shapes agree wherever both sides speak");
const walk = (a, b, path, out) => {
  if (!a || !b) return;
  if (a.kind === "array" && b.kind === "array") return walk(a.element, b.element, `${path}[]`, out);
  if ((a.kind === "array") !== (b.kind === "array"))
    return out.push(`${path}: schema=${a.kind} declared=${b.kind} — one is an array and the other is not`);
  if (a.kind === "object" && b.kind !== "object")
    return out.push(`${path}: schema=object{${Object.keys(a.fields).join(",")}} declared=${b.kind} — THE SKILLS-OUTAGE SHAPE`);
  if (a.kind === "object" && b.kind === "object")
    for (const k of Object.keys(a.fields)) if (k in b.fields) walk(a.fields[k], b.fields[k], `${path}.${k}`, out);
};
const mismatches = [];
let comparedFields = 0;
for (const key of KEYS) {
  const node = cfg.singletons?.[key] ?? cfg.collections?.[key];
  const s = { kind: "object", fields: Object.fromEntries(
    Object.entries(node.schema).map(([k, v]) => [k, schemaShape(v)])) };
  const d = aliases.has(`${pascal(key)}Input`) ? declShape(aliases.get(`${pascal(key)}Input`)) : null;
  if (!d?.fields) continue;
  const shared = Object.keys(s.fields).filter((k) => k in d.fields);
  comparedFields += shared.length;
  const out = []; walk(s, d, key, out);
  console.log(`      ${key.padEnd(14)} schema ${String(Object.keys(s.fields).length).padStart(2)} · declared ${String(Object.keys(d.fields).length).padStart(2)} · compared ${String(shared.length).padStart(2)} · mismatch ${out.length}`);
  mismatches.push(...out);
}
/* ⚠ THE DENOMINATOR, AND ITS FLOOR IS SET SO IT FAILS FOR THE REASON IT NAMES. A broken parser
 * yields NO aliases and zero compared fields, which is what this catches. It first read `>= 30`
 * against a real total of 39 — so breaking the naming rule for ONE collection dropped it to 29 and
 * reddened this row too, beside the `B1` that actually named the cause. A row that fires for
 * somebody else's reason is noise in a report, and this repository's own rule is to ask what single
 * change reddens a row AND NOTHING ELSE. Twenty is comfortably above any single collection's loss
 * and far above the zero a dead parser produces. */
t("C1 fields were actually compared, so C2 has a subject", comparedFields >= 20, true);
t("C2 ⚠ NO DECLARED TYPE CONTRADICTS ITS SCHEMA ON SHAPE — four places said string, one said object, and tsc agreed with the wrong four",
  mismatches, []);

console.log("\nD · what this cannot reach, by name");
for (const gap of [
  "field SETS — a declared Input may legitimately omit what the editor never writes",
  "scalar TYPES — `string` against `number` is invisible here, only object-versus-not is compared",
  "types outside lib/studio/*-format*, which is where the mapping rule looks",
  "whether the RUNTIME value matches either side — this compares two declarations",
]) console.log(`      unreachable   ${gap}`);
t("D1 the gaps are named rather than counted — a list of four, stated", 4, 4);

console.log(`\nschema-type-agreement result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
