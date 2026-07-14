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
import { adaptSections } from "../../lib/case-studies/adapter.ts";

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
  // tier 3 — each edits a TEXT field on a block that also carries nulls and image
  // srcs, so hazards 1 and 2 ride on the same assertion.
  deviceShelf: (v) => (v.devices[0].alt = "EDITED alt text"),
  featureRows: (v) => (v.features[0].title = "EDITED feature title"),
  annotatedImage: (v) => (v.callouts[0].note = "EDITED callout note"),
  heroCover: (v) => (v.title = "EDITED hero title"),
  beforeAfter: (v) => (v.pairs[0].title = "EDITED pair title"),
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

/* ----------------------------------- hazard 1: nulls round-trip AS NULL */

console.log("\nhazard 1 — nulls stay null (not '' and not 0)");

/** Walk every leaf and collect `path -> null` for each null in the doc. */
function nullPaths(v, at = "", out = []) {
  if (v === null) out.push(at);
  else if (Array.isArray(v)) v.forEach((x, i) => nullPaths(x, `${at}[${i}]`, out));
  else if (v && typeof v === "object") for (const k of Object.keys(v)) nullPaths(v[k], `${at}.${k}`, out);
  return out;
}

for (const slug of SLUGS) {
  const raw = fileOf(slug);
  const sections = readSections(raw);
  const before = nullPaths(sections);

  check(`${slug}: the file carries nulls at all (else this proves nothing)`, () => {
    if (before.length === 0) throw new Error("no nulls in this file");
  });

  // Edit a TEXT field on a null-bearing block; every null must survive untouched.
  const at = find(sections, "deviceShelf");
  if (at) {
    check(`${slug}: editing a sibling text field leaves all ${before.length} nulls NULL`, () => {
      const [i, j] = at;
      const after = roundTrip(raw, (secs) => (secs[i].blocks[j].value.devices[0].alt = "NULL PROBE"));
      const paths = nullPaths(load(after).sections);
      if (JSON.stringify(paths) !== JSON.stringify(before)) {
        const gone = before.filter((p) => !paths.includes(p));
        throw new Error(`null set changed; ${gone.length} coerced away, e.g. ${gone[0]}`);
      }
      // and they are literally `null` in the bytes, not '' or 0
      if (!/rotate: null/.test(after)) throw new Error("`rotate: null` no longer in the bytes");
    });
  }
}

check("the sanitizer REJECTS '' where a number|null belongs (a coercing form)", () => {
  const raw = fileOf("fosfor-ai");
  const sections = transported(readSections(raw));
  const at = find(sections, "deviceShelf");
  sections[at[0]].blocks[at[1]].value.devices[0].rotate = "";
  const res = sanitizeSectionsPatch(sections);
  if (res.ok) throw new Error("ACCEPTED '' for a number|null");
  if (!res.error.message.includes("must be a number or null")) throw new Error(res.error.message);
});

check("the sanitizer REJECTS 0-for-null coercion being undetectable (0 is a real value)", () => {
  const raw = fileOf("fosfor-ai");
  const sections = transported(readSections(raw));
  const at = find(sections, "deviceShelf");
  sections[at[0]].blocks[at[1]].value.devices[0].rotate = 0;
  const res = sanitizeSectionsPatch(sections);
  // 0 is legitimately a number, so the sanitizer accepts it — the surgical bar is
  // what catches an unintended 0, which is why hazard 1 needs the byte-diff above.
  if (!res.ok) throw new Error("rejected a legitimate 0");
});

check("the sanitizer REJECTS NaN dressed as a number", () => {
  // NaN cannot cross the wire as NaN (JSON.stringify(NaN) is null), so this guards
  // the in-process path and documents that .nan could never reach the yaml.
  const raw = fileOf("fosfor-ai");
  const sections = transported(readSections(raw));
  const at = find(sections, "deviceShelf");
  sections[at[0]].blocks[at[1]].value.minHeight = NaN;
  const res = sanitizeSectionsPatch(sections);
  if (res.ok) throw new Error("ACCEPTED NaN");
  if (!res.error.message.includes("finite")) throw new Error(res.error.message);
});

/* -------------------------------- hazard 2: image srcs round-trip untouched */

console.log("\nhazard 2 — image srcs are never disturbed by a text edit");

const srcPaths = (v, at = "", out = []) => {
  if (Array.isArray(v)) v.forEach((x, i) => srcPaths(x, `${at}[${i}]`, out));
  else if (v && typeof v === "object")
    for (const k of Object.keys(v)) {
      if (k === "src") out.push(`${at}.src=${v[k]}`);
      else srcPaths(v[k], `${at}.${k}`, out);
    }
  return out;
};

const IMAGE_BEARING = [
  ["deviceShelf", (v) => (v.devices[0].alt = "SRC PROBE")],
  ["featureRows", (v) => (v.features[0].title = "SRC PROBE")],
  ["annotatedImage", (v) => (v.callouts[0].note = "SRC PROBE")],
  ["heroCover", (v) => (v.title = "SRC PROBE")],
  ["beforeAfter", (v) => (v.pairs[0].title = "SRC PROBE")],
];

for (const slug of SLUGS) {
  const raw = fileOf(slug);
  const sections = readSections(raw);
  const before = srcPaths(sections);
  for (const [kind, mutate] of IMAGE_BEARING) {
    const at = find(sections, kind);
    if (!at) continue;
    check(`${slug} / ${kind}: a text edit leaves all ${before.length} image srcs byte-identical`, () => {
      const [i, j] = at;
      const after = roundTrip(raw, (secs) => mutate(secs[i].blocks[j].value));
      const now = srcPaths(load(after).sections);
      if (JSON.stringify(now) !== JSON.stringify(before)) throw new Error("an image src changed");
    });
  }
}

check("the sanitizer REJECTS '' for an image src (null is how unset is spelled)", () => {
  const raw = fileOf("fosfor-ai");
  const sections = transported(readSections(raw));
  const at = find(sections, "deviceShelf");
  sections[at[0]].blocks[at[1]].value.devices[0].src = "";
  const res = sanitizeSectionsPatch(sections);
  if (res.ok) throw new Error("ACCEPTED '' for an image src");
});

/* ------ an add that needs an image is caught at PUBLISH (P4 4b-iv) */

// SUPERSEDED, DELIBERATELY. This block used to assert "every add affordance yields
// ssg-publishable content", enforced by HIDING add on the three image-bearing arrays
// — because an added row's src is null, preview substitutes a placeholder, and the
// owner would only discover the problem as a failed Vercel build that blocked every
// unrelated edit too.
//
// 4(b)-iv un-gates them, and upload alone did NOT make that safe: a new row is still
// born src:null. What makes it safe is that the gate MOVED to where it can actually
// check — publish now re-renders every changed project through the ssg adapter and
// refuses an unpublishable draft (lib/studio/validate-draft-sections.ts). The
// guarantee is unchanged; the mechanism is honest instead of preventative.
//
// So the assertion inverts: an image-bearing row CAN now be added, and the publish
// validator MUST catch it.
console.log("\nan add that needs an image is refused at PUBLISH, not at the build");

const emptyImg = () => ({ src: null, alt: "", width: null, rotate: null, translateX: null, translateY: null, z: null });

const NEEDS_IMAGE = [
  ["deviceShelf.devices", "deviceShelf", (v) => v.devices.push({ ...emptyImg(), label: "", dotColor: "" })],
  ["featureRows.features", "featureRows", (v) => v.features.push({ index: "", category: "", title: "", body: "", image: emptyImg() })],
  ["beforeAfter.pairs", "beforeAfter", (v) => v.pairs.push({ title: "", tag: "", before: emptyImg(), after: emptyImg(), changes: [] })],
];

for (const [label, kind, push] of NEEDS_IMAGE) {
  const raw = fileOf("fosfor-ai");
  const at = find(readSections(raw), kind);
  if (!at) continue;
  const [i, j] = at;
  check(`${label}: an added row without an image is REFUSED at publish`, () => {
    const secs = transported(readSections(raw));
    push(secs[i].blocks[j].value);
    const san = sanitizeSectionsPatch(secs);
    if (!san.ok) throw new Error(`sanitizer: ${san.error.message}`);
    // validateProjectSections is a typed wrapper whose ONLY logic is this adapter
    // call (it cannot be imported here: it imports adaptSections as a value, which
    // node needs a .ts extension for and tsc forbids). The wrapper itself is proven
    // end-to-end through the real publish route.
    let threw = null;
    try { adaptSections(san.sections, { mode: "ssg" }); } catch (e) { threw = e.message; }
    if (!threw) throw new Error("publish would ACCEPT a draft the build cannot render");
    if (!threw.includes("image src is missing")) throw new Error(threw);
  });
  check(`${label}: the same row WITH an image publishes fine`, () => {
    const secs = transported(readSections(raw));
    push(secs[i].blocks[j].value);
    // set every null src, as an upload would
    const fill = (o) => {
      if (Array.isArray(o)) return o.forEach(fill);
      if (o && typeof o === "object") {
        for (const k of Object.keys(o)) {
          if (k === "src" && o[k] === null) o[k] = "/images/projects/fosfor-ai/blocks/abc123abc123.webp";
          else fill(o[k]);
        }
      }
    };
    fill(secs[i].blocks[j].value);
    const san = sanitizeSectionsPatch(secs);
    if (!san.ok) throw new Error(`sanitizer: ${san.error.message}`);
    adaptSections(san.sections, { mode: "ssg" }); // throws if still unpublishable
  });
}

/* ------------------- hazard 3: swatchTokens, the nested union */

// NO REAL FILE CARRIES A swatchTokens (nor an issueList, nor an annotatedImage),
// so this builds a SYNTHETIC base — and builds it with the real serializer, from a
// real file, so it is a genuine on-disk-shaped project rather than a hand-written
// fixture. Stated plainly because a synthetic base proves less than a real one.
console.log("\nhazard 3 — swatchTokens: groups[] -> tokens[] -> a {discriminant,value} union");
console.log("  (no real file carries one — the base below is SYNTHETIC, built by the real serializer)");

const SWATCH_BLOCK = {
  discriminant: "swatchTokens",
  value: {
    groups: [
      {
        tokens: [
          { discriminant: "color", value: { name: "Ink", value: "oklch(.2 0 0)", hex: "#1a1a1a" } },
          { discriminant: "font", value: { name: "Fraunces", note: "Display" } },
        ],
      },
      {
        tokens: [{ discriminant: "color", value: { name: "Cream", value: "oklch(.97 .01 80)", hex: "" } }],
      },
    ],
  },
};

const swatchBase = (() => {
  const raw = fileOf("fosfor-ai");
  const secs = transported(readSections(raw));
  secs[0].blocks.push(JSON.parse(JSON.stringify(SWATCH_BLOCK)));
  const san = sanitizeSectionsPatch(secs);
  if (!san.ok) throw new Error(`fixture rejected: ${san.error.message}`);
  const out = serializeProjectSections(raw, san.sections);
  if (!out.ok) throw new Error("fixture serialize refused");
  return out.bytes;
})();

check("the synthetic base is a valid file the sanitizer accepts round-trip", () => {
  const res = sanitizeSectionsPatch(transported(readSections(swatchBase)));
  if (!res.ok) throw new Error(res.error.message);
  if (!/discriminant: swatchTokens/.test(swatchBase)) throw new Error("no swatchTokens in the base");
});

check("swatchTokens: editing ONE token's value changes only that token", () => {
  const at = find(readSections(swatchBase), "swatchTokens");
  const [i, j] = at;
  const after = roundTrip(swatchBase, (secs) => {
    secs[i].blocks[j].value.groups[0].tokens[0].value.name = "EDITED token name";
  });
  const { before: b0, after: a0 } = assertOnlyChange(swatchBase, after, null, null);
  assertOnlyField(b0, a0, "groups");
  const bg = b0.groups, ag = a0.groups;
  if (bg.length !== ag.length) throw new Error("group count changed");
  const changed = [];
  bg.forEach((g, gi) =>
    g.tokens.forEach((t, ti) => {
      if (JSON.stringify(t) !== JSON.stringify(ag[gi].tokens[ti])) changed.push(`${gi}/${ti}`);
    })
  );
  if (changed.length !== 1) throw new Error(`${changed.length} tokens changed, expected 1`);
  if (changed[0] !== "0/0") throw new Error(`the wrong token changed: ${changed[0]}`);
  if (ag[0].tokens[0].discriminant !== "color") throw new Error("the discriminant changed");
  // the SIBLING font token and the second group must be verbatim
  if (JSON.stringify(ag[0].tokens[1]) !== JSON.stringify(bg[0].tokens[1])) throw new Error("the sibling font token changed");
  if (JSON.stringify(ag[1]) !== JSON.stringify(bg[1])) throw new Error("group 2 changed");
});

check("swatchTokens: every token's discriminant survives an edit verbatim", () => {
  const at = find(readSections(swatchBase), "swatchTokens");
  const [i, j] = at;
  const before = readSections(swatchBase)[i].blocks[j].value.groups.flatMap((g) => g.tokens.map((t) => t.discriminant));
  const after = roundTrip(swatchBase, (secs) => {
    secs[i].blocks[j].value.groups[0].tokens[0].value.hex = "#000000";
  });
  const now = load(after).sections[i].blocks[j].value.groups.flatMap((g) => g.tokens.map((t) => t.discriminant));
  if (JSON.stringify(before) !== JSON.stringify(now)) throw new Error(`discriminants moved: ${before} -> ${now}`);
});

check("swatchTokens: a nested token ADD keeps every other token verbatim + empties intact", () => {
  const at = find(readSections(swatchBase), "swatchTokens");
  const [i, j] = at;
  const after = roundTrip(swatchBase, (secs) => {
    secs[i].blocks[j].value.groups[0].tokens.push({ discriminant: "color", value: { name: "", value: "", hex: "" } });
  });
  const { before: b0, after: a0 } = assertOnlyChange(swatchBase, after, null, null);
  const bg = b0.groups, ag = a0.groups;
  if (ag[0].tokens.length !== bg[0].tokens.length + 1) throw new Error("tokens did not grow by 1");
  if (JSON.stringify(ag[0].tokens.slice(0, -1)) !== JSON.stringify(bg[0].tokens)) throw new Error("an existing token changed");
  if (JSON.stringify(ag[1]) !== JSON.stringify(bg[1])) throw new Error("group 2 changed");
  const added = ag[0].tokens[ag[0].tokens.length - 1];
  if (JSON.stringify(Object.keys(added.value).sort()) !== JSON.stringify(["hex", "name", "value"]))
    throw new Error(`new token's empties dropped: ${Object.keys(added.value)}`);
});

const swatchReject = (name, mutate, needle) =>
  check(name, () => {
    const secs = transported(readSections(swatchBase));
    const [i, j] = find(secs, "swatchTokens");
    mutate(secs[i].blocks[j].value);
    const res = sanitizeSectionsPatch(secs);
    if (res.ok) throw new Error("ACCEPTED");
    if (needle && !res.error.message.includes(needle)) throw new Error(`wrong error: ${res.error.message}`);
  });

swatchReject("an unknown TOKEN kind is rejected", (v) => (v.groups[0].tokens[0].discriminant = "gradient"), "unknown token kind");
swatchReject("a prototype key is not a token kind (hasOwnProperty, not `in`)", (v) => (v.groups[0].tokens[0].discriminant = "constructor"), "unknown token kind");
swatchReject("a font value under a color discriminant is rejected (shape follows kind)", (v) => (v.groups[0].tokens[0].value = { name: "x", note: "y" }), "unknown field");
swatchReject("a token missing hex is rejected (an empty-stripping form)", (v) => (v.groups[0].tokens[0].value = { name: "x", value: "y" }), "must be a string");
swatchReject("an unknown field on the group is rejected", (v) => (v.groups[0].evil = 1), "unknown field");

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
