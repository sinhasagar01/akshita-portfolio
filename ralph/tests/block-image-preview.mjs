// The block-image session preview — the map's LIFETIME, and the wiring that feeds it.
// Run: node --experimental-strip-types ralph/tests/block-image-preview.mjs
//
// PART A IS THE ONE THAT MATTERS, and it is why the map lives in a plain .ts leaf instead of
// inside the panel. The defect it guards is a BLANK IMAGE CAUSED BY A CLEANUP: block image
// paths are content-addressed (sha256 of the normalized bytes), so the same file uploaded
// into two blocks yields the SAME path and one map entry serves both. Free that entry when
// either block goes away and the survivor blanks. Nothing else in this repo would catch it —
// the blocks still render, the geometry is unchanged, and only the pixels are gone.
//
// A7 IS THE STRONGEST ASSERTION HERE and it is deliberately about ABSENCE. The map exposes no
// per-path release, so the dangerous operation is not one nobody happens to call — it does not
// exist. That is the same move as preferring a mapped type over a Set: the property holds by
// construction rather than by vigilance. If a future tidy-up adds `release(path)`, this fails
// and points at the header explaining why it is absent.
//
// WHY "SUPERSEDE" IS NOT TESTED. #190 revokes the hero's old url on replacement and that is
// correct there, because the hero's key is FIXED — one slot, one holder. Content-addressed
// keys have no supersede: replacing a block's image ADDS a key and orphans the old one, which
// another block may still be showing. So the map is append-only and there is no supersede
// case to assert.
//
// WHAT THIS SUITE CANNOT REACH. The real upload needs github mode and an owner session;
// STUDIO_WRITE_MODE=fs makes the route return { mode: "fs" } and BlockImageField returns
// BEFORE onChange fires. That path is UNVERIFIED and owner-only. The browser gate drives
// everything downstream of the route by stubbing it; nothing is faked here.
import { readFileSync } from "node:fs";
import { createPreviewMap } from "../../lib/studio/preview-map.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
/** Comment-stripped, so prose ABOUT the wiring cannot satisfy an assertion about the wiring —
 *  every file here carries a header quoting the shapes below. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** A map with counting io, so creation and revocation are observed rather than reasoned. */
function spied() {
  const created = [], revoked = [];
  let n = 0;
  const map = createPreviewMap({
    create: () => { const u = `blob:fake/${n++}`; created.push(u); return u; },
    revoke: (u) => revoked.push(u),
  });
  return { map, created, revoked };
}
const P1 = "/images/blog/post/blocks/aaaaaaaaaaaa.webp";
const P2 = "/images/blog/post/blocks/bbbbbbbbbbbb.webp";
const f = () => ({ size: 1 }); // the map only ever forwards this to `create`

/* ================================================================ A. THE LIFETIME, DRIVEN */
{
  const { map, created, revoked } = spied();
  const url = map.adopt(P1, f());
  t("A1: adopt returns the url it created", [url, created], ["blob:fake/0", ["blob:fake/0"]]);
  t("A1: …and get reads it back", map.get(P1), "blob:fake/0");
  t("A1: an unknown path is undefined, so the caller falls through to the snapshot",
    map.get(P2), undefined);
}
// IDEMPOTENT PER PATH. Same path means same bytes, so a second upload of the same image must
// reuse the url rather than mint a second one and orphan the first.
{
  const { map, created, revoked } = spied();
  const a = map.adopt(P1, f());
  const b = map.adopt(P1, f());
  t("A2: adopting one path twice returns the SAME url", a === b, true);
  t("A2: …creates exactly one", created.length, 1);
  t("A2: …and revokes NOTHING", revoked, []);
}
// TWO BLOCKS, ONE PATH — the case the design exists to survive. At the map layer this is A2:
// there is one entry, both blocks read it, and no block can take it away. G3 drives the same
// property in the browser.
{
  const { map, created, revoked } = spied();
  map.adopt(P1, f());
  map.adopt(P2, f());
  t("A3: distinct paths each get their own url", [map.get(P1), map.get(P2)],
    ["blob:fake/0", "blob:fake/1"]);
  t("A3: …two creates, no revokes", [created.length, revoked.length], [2, 0]);
}
{
  const { map, created, revoked } = spied();
  map.adopt(P1, f());
  map.adopt(P2, f());
  map.adopt(P1, f()); // a repeat must not double-revoke below
  map.releaseAll();
  t("A4: releaseAll revokes each distinct url EXACTLY once", revoked, ["blob:fake/0", "blob:fake/1"]);
  t("A4: …and empties the map", [map.get(P1), map.get(P2)], [undefined, undefined]);
  t("A4: a second releaseAll is a no-op, so StrictMode's double cleanup cannot double-revoke",
    (map.releaseAll(), revoked.length), 2);
  t("A5: the map is reusable after release", (map.adopt(P1, f()), created.length), 3);
}

/* ============================================== A7. THE ABSENCE IS THE POINT — see header */
{
  const map = createPreviewMap();
  const keys = Object.keys(map).sort();
  t("A7: the map exposes EXACTLY adopt, get, releaseAll", keys, ["adopt", "get", "releaseAll"]);
  // Named so a `release(path)` / `revoke(path)` / `remove(path)` added for tidiness fails here
  // rather than silently blanking a block that shares a path.
  const perPath = keys.filter((k) => k !== "releaseAll" && /releas|revok|remov|delet|free|forget|evict|drop/i.test(k));
  t("A7: …and NO per-path release of any spelling", perPath, []);
  t("A7: the source declares no per-path release either",
    /\brelease\s*\(\s*path/.test(code("lib/studio/preview-map.ts")), false);
}

/* ================================================== B. THE WIRING THAT FEEDS THE MAP */
const fields = code("components/studio/blocks/fields.tsx");
const blogReg = code("components/studio/blocks/blog-registry.tsx");
const projReg = code("components/studio/blocks/registry.tsx");
const panel = code("components/studio/BlogBlocksEditPanel.tsx");

/* ⚠ WIDENED TO THE CONCEPT AFTER A THIRD ARGUMENT ARRIVED, NEVER BY BENDING THE SUBJECT.
   Both rows pinned an EXACT call spelling — a single-line `onChange(json.src, file)` and a
   two-parameter type — so adding the upload's measured dimensions broke them while the property
   they name stayed true. That is the gate-vocabulary shape this repo has now met a dozen times:
   the row was right about its concept and written against the only case that existed.
   The subject is "the File travels with the path", so that is what is matched. */
t("B1: BlockImageField hands the File up beside the path",
  /onChange\(\s*json\.src,\s*file\b/.test(fields), true);
t("B1: …and its callback type carries it",
  /onChange: \(src: string \| null, file\?: File[,)]/.test(fields), true);
/* ⚠ AND THE DIMENSIONS ARE A SEPARATE ROW RATHER THAN A WIDER ONE, because they are a separate
   property: the route measures the NORMALIZED output and the gallery's masonry cannot place a
   tile without it. Folding it into B1 would let either half pass for the other. */
t("B1a: …and the measured dimensions travel with them, which the masonry cannot lay out without",
  /onChange:\s*\(src: string \| null, file\?: File, dims\?: \{ width: number; height: number \}\) => void/.test(fields),
  true);
t("B2: the blog imageBlock form forwards path AND file",
  /onChange\(\{ \.\.\.value, src \}, src && file \? \{ src, file \} : undefined\)/.test(blogReg), true);
t("B3: ImgSpecFields emits the upload for every host",
  /set\(\{ \.\.\.value, src \}, src && file \? \{ src, file \} : undefined\)/.test(projReg), true);
t("B3: …and the videoEmbed poster forwards it, so BlogProse's poster previews too",
  /set=\{\(poster, upload\) => onChange\(\{ \.\.\.value, poster \}, upload\)\}/.test(projReg), true);
t("B4: the panel adopts on upload and then edits the block",
  /if \(upload\) previews\.adopt\(upload\.src, upload\.file\);\s*setBlockValue\(/.test(panel), true);
t("B5: the panel releases on unmount, and that is its only revoke",
  /useEffect\(\(\) => \(\) => previews\.releaseAll\(\), \[previews\]\)/.test(panel), true);

/* ================================================== C. THE COMPOSE ORDER IS THE FIX */
// Preview BEFORE snapshot. Reversed, the snapshot answers first for any path it happens to
// know and the session preview never runs — which is the pre-#190 behaviour with extra code.
{
  const m = panel.match(/const rewriteSrc = useMemo\(\(\) => \{[\s\S]*?\}, \[draftImages, previews\]\);/);
  t("C1: rewriteSrc is composed in the panel", Boolean(m), true);
  const body = m ? m[0] : "";
  t("C1: …preview first, then the draft snapshot, then the src unchanged",
    /previews\.get\(src\) \?\? \(draft \? draft\(src\) : src\)/.test(body), true);
  // Positional, so a reformat that keeps the shape but flips the operands still fails.
  const iPreview = body.indexOf("previews.get(src)");
  const iDraft = body.indexOf("draft(src)");
  t("C1: …asserted by POSITION as well as by shape",
    iPreview !== -1 && iDraft !== -1 && iPreview < iDraft, true);
}
// The identity is memoized WITHOUT the map's contents, which is only safe because the map is
// read at call time and every adoption shares a handler with a `blocks` edit.
t("C2: prose recomputes on blocks, which is what re-runs rewriteSrc after an adopt",
  /\[blocks, rewriteSrc, renderEpoch\]/.test(panel), true);

/* ============================ D. THE CASE-STUDY CHAIN, WHICH IS LONGER THAN BLOG'S (#252)
 *
 * #202 closed this for blog and the DEFERRED note scoped the follow-up as "seven ImgSpecFields
 * arrows plus a map". **Re-derived, that understated it**: four of the seven sit inside
 * `ItemRows`, and blog has NO ItemRows at all — `blog-registry` contains none — so #202's pattern
 * never crossed that hop. A nested upload has to survive THREE handoffs before it reaches the
 * panel: the row arrow, `ItemRows`' per-row `set`, and `useItemList.set` -> `onChange`. Any one
 * of them dropping the second argument compiles fine and previews nothing.
 *
 * D1 IS THE ONE THAT MATTERS AND IT IS DERIVED. Every `<ImgSpecFields` in the registry is found,
 * and its `set=` prop must either be a bare identifier (forwards by identity) or an arrow that
 * takes a second parameter AND passes it on. A new image-bearing block joins this gate by being
 * written, not by being remembered — which is the failure #248 found in the frame sweep. */
{
  const sites = [...projReg.matchAll(/<ImgSpecFields[^>]*?\sset=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g)]
    .map((m) => m[1].trim());
  /* TEN NOW, NOT SEVEN. `beforeAfterStory` added three — a `before` screen and the auto-scroller's
   * `afterBody` and `afterFooter`. The census is the LIVENESS half of this gate: without it the
   * forwarding check below would pass vacuously if the derivation ever matched nothing, so the
   * number is meant to be updated deliberately when a block is added, and this is that. All three
   * new sites forward their upload, which is what the assertion after this one actually tests. */
  t("D1: every ImgSpecFields site was found — ten, matching the census",
    sites.length, 10);
  // A bare identifier forwards by identity; an arrow must be two-arity and pass the 2nd on.
  const drops = sites.filter((a) => {
    if (/^[A-Za-z_$][\w$]*$/.test(a)) return false;            // set={set}
    const params = /^\(([^)]*)\)/.exec(a)?.[1] ?? "";
    const second = params.split(",")[1]?.trim();
    return !second || !new RegExp(`,\\s*${second}\\s*\\)`).test(a);
  });
  t("D1: no ImgSpecFields site drops the upload — a dropped 2nd arg compiles and previews nothing",
    drops, []);

  // D2 — the two SHARED hops the nested sites cross. Blog never needed these.
  t("D2: ItemRows hands each row a set that carries the upload",
    /set: \(v, upload\) => list\.set\(i, v, upload\)/.test(fields), true);
  t("D2: …and useItemList forwards it to the list's onChange",
    /set: \(i: number, v: T, upload\?: PreviewUpload\) => onChange\(setAt\(items, i, v\), upload\)/
      .test(code("components/studio/useItemList.ts")), true);
  t("D2: …and every ItemRows whose rows hold an image forwards it too",
    [...projReg.matchAll(/onChange=\{\((\w+)\) => onChange\(\{ \.\.\.value, \1 \}\)\}/g)]
      .map((m) => m[1]).filter((k) => ["devices", "features", "items", "pairs"].includes(k)), []);

  // D3-D5 — the panel end, mirroring B4/B5/C1 on the case-study side.
  const cs = code("components/studio/SectionsEditPanel.tsx");
  t("D3: the case-study panel adopts on upload and then edits the block",
    /if \(upload\) previews\.adopt\(upload\.src, upload\.file\);\s*setBlockValue\(/.test(cs), true);
  t("D4: its rewriteSrc composes preview BEFORE the draft snapshot",
    /previews\.get\(src\) \?\? \(draft \? draft\(src\) : src\)/.test(cs), true);
  t("D5: it releases on unmount, and that is its only revoke",
    /useEffect\(\(\) => \(\) => previews\.releaseAll\(\), \[previews\]\)/.test(cs), true);
  t("D5: …and it holds the map by ref, so the identity is stable for the panel's life",
    /previewsRef\.current \?\?= createPreviewMap\(\)/.test(cs), true);
}

console.log(`\nblock-image-preview result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
