// P4 3(c) test — the content -> CaseStudy adapter.
// Run: node --experimental-strip-types ralph/tests/p4-3c-adapter.mjs
//
// Plain JS (kept out of the app tsc program). Imports the REAL pure module
// (lib/case-studies/adapter.ts — its ./types import is type-only, erased at
// runtime). Two halves:
//   1. parseRich hard — the silent-corruption risk. A sloppy bold parser
//      corrupts content invisibly, so every edge gets an exact-shape assert.
//      The "plain" case MUST return a STRING (Rich's string branch is a
//      different renderRich path from a 1-run list).
//   2. adaptSections round-trip — hand-authored raw sections shaped exactly
//      like the Keystatic reader emits (per the 3(b) throwaway's real dump),
//      covering all 14 block kinds and every mapping quirk: selects read
//      concrete, translateX/Y recombined, devices tupled, **bold** parsed,
//      always-present empties (glow/ratingChip/"" texts) -> undefined/omitted.
//      Plus the fail-loud cases: wrong device count, missing image src,
//      unknown discriminant, unknown variant.
//   3. P4 4(a) — the ssg/preview modes. The DEFAULT-PIN section is the
//      load-bearing one: adaptSections(raw) with NO mode argument must stay
//      fail-loud, so a future default flip to "preview" cannot silently disarm
//      the public path's protection. Preview mode is asserted separately to
//      yield placeholders with per-block granularity.
import { parseRich, adaptSections } from "../../lib/case-studies/adapter.ts";
import { deepStrictEqual } from "node:assert";

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
function throws(name, fn, msgPart) {
  try {
    fn();
    failures++;
    console.log(`  [FAIL] ${name} — expected a throw, got none`);
  } catch (e) {
    if (msgPart && !String(e.message).includes(msgPart)) {
      failures++;
      console.log(`  [FAIL] ${name} — threw, but message "${e.message}" lacks "${msgPart}"`);
    } else {
      console.log(`  [PASS] ${name}`);
    }
  }
}

console.log("parseRich — edge suite");

check("plain text returns a STRING (not a 1-run list)", () => {
  const out = parseRich("no bold here");
  if (typeof out !== "string") throw new Error(`got ${JSON.stringify(out)}`);
  deepStrictEqual(out, "no bold here");
});
check("empty string returns the empty STRING", () => {
  const out = parseRich("");
  if (typeof out !== "string") throw new Error(`got ${JSON.stringify(out)}`);
});
check("single bold mid-string", () =>
  deepStrictEqual(parseRich("a **b** c"), ["a ", { b: "b" }, " c"]));
check("multiple bolds", () =>
  deepStrictEqual(parseRich("**a** and **b** end"), [{ b: "a" }, " and ", { b: "b" }, " end"]));
check("bold at start", () =>
  deepStrictEqual(parseRich("**start** rest"), [{ b: "start" }, " rest"]));
check("bold at end", () =>
  deepStrictEqual(parseRich("rest **end**"), ["rest ", { b: "end" }]));
check("bold-only string", () =>
  deepStrictEqual(parseRich("**only**"), [{ b: "only" }]));
check("adjacent bolds, no empty run between", () =>
  deepStrictEqual(parseRich("**a****b**"), [{ b: "a" }, { b: "b" }]));
check("empty **** stays literal (STRING)", () => {
  const out = parseRich("a **** b");
  if (typeof out !== "string") throw new Error(`got ${JSON.stringify(out)}`);
  deepStrictEqual(out, "a **** b");
});
check("unclosed ** stays literal (STRING)", () => {
  const out = parseRich("a **b");
  if (typeof out !== "string") throw new Error(`got ${JSON.stringify(out)}`);
  deepStrictEqual(out, "a **b");
});
check("bold then unclosed ** — bold parsed, tail literal", () =>
  deepStrictEqual(parseRich("**a** and **b"), [{ b: "a" }, " and **b"]));
check("multiline bold content spans the marker", () =>
  deepStrictEqual(parseRich("x **a b** y"), ["x ", { b: "a b" }, " y"]));

console.log("\nadaptSections — full round-trip (all 14 kinds, every quirk)");

// Raw content exactly as the reader emits the 3(b) schema: selects concrete,
// untouched texts "", untouched objects present-but-empty, numbers null.
const IMG = { src: "/images/projects/x/a.png", alt: "shot", width: 248, rotate: null, translateX: null, translateY: null, z: null };
const EMPTY_GLOW = { text: "", top: "", right: "", bottom: "", left: "", size: "" };

const raw = [
  {
    variant: "hero",
    id: "hero",
    index: "",
    eyebrow: "Case study · Product design",
    title: "Scratch Schema Test",
    lead: "Built on **boAt Crest** learnings.",
    northStar: "",
    layout: "stack",
    glow: EMPTY_GLOW,
    blocks: [
      {
        discriminant: "heroCover",
        value: {
          title: "Scratch", thesis: "Thesis.", position: "Position.",
          eyebrow: "", watermark: "crest",
          ratingChip: { stat: "★ 4.2", rest: "up from 2.3" },
          meta: [{ label: "My role", value: "Sole engineer" }],
          devices: [
            { ...IMG, rotate: -6, translateX: -86, translateY: 16, z: 1, label: "", dotColor: "" },
            { ...IMG, width: 288, z: 3, label: "Midnight", dotColor: "#f00" },
          ],
          glow: { ...EMPTY_GLOW, text: "calm", size: "clamp(6rem, 12vw, 11rem)" },
        },
      },
      { discriminant: "pullQuote", value: { text: "A quote." } },
      { discriminant: "glanceGrid", value: { items: [{ label: "Product", value: "App" }] } },
      { discriminant: "issueList", value: { items: [{ title: "Clutter", note: "Everywhere" }] } },
      { discriminant: "stepper", value: { steps: [{ label: "01", text: "Discover" }] } },
    ],
  },
  {
    variant: "default",
    id: "", index: "01", eyebrow: "", title: "", lead: "", northStar: "The **north** star.",
    layout: "split",
    glow: { ...EMPTY_GLOW, text: "noise", bottom: "-20px" },
    blocks: [
      {
        discriminant: "statCards",
        value: {
          heading: "At a glance",
          stats: [
            { value: "4.2", suffix: "", body: "Rating **up** overall", tag: "store", highlighted: true },
            { value: "90%", suffix: "+", body: "plain body", tag: "users", highlighted: false },
          ],
        },
      },
      {
        discriminant: "principleCards",
        value: { heading: "", subhead: "", cards: [{ index: "01", title: "Declutter", body: "Less **noise**" }] },
      },
      {
        discriminant: "featureRows",
        value: { features: [{ index: "01", category: "Nav", title: "Tabs", body: "Three tabs", image: { ...IMG } }] },
      },
      {
        discriminant: "beforeAfter",
        value: {
          pairs: [{
            title: "Home", tag: "IA",
            before: { ...IMG }, after: { ...IMG, width: 288 },
            changes: [{ emphasis: "Calmer", rest: "hierarchy" }],
          }],
        },
      },
      {
        discriminant: "swatchTokens",
        value: {
          groups: [{
            tokens: [
              { discriminant: "color", value: { name: "Ember", value: "#e25822", hex: "#e25822" } },
              { discriminant: "font", value: { name: "Fraunces", note: "Display" } },
            ],
          }],
        },
      },
      {
        discriminant: "annotatedImage",
        value: {
          image: { ...IMG, rotate: -4 },
          scrawl: { text: "where do\nI look?", top: "0", right: "0", bottom: "", left: "" },
          callouts: [],
        },
      },
      { discriminant: "richText", value: { paragraphs: ["One **bold** para", "plain para"] } },
      { discriminant: "closingLine", value: { text: "Worth it." } },
      { discriminant: "deviceShelf", value: { devices: [{ ...IMG }], glow: EMPTY_GLOW, minHeight: 560 } },
    ],
  },
];

const expected = [
  {
    variant: "hero",
    layout: "stack",
    blocks: [
      {
        kind: "heroCover",
        title: "Scratch", thesis: "Thesis.", position: "Position.",
        meta: [{ label: "My role", value: "Sole engineer" }],
        devices: [
          { src: "/images/projects/x/a.png", alt: "shot", width: 248, rotate: -6, translate: [-86, 16], z: 1 },
          { src: "/images/projects/x/a.png", alt: "shot", width: 288, z: 3, label: "Midnight", dotColor: "#f00" },
        ],
        watermark: "crest",
        ratingChip: { stat: "★ 4.2", rest: "up from 2.3" },
        glow: { text: "calm", size: "clamp(6rem, 12vw, 11rem)" },
      },
      { kind: "pullQuote", text: "A quote." },
      { kind: "glanceGrid", items: [{ label: "Product", value: "App" }] },
      { kind: "issueList", items: [{ title: "Clutter", note: "Everywhere" }] },
      { kind: "stepper", steps: [{ label: "01", text: "Discover" }] },
    ],
    id: "hero",
    eyebrow: "Case study · Product design",
    title: "Scratch Schema Test",
    lead: ["Built on ", { b: "boAt Crest" }, " learnings."],
  },
  {
    variant: "default",
    layout: "split",
    blocks: [
      {
        kind: "statCards",
        stats: [
          { value: "4.2", body: ["Rating ", { b: "up" }, " overall"], tag: "store", highlighted: true },
          { value: "90%", body: "plain body", tag: "users", suffix: "+" },
        ],
        heading: "At a glance",
      },
      { kind: "principleCards", cards: [{ index: "01", title: "Declutter", body: ["Less ", { b: "noise" }] }] },
      {
        kind: "featureRows",
        features: [{ index: "01", category: "Nav", title: "Tabs", body: "Three tabs", image: { src: "/images/projects/x/a.png", alt: "shot", width: 248 } }],
      },
      {
        kind: "beforeAfter",
        pairs: [{
          title: "Home", tag: "IA",
          before: { src: "/images/projects/x/a.png", alt: "shot", width: 248 },
          after: { src: "/images/projects/x/a.png", alt: "shot", width: 288 },
          changes: [{ emphasis: "Calmer", rest: "hierarchy" }],
        }],
      },
      {
        kind: "swatchTokens",
        groups: [{
          tokens: [
            { type: "color", name: "Ember", value: "#e25822", hex: "#e25822" },
            { type: "font", name: "Fraunces", note: "Display" },
          ],
        }],
      },
      {
        kind: "annotatedImage",
        image: { src: "/images/projects/x/a.png", alt: "shot", width: 248, rotate: -4 },
        scrawl: { text: "where do\nI look?", top: "0", right: "0" },
      },
      { kind: "richText", paragraphs: [["One ", { b: "bold" }, " para"], "plain para"] },
      { kind: "closingLine", text: "Worth it." },
      {
        kind: "deviceShelf",
        devices: [{ src: "/images/projects/x/a.png", alt: "shot", width: 248 }],
        minHeight: 560,
      },
    ],
    index: "01",
    northStar: ["The ", { b: "north" }, " star."],
    glow: { text: "noise", bottom: "-20px" },
  },
];

// CS-4 — the adapter now emits a resolved `frame` on EVERY ImgSpec (default
// "phone" when neither a block frame nor a template is set). Stamp it onto the
// expected image specs (anything with both a string `src` and `alt`) so this pins
// the new contract without hand-editing every object. No component reads it yet.
function stampDefaultFrame(node) {
  if (Array.isArray(node)) {
    node.forEach(stampDefaultFrame);
    return;
  }
  if (node && typeof node === "object") {
    if (typeof node.src === "string" && typeof node.alt === "string") node.frame = "phone";
    for (const v of Object.values(node)) stampDefaultFrame(v);
  }
}
stampDefaultFrame(expected);

check("full round-trip: exact Section[] deep-equal", () =>
  deepStrictEqual(adaptSections(raw), expected));

check("empty/absent sections -> []", () => {
  deepStrictEqual(adaptSections(undefined), []);
  deepStrictEqual(adaptSections(null), []);
  deepStrictEqual(adaptSections([]), []);
});

console.log("\nadaptSections — fail-loud cases");

const heroWith = (devices) => [{
  variant: "hero", layout: "stack", glow: EMPTY_GLOW,
  blocks: [{ discriminant: "heroCover", value: { title: "t", thesis: "t", position: "p", meta: [], devices, ratingChip: { stat: "", rest: "" }, glow: EMPTY_GLOW } }],
}];

throws("1 device -> descriptive throw", () => adaptSections(heroWith([{ ...IMG }])), "must be exactly 2");
throws("3 devices -> descriptive throw", () => adaptSections(heroWith([{ ...IMG }, { ...IMG }, { ...IMG }])), "must be exactly 2");
throws("missing image src -> descriptive throw", () => adaptSections(heroWith([{ ...IMG, src: "" }, { ...IMG }])), "image src is missing");
throws("unknown discriminant -> throw", () =>
  adaptSections([{ variant: "default", layout: "stack", glow: EMPTY_GLOW, blocks: [{ discriminant: "featureStory", value: {} }] }]),
  'unknown block kind "featureStory"');
throws("unknown variant -> throw", () =>
  adaptSections([{ variant: "wild", layout: "stack", glow: EMPTY_GLOW, blocks: [] }]),
  'unknown variant "wild"');

console.log("\nP4 4(a) — the SSG DEFAULT PIN (a future default flip must fail here)");

// Every fail-loud case above runs with NO mode argument. These re-assert it
// EXPLICITLY and symmetrically: the no-arg call and the explicit ssg call must
// behave IDENTICALLY, so `mode` defaulting to "ssg" is a pinned contract, not an
// accident. If someone flips the default to "preview", these throw-assertions
// fail loudly instead of the public path quietly losing its protection.
const badDevices = heroWith([{ ...IMG }]);
const badImage = heroWith([{ ...IMG, src: "" }, { ...IMG }]);

throws("NO mode arg + 1 device -> STILL throws (default is ssg)", () => adaptSections(badDevices), "must be exactly 2");
throws("NO mode arg + missing src -> STILL throws (default is ssg)", () => adaptSections(badImage), "image src is missing");
throws("explicit ssg + 1 device -> throws", () => adaptSections(badDevices, { mode: "ssg" }), "must be exactly 2");
throws("explicit ssg + missing src -> throws", () => adaptSections(badImage, { mode: "ssg" }), "image src is missing");
check("no-arg output === explicit-ssg output on VALID content (same code path)", () =>
  deepStrictEqual(adaptSections(raw), adaptSections(raw, { mode: "ssg" })));
check("no-arg output === today's expected shape (the 3c contract, unchanged)", () =>
  deepStrictEqual(adaptSections(raw), expected));
check("an empty opts object still defaults to ssg", () => {
  try {
    adaptSections(badImage, {});
    throw new Error("expected a throw");
  } catch (e) {
    if (!/image src is missing/.test(e.message)) throw new Error(`wrong error: ${e.message}`);
  }
});

console.log("\nP4 4(a) — preview mode (placeholders, per-block granularity)");

const PLACEHOLDER = "/images/projects/placeholder-missing.webp";

check("preview + missing src -> placeholder ImgSpec, no throw", () => {
  const out = adaptSections(badImage, { mode: "preview" });
  const hero = out[0].blocks[0];
  deepStrictEqual(hero.devices[0].src, PLACEHOLDER);
  deepStrictEqual(hero.devices[0].alt, "Image not set yet");
});
check("preview + 1 device -> padded to the [back, front] tuple", () => {
  const out = adaptSections(badDevices, { mode: "preview" });
  const hero = out[0].blocks[0];
  deepStrictEqual(hero.devices.length, 2);
  deepStrictEqual(hero.devices[1].src, PLACEHOLDER);
});
check("preview + 3 devices -> truncated to exactly 2", () => {
  const out = adaptSections(heroWith([{ ...IMG }, { ...IMG }, { ...IMG }]), { mode: "preview" });
  deepStrictEqual(out[0].blocks[0].devices.length, 2);
});
check("preview leaves VALID content byte-identical to ssg (no placeholder creep)", () =>
  deepStrictEqual(adaptSections(raw, { mode: "preview" }), adaptSections(raw, { mode: "ssg" })));
check("preview granularity — one bad block does NOT blank its siblings", () => {
  // A section whose FIRST block has a missing image and whose later blocks are
  // fine: preview must render the placeholder AND keep every sibling intact.
  const mixed = [{
    variant: "default", layout: "stack", glow: EMPTY_GLOW,
    blocks: [
      { discriminant: "annotatedImage", value: { image: { ...IMG, src: "" }, scrawl: { text: "", top: "", right: "", bottom: "", left: "" }, callouts: [] } },
      { discriminant: "pullQuote", value: { text: "I must survive." } },
      { discriminant: "closingLine", value: { text: "So must I." } },
    ],
  }];
  const out = adaptSections(mixed, { mode: "preview" });
  deepStrictEqual(out[0].blocks.length, 3);
  deepStrictEqual(out[0].blocks[0].image.src, PLACEHOLDER);
  deepStrictEqual(out[0].blocks[1], { kind: "pullQuote", text: "I must survive." });
  deepStrictEqual(out[0].blocks[2], { kind: "closingLine", text: "So must I." });
});
throws("preview does NOT swallow a schema mismatch (unknown kind still throws)", () =>
  adaptSections([{ variant: "default", layout: "stack", glow: EMPTY_GLOW, blocks: [{ discriminant: "featureStory", value: {} }] }], { mode: "preview" }),
  'unknown block kind "featureStory"');

/* ============================================================================
   VE-1 — videoEmbed. The 16th kind, and the one media block whose source is an
   EXTERNAL URL rather than a committed binary. These pin the three things that
   makes different from every other block: the URL allowlist, the fail-loud/preview
   split on a missing source, and that the poster is OPTIONAL (an unset poster must
   not trip the image guard that every other image block relies on).
============================================================================ */
console.log("\nVE-1 videoEmbed");

const EMPTY_POSTER = { src: null, alt: "", width: null, rotate: null, translateX: null, translateY: null, z: null, frame: "" };
const video = (over = {}) => [{
  variant: "default", layout: "stack", glow: EMPTY_GLOW,
  blocks: [{ discriminant: "videoEmbed", value: {
    src: "https://cdn.example.com/clip.mp4", poster: { ...EMPTY_POSTER }, caption: "",
    frame: "browser", aspect: "", eyebrow: "", title: "", ...over } }],
}];
const firstBlock = (raw, opts) => adaptSections(raw, opts)[0].blocks[0];

check("maps to a typed videoEmbed block, defaults applied", () => {
  const b = firstBlock(video());
  deepStrictEqual(b, { kind: "videoEmbed", src: "https://cdn.example.com/clip.mp4", frame: "browser", aspect: 16 / 9 });
});
check("frame: plain is honoured", () =>
  deepStrictEqual(firstBlock(video({ frame: "plain" })).frame, "plain"));
check("an unknown frame composes as the browser default (permissive adapter)", () =>
  deepStrictEqual(firstBlock(video({ frame: "wat" })).frame, "browser"));
check("aspect parses from the schema's text field", () =>
  deepStrictEqual(firstBlock(video({ aspect: "1.5" })).aspect, 1.5));
check("eyebrow/title omitted when empty, present when set", () => {
  deepStrictEqual(firstBlock(video()).title, undefined);
  deepStrictEqual(firstBlock(video({ title: "In motion" })).title, "In motion");
});

console.log("\n  the URL allowlist — http(s) only, at the adapter as well as the sanitiser");
check("http passes", () => deepStrictEqual(firstBlock(video({ src: "http://a.co/v.mp4" })).src, "http://a.co/v.mp4"));
check("https passes", () => deepStrictEqual(firstBlock(video({ src: "https://a.co/v.mp4" })).src, "https://a.co/v.mp4"));
throws("javascript: is REFUSED (ssg)", () => adaptSections(video({ src: "javascript:alert(1)" })), "video src is missing or not an http(s) URL");
throws("data: is REFUSED (ssg)", () => adaptSections(video({ src: "data:video/mp4;base64,AAA" })), "video src is missing or not an http(s) URL");
throws("a site-relative path is REFUSED — a <video> needs a fetchable media URL", () =>
  adaptSections(video({ src: "/videos/clip.mp4" })), "video src is missing or not an http(s) URL");

console.log("\n  missing src — fail loud for the public build, placeholder for the draft");
throws("missing src throws in ssg (a broken public build should fail)", () =>
  adaptSections(video({ src: "" })), "video src is missing");
check("missing src does NOT throw in preview (a half-authored draft still renders)", () => {
  const b = firstBlock(video({ src: "" }), { mode: "preview" });
  deepStrictEqual(b.src, "");
  deepStrictEqual(b.kind, "videoEmbed");
});
check("an unsafe src degrades to empty in preview rather than reaching the player", () =>
  deepStrictEqual(firstBlock(video({ src: "javascript:alert(1)" }), { mode: "preview" }).src, ""));

console.log("\n  the poster is OPTIONAL — an unset one must not trip the image guard");
check("no poster set -> no poster key, and ssg does NOT throw", () => {
  const b = firstBlock(video());
  deepStrictEqual("poster" in b, false);
});
check("a set poster adapts through the normal image path", () => {
  const b = firstBlock(video({ poster: { ...EMPTY_POSTER, src: "/images/projects/x/p.webp", alt: "still" } }));
  deepStrictEqual(b.poster.src, "/images/projects/x/p.webp");
  deepStrictEqual(b.poster.alt, "still");
});

console.log("\n  the caption reuses parseRich — all three marks, no second dialect");
check("plain caption", () => deepStrictEqual(firstBlock(video({ caption: "Just prose." })).caption, "Just prose."));
check("**bold** caption", () =>
  deepStrictEqual(firstBlock(video({ caption: "a **b** c" })).caption, ["a ", { b: "b" }, " c"]));
check("*italic* caption", () =>
  deepStrictEqual(firstBlock(video({ caption: "a *i* c" })).caption, ["a ", { i: "i" }, " c"]));
check("[link](url) caption", () =>
  deepStrictEqual(firstBlock(video({ caption: "see [docs](https://a.co)" })).caption,
    ["see ", { a: "docs", href: "https://a.co" }]));
check("an empty caption is omitted, not an empty string", () =>
  deepStrictEqual("caption" in firstBlock(video()), false));

console.log("\n  round-trip: the block survives adapt unchanged in both modes");
check("ssg and preview agree for a fully-authored block", () =>
  deepStrictEqual(firstBlock(video(), { mode: "preview" }), firstBlock(video())));

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
