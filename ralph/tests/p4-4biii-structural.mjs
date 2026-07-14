// P4 4(b)-iii test — structural edits (add / remove / reorder) at two levels.
// Run: node --experimental-strip-types ralph/tests/p4-4biii-structural.mjs
//
// Three things are proven here:
//  1. The 14 empties are BORN VALID — each passes the sanitizer (every key, the
//     length guards) and each is either ssg-publishable or explicitly gated.
//  2. The structural surgical bar — an add/remove/reorder changes ONLY that, and a
//     REORDER re-emits the moved blocks byte-for-byte (it moves already-read values;
//     it must not re-serialize them differently).
//  3. The id-lockstep — the parallel stable-id array is what `setBlockValue`
//     addresses through, so a structural op that misses it edits the WRONG block.
//     The primitives are exercised directly against that failure.
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { serializeProjectSections, readSections } from "../../lib/studio/sections-serialize.ts";
import { sanitizeSectionsPatch } from "../../lib/studio/sections-format.ts";
import { adaptSections } from "../../lib/case-studies/adapter.ts";
import { moveIn, removeAt, insertAt, setAt } from "../../components/studio/useItemList.ts";
import { BLOCK_EMPTIES, ADD_GATED_UNTIL_UPLOAD } from "../../components/studio/blocks/empties.ts";

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

const raw = readFileSync("content/projects/fosfor-ai.yaml", "utf8");
const transported = (v) => JSON.parse(JSON.stringify(v));
const fresh = () => transported(readSections(raw));

function roundTrip(mutate) {
  const sections = fresh();
  mutate(sections);
  const san = sanitizeSectionsPatch(sections);
  if (!san.ok) throw new Error(`sanitizer REJECTED: ${san.error.field} — ${san.error.message}`);
  const out = serializeProjectSections(raw, san.sections);
  if (!out.ok) throw new Error(`serializer refused: ${out.error.message}`);
  return out.bytes;
}

/** Serialize each block on its own, so two files' blocks can be compared as bytes. */
const blockBytes = (yaml) =>
  load(yaml).sections.flatMap((s, i) => s.blocks.map((b, j) => [`${s.id}/${j}`, JSON.stringify(b)]));

/* ------------------------------------------- 1. the 14 empties are born valid */

console.log("the 14 empties — born passing the sanitizer");

// The REAL empties, imported — not restated. They live in their own .ts (not in
// registry.tsx, which has JSX and cannot be strip-typed) precisely so this suite and
// the registry read the same source; a copy here would be a copy nothing checks.
const EMPTIES = Object.fromEntries(
  Object.entries(BLOCK_EMPTIES).map(([k, f]) => [k, f()])
);
const glow = () => ({ text: "", top: "", right: "", bottom: "", left: "", size: "" });

/** The two kinds the picker withholds — imported, so the gate the suite asserts IS
 *  the gate the picker applies. */
const GATED = ADD_GATED_UNTIL_UPLOAD;

for (const [kind, value] of Object.entries(EMPTIES)) {
  check(`${kind}: an added empty passes the sanitizer and is SURGICAL`, () => {
    const before = load(raw).sections;
    const after = roundTrip((secs) => secs[0].blocks.push({ discriminant: kind, value: transported(value) }));
    const a = load(after).sections;
    if (a[0].blocks.length !== before[0].blocks.length + 1) throw new Error("block count did not grow by 1");
    // every PRE-EXISTING block, in every section, byte-identical
    const b0 = blockBytes(raw);
    const a0 = blockBytes(after).filter(([k]) => k !== `${a[0].id}/${a[0].blocks.length - 1}`);
    if (JSON.stringify(a0) !== JSON.stringify(b0)) throw new Error("an existing block changed");
    // the head is untouched
    if (raw.slice(0, raw.indexOf("\nsections:")) !== after.slice(0, after.indexOf("\nsections:")))
      throw new Error("head changed");
  });
}

console.log("\nthe 14 empties — publishable, or gated for a proven reason");
for (const [kind, value] of Object.entries(EMPTIES)) {
  const build = () => {
    const secs = fresh();
    secs[0].blocks.push({ discriminant: kind, value: transported(value) });
    const san = sanitizeSectionsPatch(secs);
    if (!san.ok) throw new Error(san.error.message);
    return san.sections;
  };
  if (GATED.has(kind)) {
    check(`${kind}: withheld from the picker BECAUSE its empty is unpublishable`, () => {
      let threw = false;
      try { adaptSections(build(), { mode: "ssg" }); } catch { threw = true; }
      if (!threw) throw new Error("ssg now ACCEPTS it — it can be un-gated (4b-iv likely landed)");
    });
  } else {
    check(`${kind}: offered by the picker AND ssg-publishable`, () => {
      adaptSections(build(), { mode: "ssg" });
    });
  }
}

check("heroCover's empty carries EXACTLY 2 devices (arrayOfLen would reject [])", () => {
  const secs = fresh();
  secs[0].blocks.push({ discriminant: "heroCover", value: { ...transported(EMPTIES.heroCover), devices: [] } });
  const res = sanitizeSectionsPatch(secs);
  if (res.ok) throw new Error("devices: [] was ACCEPTED — the length guard is not biting");
  if (!res.error.message.includes("exactly 2")) throw new Error(res.error.message);
});

/* --------------------------------------- 2. the structural surgical bar */

console.log("\nthe structural surgical bar");

check("REMOVE a block: only that block goes, every other byte-identical", () => {
  const before = blockBytes(raw);
  const after = roundTrip((secs) => secs[0].blocks.splice(0, 1));
  const now = blockBytes(after);
  const removed = before[0];
  if (JSON.stringify(now) !== JSON.stringify(before.slice(1))) throw new Error("more than the removed block changed");
  if (now.some(([, v]) => v === removed[1] && removed[1] !== before[1]?.[1])) throw new Error("the removed block is still present");
});

check("REORDER two blocks: bytes identical, only the ORDER changed", () => {
  const sec = load(raw).sections.findIndex((s) => s.blocks.length >= 2);
  if (sec < 0) throw new Error("no section with 2+ blocks");
  const before = load(raw).sections[sec].blocks.map((b) => JSON.stringify(b));
  const after = roundTrip((secs) => {
    const bs = secs[sec].blocks;
    [bs[0], bs[1]] = [bs[1], bs[0]];
  });
  const now = load(after).sections[sec].blocks.map((b) => JSON.stringify(b));
  const want = [...before];
  [want[0], want[1]] = [want[1], want[0]];
  if (JSON.stringify(now) !== JSON.stringify(want)) throw new Error("reorder did not preserve the blocks verbatim");
  // and NO other section moved
  const bAll = blockBytes(raw).filter(([k]) => !k.startsWith(`${load(raw).sections[sec].id}/`));
  const aAll = blockBytes(after).filter(([k]) => !k.startsWith(`${load(raw).sections[sec].id}/`));
  if (JSON.stringify(aAll) !== JSON.stringify(bAll)) throw new Error("another section changed");
});

check("REORDER two SECTIONS: bytes identical, only the order changed", () => {
  const before = load(raw).sections.map((s) => JSON.stringify(s));
  const after = roundTrip((secs) => { [secs[1], secs[2]] = [secs[2], secs[1]]; });
  const now = load(after).sections.map((s) => JSON.stringify(s));
  const want = [...before];
  [want[1], want[2]] = [want[2], want[1]];
  if (JSON.stringify(now) !== JSON.stringify(want)) throw new Error("section reorder re-serialized something");
});

check("REORDER moves image srcs verbatim — no file rename (the locked-3 safety)", () => {
  const sec = load(raw).sections.findIndex((s) => s.blocks.length >= 2);
  const srcs = (y) => (y.match(/^ +src: .*/gm) || []).sort().join("|");
  const after = roundTrip((secs) => {
    const bs = secs[sec].blocks;
    [bs[0], bs[1]] = [bs[1], bs[0]];
  });
  // The SET of srcs is unchanged: a src is a verbatim string inside the block's
  // value, and studio never derives a filename from position (which is exactly what
  // Keystatic does, and why it is locked out).
  if (srcs(raw) !== srcs(after)) throw new Error("an image src changed on reorder");
});

check("REMOVE a section: only that section goes", () => {
  const before = load(raw).sections.map((s) => JSON.stringify(s));
  const after = roundTrip((secs) => secs.splice(3, 1));
  const now = load(after).sections.map((s) => JSON.stringify(s));
  const want = before.filter((_, i) => i !== 3);
  if (JSON.stringify(now) !== JSON.stringify(want)) throw new Error("more than the removed section changed");
});

check("ADD a section: only the new one appears, all others byte-identical", () => {
  const before = load(raw).sections.map((s) => JSON.stringify(s));
  const after = roundTrip((secs) =>
    secs.push({ variant: "default", id: "section-99", index: "", eyebrow: "", title: "", lead: "", northStar: "", layout: "stack", glow: glow(), blocks: [] })
  );
  const now = load(after).sections.map((s) => JSON.stringify(s));
  if (JSON.stringify(now.slice(0, -1)) !== JSON.stringify(before)) throw new Error("an existing section changed");
  if (load(after).sections.length !== before.length + 1) throw new Error("section count wrong");
});

check("an added empty section is ssg-publishable", () => {
  const secs = fresh();
  secs.push({ variant: "default", id: "section-99", index: "", eyebrow: "", title: "", lead: "", northStar: "", layout: "stack", glow: glow(), blocks: [] });
  const san = sanitizeSectionsPatch(secs);
  if (!san.ok) throw new Error(san.error.message);
  adaptSections(san.sections, { mode: "ssg" });
});

/* ------------------------------- 2b. the SECTION SHELL form's surgical bar */

// The shell form is new in 4(b)-iii and edits fields that render on the live page
// (title/lead/eyebrow/index/northStar) plus `id`, which is a DOM anchor. Its edits
// need the same bar as a block's: change one field, disturb nothing else.
console.log("\nthe section shell — editing one field is surgical");

const SHELL_EDITS = [
  ["title", (sec) => (sec.title = "EDITED section title")],
  ["lead", (sec) => (sec.lead = "EDITED lead with **bold**.")],
  ["eyebrow", (sec) => (sec.eyebrow = "EDITED eyebrow")],
  ["index", (sec) => (sec.index = "99")],
  ["northStar", (sec) => (sec.northStar = "EDITED north star")],
  ["id", (sec) => (sec.id = "edited-anchor")],
  ["variant", (sec) => (sec.variant = "bare")],
  ["layout", (sec) => (sec.layout = "split")],
  ["glow.text", (sec) => (sec.glow = { ...sec.glow, text: "EDITED glow" })],
];

for (const [field, mutate] of SHELL_EDITS) {
  check(`shell: editing ${field} changes only that field`, () => {
    const after = roundTrip((secs) => mutate(secs[2]));
    const b = load(raw).sections;
    const a = load(after).sections;
    // every OTHER section byte-identical
    if (JSON.stringify(b.filter((_, i) => i !== 2)) !== JSON.stringify(a.filter((_, i) => i !== 2)))
      throw new Error("another section changed");
    // the edited section's BLOCKS untouched
    if (JSON.stringify(b[2].blocks) !== JSON.stringify(a[2].blocks)) throw new Error("its blocks changed");
    // and it differs in exactly the one field
    const key = field.split(".")[0];
    const x = { ...b[2] }, y = { ...a[2] };
    delete x[key]; delete y[key];
    if (JSON.stringify(x) !== JSON.stringify(y)) throw new Error(`fields other than ${key} changed`);
    if (JSON.stringify(b[2][key]) === JSON.stringify(a[2][key])) throw new Error("nothing actually changed — proves nothing");
  });
}

check("shell: a variant outside the schema's options is rejected", () => {
  const secs = fresh();
  secs[2].variant = "wild";
  const res = sanitizeSectionsPatch(secs);
  if (res.ok) throw new Error("ACCEPTED an invalid variant");
});

check("shell: the form's options ARE the sanitizer's options (one source)", async () => {
  // VARIANTS/LAYOUTS are exported from the sanitizer and imported by the form, so a
  // form option the sanitizer would reject cannot exist. Assert every option passes.
  const { VARIANTS, LAYOUTS } = await import("../../lib/studio/sections-format.ts");
  for (const v of VARIANTS) {
    const secs = fresh();
    secs[2].variant = v;
    const r = sanitizeSectionsPatch(secs);
    if (!r.ok) throw new Error(`the form offers variant "${v}" but the sanitizer rejects it`);
  }
  for (const l of LAYOUTS) {
    const secs = fresh();
    secs[2].layout = l;
    const r = sanitizeSectionsPatch(secs);
    if (!r.ok) throw new Error(`the form offers layout "${l}" but the sanitizer rejects it`);
  }
});

/* ------------------------------------------------ 3. the id-lockstep hazard */

console.log("\nthe id-lockstep — the parallel ids must move with the values");

// The panel addresses a block as `ids.blockIds[i][j]`. These assert the primitives
// keep the two arrays aligned under every op, because a drift silently edits the
// WRONG BLOCK — the failure this whole structure exists to prevent.
const align = (vals, ids) => vals.length === ids.length;

check("moveIn applied to values and ids keeps them aligned and paired", () => {
  const vals = ["a", "b", "c"], ids = ["i0", "i1", "i2"];
  const v2 = moveIn(vals, 0, 1), i2 = moveIn(ids, 0, 1);
  if (!align(v2, i2)) throw new Error("length drift");
  if (v2.join() !== "b,a,c" || i2.join() !== "i1,i0,i2") throw new Error("not paired");
  // the pairing that matters: ids[k] still names vals[k]
  const pairBefore = new Map(vals.map((v, k) => [ids[k], v]));
  const pairAfter = new Map(v2.map((v, k) => [i2[k], v]));
  for (const [id, v] of pairBefore) if (pairAfter.get(id) !== v) throw new Error(`id ${id} now names ${pairAfter.get(id)}, was ${v}`);
});

check("removeAt applied to values and ids keeps every surviving pairing", () => {
  const vals = ["a", "b", "c"], ids = ["i0", "i1", "i2"];
  const v2 = removeAt(vals, 1), i2 = removeAt(ids, 1);
  if (!align(v2, i2)) throw new Error("length drift");
  const pairAfter = new Map(v2.map((v, k) => [i2[k], v]));
  if (pairAfter.get("i0") !== "a" || pairAfter.get("i2") !== "c") throw new Error("pairing broke");
  if (pairAfter.has("i1")) throw new Error("the removed id survived");
});

check("insertAt applied to values and ids keeps every pairing", () => {
  const vals = ["a", "c"], ids = ["i0", "i2"];
  const v2 = insertAt(vals, 1, "b"), i2 = insertAt(ids, 1, "i1");
  if (!align(v2, i2)) throw new Error("length drift");
  const pairAfter = new Map(v2.map((v, k) => [i2[k], v]));
  if (pairAfter.get("i0") !== "a" || pairAfter.get("i1") !== "b" || pairAfter.get("i2") !== "c")
    throw new Error("pairing broke");
});

check("THE FAILURE THIS PREVENTS: moving values WITHOUT the ids mis-addresses", () => {
  const vals = ["a", "b", "c"], ids = ["i0", "i1", "i2"];
  const v2 = moveIn(vals, 0, 1); // ids deliberately NOT moved — the drift
  const pairAfter = new Map(v2.map((v, k) => [ids[k], v]));
  if (pairAfter.get("i0") === "a") throw new Error("no drift — this test proves nothing");
  // i0 now names "b": an edit addressed to i0 would land on the wrong block.
  if (pairAfter.get("i0") !== "b") throw new Error("unexpected");
});

check("moveIn off either end is a no-op (not a wrap-around)", () => {
  if (moveIn(["a", "b"], 0, -1).join() !== "a,b") throw new Error("moved past the start");
  if (moveIn(["a", "b"], 1, 1).join() !== "a,b") throw new Error("moved past the end");
});

check("setAt replaces one and shares the rest by reference (the addressing model)", () => {
  const o1 = { n: 1 }, o2 = { n: 2 };
  const next = setAt([o1, o2], 0, { n: 9 });
  if (next[1] !== o2) throw new Error("an untouched item was rebuilt — it must ride by reference");
});

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
