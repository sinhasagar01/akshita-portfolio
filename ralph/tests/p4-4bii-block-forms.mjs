// P4 4(b)-ii test — the surgical bar per kind, and the per-kind sanitizer.
// Run: node --experimental-strip-types ralph/tests/p4-4bii-block-forms.mjs
//
// THE BAR (4(b)-i's, now for every kind): editing ONE field of ONE block must
// produce a file where only that field's lines changed — every other block, and
// every OTHER FIELD of the edited block, byte-identical. Nested-array add / remove
// / reorder must clear the same bar.
//
// Everything runs through JSON transport, because that is what the route delivers
// and because the load path hid the 4(b)-i anchor bug for a whole sub-gate.
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { serializeProjectSections, readSections } from "../../lib/studio/sections-serialize.ts";
import { sanitizeSectionsPatch } from "../../lib/studio/sections-format.ts";

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    failures++;
    console.log(`  [FAIL] ${name} — ${e.message}`);
  }
}

const SLUGS = ["fosfor-ai", "fosfor-data-profiling", "elevate-one-view"];
const fileOf = (s) => readFileSync(`content/projects/${s}.yaml`, "utf8");
const transported = (v) => JSON.parse(JSON.stringify(v));

/** The full editor round-trip: read -> JSON transport -> mutate -> sanitize -> serialize. */
function roundTrip(raw, mutate) {
  const sections = transported(readSections(raw));
  mutate(sections);
  const san = sanitizeSectionsPatch(sections);
  if (!san.ok) throw new Error(`sanitizer REJECTED: ${san.error.field} — ${san.error.message}`);
  const out = serializeProjectSections(raw, san.sections);
  if (!out.ok) throw new Error(`serializer refused: ${out.error.message}`);
  return out.bytes;
}

/** Find the first block of `kind`, or null. */
function find(sections, kind) {
  for (const [i, s] of sections.entries()) {
    for (const [j, b] of s.blocks.entries()) if (b.discriminant === kind) return [i, j];
  }
  return null;
}

/** Assert exactly the intended change: compare the parsed docs field by field. */
function assertOnlyChange(rawBefore, rawAfter, path, expected) {
  const a = load(rawBefore).sections;
  const b = load(rawAfter).sections;
  if (a.length !== b.length) throw new Error("section count changed");

  const diffs = [];
  a.forEach((s, i) =>
    s.blocks.forEach((blk, j) => {
      if (JSON.stringify(blk) !== JSON.stringify(b[i].blocks[j])) diffs.push(`${i}/${j}`);
    })
  );
  if (diffs.length !== 1) throw new Error(`${diffs.length} blocks changed, expected 1 (${diffs})`);

  // the section SHELLS (glow, title, variant, …) must all be untouched
  const shell = (s) => {
    const { blocks, ...rest } = s;
    return rest;
  };
  if (JSON.stringify(a.map(shell)) !== JSON.stringify(b.map(shell))) {
    throw new Error("a section shell changed");
  }
  // the head + body: [] region must be byte-identical
  const ai = rawBefore.indexOf("\nsections:");
  const bi = rawAfter.indexOf("\nsections:");
  if (rawBefore.slice(0, ai + 1) !== rawAfter.slice(0, bi + 1)) throw new Error("head changed");
  // no anchors ever
  if (/&ref|\*ref/.test(rawAfter)) throw new Error("anchors leaked");

  const [i, j] = diffs[0].split("/").map(Number);
  return { before: a[i].blocks[j].value, after: b[i].blocks[j].value };
}

/** Assert two block values differ ONLY at `key`. */
function assertOnlyField(before, after, key) {
  const x = { ...before },
    y = { ...after };
  delete x[key];
  delete y[key];
  if (JSON.stringify(x) !== JSON.stringify(y)) {
    throw new Error(`fields other than ${key} changed`);
  }
  if (JSON.stringify(before[key]) === JSON.stringify(after[key])) {
    throw new Error(`${key} did not actually change — the test proved nothing`);
  }
}

/* ------------------------------------------------- the surgical bar per kind */

// One representative single-field edit per tier 1-2 kind. Each mutates exactly one
// leaf and asserts nothing else in the file moved.
const EDITS = {
  closingLine: (v) => (v.text = "EDITED closing line."),
  pullQuote: (v) => (v.text = "EDITED pull quote with **bold**."),
  richText: (v) => (v.paragraphs[0] = "EDITED paragraph with **bold**."),
  glanceGrid: (v) => (v.items[0].value = "EDITED value"),
  issueList: (v) => (v.items[0].note = "EDITED note"),
  stepper: (v) => (v.steps[0].text = "EDITED step text"),
  statCards: (v) => (v.stats[0].body = "EDITED stat body with **bold**."),
  principleCards: (v) => (v.cards[0].title = "EDITED card title"),
};

console.log("the surgical bar — one field of one block, on the real files");
const seen = new Set();
for (const slug of SLUGS) {
  const raw = fileOf(slug);
  const sections = readSections(raw);
  for (const [kind, mutate] of Object.entries(EDITS)) {
    const at = find(sections, kind);
    if (!at) continue;
    seen.add(kind);
    check(`${slug} / ${kind}: one field changes, all else byte-identical`, () => {
      const [i, j] = at;
      const after = roundTrip(raw, (secs) => mutate(secs[i].blocks[j].value));
      assertOnlyChange(raw, after, null, null);
    });
  }
}
console.log(`  kinds covered by a real file: ${[...seen].sort().join(", ")}`);
for (const kind of Object.keys(EDITS)) {
  if (!seen.has(kind)) console.log(`  [NOTE] ${kind} — no real file carries one, covered by shape only`);
}

/* -------------------------------------- the same bar for nested add/remove/reorder */

console.log("\nnested-array add / remove / reorder — the same bar");

const NESTED = [
  ["statCards", "stats", () => ({ value: "", suffix: "", body: "", tag: "", highlighted: false })],
  ["principleCards", "cards", () => ({ index: "", title: "", body: "" })],
  ["glanceGrid", "items", () => ({ label: "", value: "" })],
  ["issueList", "items", () => ({ title: "", note: "" })],
  ["stepper", "steps", () => ({ label: "", text: "" })],
];

for (const slug of SLUGS) {
  const raw = fileOf(slug);
  const sections = readSections(raw);
  for (const [kind, arrayKey, empty] of NESTED) {
    const at = find(sections, kind);
    if (!at) continue;
    const [i, j] = at;

    check(`${slug} / ${kind}.${arrayKey}: ADD — only the array grows, empties preserved`, () => {
      const after = roundTrip(raw, (secs) => secs[i].blocks[j].value[arrayKey].push(empty()));
      const { before: b0, after: a0 } = assertOnlyChange(raw, after, null, null);
      assertOnlyField(b0, a0, arrayKey);
      if (a0[arrayKey].length !== b0[arrayKey].length + 1) throw new Error("array did not grow by 1");
      // the pre-existing rows must be byte-identical, and the NEW row must carry
      // every key the schema declares (an omitted one would drop from the file)
      if (JSON.stringify(a0[arrayKey].slice(0, -1)) !== JSON.stringify(b0[arrayKey])) {
        throw new Error("an existing row changed");
      }
      const added = a0[arrayKey][a0[arrayKey].length - 1];
      const wantKeys = Object.keys(empty()).sort();
      if (JSON.stringify(Object.keys(added).sort()) !== JSON.stringify(wantKeys)) {
        throw new Error(`new row keys ${Object.keys(added)} != schema keys ${wantKeys}`);
      }
    });

    check(`${slug} / ${kind}.${arrayKey}: REMOVE — only that row goes`, () => {
      const orig = readSections(raw)[i].blocks[j].value[arrayKey];
      if (orig.length < 2) throw new Error("skip: needs 2+ rows"); // surfaced, not hidden
      const after = roundTrip(raw, (secs) => secs[i].blocks[j].value[arrayKey].splice(0, 1));
      const { before: b0, after: a0 } = assertOnlyChange(raw, after, null, null);
      assertOnlyField(b0, a0, arrayKey);
      if (JSON.stringify(a0[arrayKey]) !== JSON.stringify(b0[arrayKey].slice(1))) {
        throw new Error("remove changed more than the removed row");
      }
    });

    check(`${slug} / ${kind}.${arrayKey}: REORDER — the rows swap, verbatim`, () => {
      const orig = readSections(raw)[i].blocks[j].value[arrayKey];
      if (orig.length < 2) throw new Error("skip: needs 2+ rows");
      const after = roundTrip(raw, (secs) => {
        const arr = secs[i].blocks[j].value[arrayKey];
        [arr[0], arr[1]] = [arr[1], arr[0]];
      });
      const { before: b0, after: a0 } = assertOnlyChange(raw, after, null, null);
      assertOnlyField(b0, a0, arrayKey);
      const want = [...b0[arrayKey]];
      [want[0], want[1]] = [want[1], want[0]];
      if (JSON.stringify(a0[arrayKey]) !== JSON.stringify(want)) {
        throw new Error("reorder did not preserve the rows verbatim");
      }
    });
  }
}

/* ------------------------------------------------- the per-kind sanitizer */

console.log("\nthe per-kind sanitizer — strict, one layer deeper than 4(b)-i");

const shell = (blocks) => [
  {
    variant: "default",
    id: "x",
    index: "",
    eyebrow: "",
    title: "",
    lead: "",
    northStar: "",
    layout: "stack",
    glow: { text: "", top: "", right: "", bottom: "", left: "", size: "" },
    blocks,
  },
];
const rejects = (name, blocks, needle) =>
  check(name, () => {
    const res = sanitizeSectionsPatch(shell(blocks));
    if (res.ok) throw new Error("ACCEPTED a malformed patch");
    if (needle && !res.error.message.includes(needle)) {
      throw new Error(`wrong error: ${res.error.message}`);
    }
  });

rejects(
  "closingLine: unknown field",
  [{ discriminant: "closingLine", value: { text: "x", evil: 1 } }],
  "unknown field"
);
rejects("richText: paragraphs not an array", [{ discriminant: "richText", value: { paragraphs: "x" } }], "must be an array");
rejects("richText: a non-string paragraph", [{ discriminant: "richText", value: { paragraphs: [1] } }], "must be a string");
rejects("glanceGrid: item missing a field", [{ discriminant: "glanceGrid", value: { items: [{ label: "a" }] } }], "must be a string");
rejects("issueList: unknown item field", [{ discriminant: "issueList", value: { items: [{ title: "a", note: "b", x: 1 }] } }], "unknown field");
rejects("stepper: wrong type", [{ discriminant: "stepper", value: { steps: [{ label: 1, text: "b" }] } }], "must be a string");
rejects(
  "statCards: highlighted must be a BOOLEAN, not a string",
  [{ discriminant: "statCards", value: { heading: "", stats: [{ value: "1", suffix: "", body: "", tag: "", highlighted: "yes" }] } }],
  "must be a boolean"
);
rejects(
  "statCards: a stat missing `highlighted` is REJECTED (an empty-stripping form)",
  [{ discriminant: "statCards", value: { heading: "", stats: [{ value: "1", suffix: "", body: "", tag: "" }] } }],
  "must be a boolean"
);
rejects("statCards: missing heading is rejected", [{ discriminant: "statCards", value: { stats: [] } }], "must be a string");
rejects(
  "principleCards: unknown card field",
  [{ discriminant: "principleCards", value: { heading: "", subhead: "", cards: [{ index: "", title: "", body: "", evil: 1 }] } }],
  "unknown field"
);
rejects("an unknown kind is still rejected", [{ discriminant: "featureStory", value: {} }], "unknown block kind");
// The discriminant is untrusted: `"constructor" in VALIDATORS` is true on any plain
// object, so a membership test using `in` would let this through as a known kind.
rejects("a prototype key is not a known kind", [{ discriminant: "constructor", value: {} }], "unknown block kind");
rejects("a prototype key (__proto__) is not a known kind", [{ discriminant: "__proto__", value: {} }], "unknown block kind");

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
