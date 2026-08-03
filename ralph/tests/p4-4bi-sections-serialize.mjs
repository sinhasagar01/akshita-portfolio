// P4 4(b)-i test — the SECTIONS write seam + its strict sanitizer.
// Run: node --experimental-strip-types ralph/tests/p4-4bi-sections-serialize.mjs
//
// Plain JS (kept out of the app tsc program). Imports the REAL pure modules
// (type-only imports erased at runtime).
//
// A NEW WRITE SEAM gets the highest-care bar, so the seam half runs against all
// THREE REAL migrated files on disk, not fixtures:
//   1. no-op byte-exact — serializing a file's own sections back reproduces it
//      byte-for-byte (the head's unfolded `summary` and `body: []` survive).
//   2. single-field surgical — patching ONE pullQuote's text changes ONLY that
//      field's lines; every other block, section, the head and body: [] stay
//      byte-identical. This is the property that makes editing one block safe on
//      a 15-block project.
//   3. missing anchor -> unsupported_format — an unmigrated file is refused, not
//      appended to.
//
// The sanitizer half asserts the STRICT posture: it is deliberately NOT the
// adapter. The adapter is permissive (coalesces "", tolerates missing) because it
// reads trusted disk; the sanitizer rejects because it reads an untrusted request
// body. For 4(b)-i it fully validates pullQuote and passes other KNOWN kinds'
// value through opaquely (the per-kind table is 4(b)-ii) — but an UNKNOWN kind is
// still rejected.
import { readFileSync } from "node:fs";
import { deepStrictEqual } from "node:assert";
import { load, dump } from "js-yaml";
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
const fileOf = (slug) => readFileSync(`content/projects/${slug}.yaml`, "utf8");

/** Simulate the wire. The route's sections arrive via JSON.parse(await req.json()),
 *  which cannot carry the shared object references load() restores. */
const transported = (sections) => JSON.parse(JSON.stringify(sections));

console.log("the sections write seam — on all THREE REAL files");

for (const slug of SLUGS) {
  const raw = fileOf(slug);

  check(`${slug}: no-op serialize is BYTE-EXACT`, () => {
    const out = serializeProjectSections(raw, readSections(raw));
    if (!out.ok) throw new Error(`refused: ${out.error.message}`);
    if (out.bytes !== raw) {
      let i = 0;
      while (i < raw.length && i < out.bytes.length && raw[i] === out.bytes[i]) i++;
      throw new Error(
        `diverges @${i}: file=${JSON.stringify(raw.slice(i, i + 50))} out=${JSON.stringify(out.bytes.slice(i, i + 50))}`
      );
    }
  });

  // THE BLIND SPOT THIS SUITE ONCE HAD. Every case above feeds readSections(raw),
  // i.e. load() output — which RESTORES the shared object refs the file encodes as
  // `&ref_0`/`*ref_0`. The real route never sees that graph: it feeds JSON off the
  // wire, where ref sharing cannot survive. So the suite dumped anchors and matched
  // the anchored file while the route dumped expanded form and churned every
  // unedited block. The suite passed; the route was broken.
  //
  // Asserting transport-independence rather than a fixture is what makes this
  // self-contained: it fails on ANY anchor-emitting serializer against ANY file
  // holding shared refs, and passes only when output is a function of values alone.
  check(`${slug}: serialize is TRANSPORT-INDEPENDENT (JSON path === load path)`, () => {
    const viaLoad = serializeProjectSections(raw, readSections(raw));
    const viaJson = serializeProjectSections(raw, transported(readSections(raw)));
    if (!viaLoad.ok || !viaJson.ok) throw new Error("refused");
    if (viaLoad.bytes !== viaJson.bytes) {
      throw new Error("JSON transport produced different bytes than the load path (anchor leak)");
    }
  });

  check(`${slug}: no-op serialize is BYTE-EXACT through JSON TRANSPORT (the real route's path)`, () => {
    const out = serializeProjectSections(raw, transported(readSections(raw)));
    if (!out.ok) throw new Error(`refused: ${out.error.message}`);
    if (out.bytes !== raw) throw new Error("no-op through JSON transport did not reproduce the file");
  });

  check(`${slug}: single-field edit is SURGICAL (only that field's lines change)`, () => {
    // Through JSON transport — the shape the route actually delivers.
    const sections = transported(readSections(raw));
    // find the first pullQuote and edit only its text
    let found = null;
    sections.forEach((s, i) =>
      s.blocks.forEach((b, j) => {
        if (found === null && b.discriminant === "pullQuote") found = [i, j];
      })
    );
    if (!found) throw new Error("no pullQuote in this project to edit");
    const [i, j] = found;
    const before = raw;
    sections[i].blocks[j].value.text = "SURGICAL PROOF — a **bold** replacement line.";
    const out = serializeProjectSections(raw, sections);
    if (!out.ok) throw new Error("refused");

    // The head + body: [] region must be untouched, byte-for-byte.
    const anchor = before.indexOf("\nsections:");
    deepStrictEqual(out.bytes.slice(0, anchor + 1), before.slice(0, anchor + 1));

    // EVERY other block must be byte-identical. Compare the re-parsed docs:
    // exactly one leaf differs, and it is the one we edited.
    const a = load(before).sections;
    const b = load(out.bytes).sections;
    deepStrictEqual(a.length, b.length);
    let diffs = 0;
    a.forEach((sec, si) =>
      sec.blocks.forEach((blk, bi) => {
        const same = dump(blk) === dump(b[si].blocks[bi]);
        if (!same) {
          diffs++;
          if (si !== i || bi !== j) throw new Error(`block[${si}][${bi}] changed but was not edited`);
        }
      })
    );
    deepStrictEqual(diffs, 1);
    // and the edited value landed verbatim, bold markers intact
    deepStrictEqual(b[i].blocks[j].value.text, "SURGICAL PROOF — a **bold** replacement line.");
  });
}

check("a file with NO sections anchor -> unsupported_format (refused, not appended)", () => {
  const out = serializeProjectSections("title: X\nsummary: Y\nbody: []\n", []);
  if (out.ok) throw new Error("expected a refusal");
  deepStrictEqual(out.error.code, "unsupported_format");
});

/* ⚠ INVERTED — boat-crest is MIGRATED now, and this is where that shows up. It used to be the
 * fixture for "a real file with a body and no sections anchor is refused", because it was the only
 * one. Its sections are now in the file, so it must SERIALIZE rather than refuse. The refusal case
 * above still covers the shape, on a synthetic file — which is the right place for it, since a
 * refusal fixture that migrates out from under you is a fixture that was always temporary. */
check("boat-crest, now migrated, SERIALIZES rather than being refused", () => {
  const out = serializeProjectSections(fileOf("boat-crest"), []);
  if (!out.ok) throw new Error("expected success — boat-crest has sections now: " + out.error.code);
});

console.log("\nthe STRICT sanitizer (deliberately NOT the permissive adapter)");

const okPatch = [
  {
    variant: "default",
    id: "s",
    index: "",
    eyebrow: "E",
    title: "T",
    lead: "",
    northStar: "",
    layout: "stack",
    glow: { text: "", top: "", right: "", bottom: "", left: "", size: "" },
    blocks: [
      { discriminant: "pullQuote", value: { text: "A **bold** quote." } },
      { discriminant: "statCards", value: { heading: "H", stats: [{ value: "1", suffix: "", body: "b", tag: "t", highlighted: false }] } },
    ],
  },
];

check("a valid patch passes and returns the sections", () => {
  const r = sanitizeSectionsPatch(okPatch);
  if (!r.ok) throw new Error(`rejected: ${JSON.stringify(r.error)}`);
  deepStrictEqual(r.sections.length, 1);
});

check("pullQuote text survives VERBATIM, bold markers intact", () => {
  const r = sanitizeSectionsPatch(okPatch);
  deepStrictEqual(r.sections[0].blocks[0].value.text, "A **bold** quote.");
});

check("another KNOWN kind's value passes through structurally intact (4b-i)", () => {
  const r = sanitizeSectionsPatch(okPatch);
  deepStrictEqual(r.sections[0].blocks[1].value.stats[0].value, "1");
  deepStrictEqual(r.sections[0].blocks[1].value.heading, "H");
});

function rejects(name, patch, msgPart) {
  check(name, () => {
    const r = sanitizeSectionsPatch(patch);
    if (r.ok) throw new Error("expected a rejection, got ok");
    if (msgPart && !String(r.error.message).includes(msgPart)) {
      throw new Error(`rejected, but message "${r.error.message}" lacks "${msgPart}"`);
    }
  });
}

const withBlocks = (blocks) => [{ ...okPatch[0], blocks }];

rejects("non-array patch -> rejected", { nope: true }, "must be an array");
rejects("section not an object -> rejected", ["nope"], "must be an object");
rejects("unknown section field -> rejected", [{ ...okPatch[0], evil: "x" }], "unknown section field");
rejects("unknown variant -> rejected", [{ ...okPatch[0], variant: "wild" }], "variant");
rejects("unknown layout -> rejected", [{ ...okPatch[0], layout: "wild" }], "layout");
rejects("wrong type (title as number) -> rejected", [{ ...okPatch[0], title: 42 }], "must be a string");
rejects("UNKNOWN block kind -> rejected", withBlocks([{ discriminant: "featureStory", value: {} }]), "unknown block kind");
rejects("pullQuote with a wrong-typed text -> rejected", withBlocks([{ discriminant: "pullQuote", value: { text: 42 } }]), "must be a string");
rejects("pullQuote with an unknown field -> rejected", withBlocks([{ discriminant: "pullQuote", value: { text: "x", evil: 1 } }]), "unknown");
rejects("block missing its value -> rejected", withBlocks([{ discriminant: "pullQuote" }]), "value");
rejects("blocks not an array -> rejected", [{ ...okPatch[0], blocks: "nope" }], "must be an array");

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
