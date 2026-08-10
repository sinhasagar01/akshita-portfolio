// The canvas hero — the fill style, the src precedence, and the shared-component wiring.
// Run: node --experimental-strip-types ralph/tests/canvas-hero.mjs
//
// PART A IS THE ONE THAT MATTERS, and it exists because the failure it guards is INVISIBLE
// TO EVERY OTHER GATE. The canvas draws the hero with a plain <img> carrying next/image's own
// inline style. Swap that for the Tailwind equivalent — which is exactly what a future
// cleanup would do — and the image renders 1.086px too tall, because globals.css carries an
// UNLAYERED `img, video { height: auto }` that outranks `h-full`. But the `aspect-[16/9]`
// wrapper still holds the outer box, so the figure measures the same, the prose below starts
// at the same y, and a box-geometry gate reports PASS. Only the crop inside the frame is
// wrong, by an amount that scales with how far the source aspect sits from 16/9.
//
// So the style is asserted as a STRING against what next/image actually emits, read from the
// built production HTML. This is the mechanism that makes hazard 11's comment enforceable
// rather than advisory.
//
// PART B IS THE ONE THAT PROTECTS THE MOST COMMON FLOW. A hero uploaded during the session is
// on the draft branch but NOT in `draftImages`, which is a snapshot taken server-side at page
// load. Only the object URL can draw it. Get the precedence backwards and the canvas shows a
// broken frame immediately after every upload — the exact bug the draft proxy exists to
// prevent, one layer up.
//
// WHAT THIS SUITE CANNOT REACH. The end-to-end upload needs github mode and an owner session,
// and STUDIO_WRITE_MODE=fs makes the upload route no-op, so `onChanged` never fires locally.
// That path is UNVERIFIED and owner-only; it is not faked here, because a fake would prove
// the fake.
import { readFileSync } from "node:fs";
import {
  HERO_FILL_STYLE,
  HERO_FILL_STYLE_CSS,
  serializeStyle,
  resolveHeroSrc,
} from "../../lib/blog/hero-fill.ts";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

/* ============================================================ A. THE FILL STYLE
 * The assertion no measurement can make. */
t("A: the style object serializes to what next/image emits",
  serializeStyle(HERO_FILL_STYLE), HERO_FILL_STYLE_CSS);

// Spelled out individually, because a partial change is what a "cleanup" produces and it
// would still look mostly right in a diff.
t("A: it is absolutely positioned", HERO_FILL_STYLE.position, "absolute");
t("A: it fills the frame in BOTH axes", [HERO_FILL_STYLE.height, HERO_FILL_STYLE.width], ["100%", "100%"]);
t("A: it is pinned on all four sides",
  [HERO_FILL_STYLE.top, HERO_FILL_STYLE.right, HERO_FILL_STYLE.bottom, HERO_FILL_STYLE.left],
  ["0", "0", "0", "0"]);

// THE ZEROS MUST BE STRINGS. React appends `px` to NUMERIC style values, so `left: 0` would
// serialize as `left:0px` and diverge from next/image's `left:0`. Harmless to layout, but it
// breaks the byte-comparison above, which is the only thing standing between this and a
// silent crop error.
t("A: the zeros are STRINGS, so React does not append px",
  Object.values(HERO_FILL_STYLE).every((v) => typeof v === "string"), true);
t("A: …and the serialized form has no stray px", /\dpx/.test(serializeStyle(HERO_FILL_STYLE)), false);

// `height` is the specific declaration that the unlayered globals.css rule would otherwise
// win. If it ever leaves this object, the 1.086px error is back.
t("A: `height` is present — it is the declaration the unlayered rule would beat",
  "height" in HERO_FILL_STYLE, true);

/* ============================================================ B. SRC PRECEDENCE */
const proxy = (s) => `/api/studio/draft-image?path=${encodeURIComponent(s)}`;

t("B: no hero yields null", resolveHeroSrc({ heroImage: null }), null);
t("B: a committed path with no rewriter passes through",
  resolveHeroSrc({ heroImage: "/images/blog/x/heroImage.webp" }), "/images/blog/x/heroImage.webp");
t("B: a draft-branch path is routed through the proxy",
  resolveHeroSrc({ heroImage: "/images/blog/x/heroImage.webp", rewriteSrc: proxy }),
  proxy("/images/blog/x/heroImage.webp"));

// THE ONE THAT PROTECTS THE UPLOAD FLOW. The object URL wins over BOTH the committed path and
// the proxied path, because draftImages cannot contain a file uploaded after it was read.
t("B: a fresh object URL BEATS the committed path",
  resolveHeroSrc({ heroImage: "/images/blog/x/heroImage.webp", previewUrl: "blob:abc" }), "blob:abc");
t("B: …and beats the PROXIED path too",
  resolveHeroSrc({ heroImage: "/images/blog/x/heroImage.webp", previewUrl: "blob:abc", rewriteSrc: proxy }),
  "blob:abc");
t("B: an object URL with no committed path still renders",
  resolveHeroSrc({ heroImage: null, previewUrl: "blob:abc" }), "blob:abc");
// A cleared hero must not resurrect the previous preview.
t("B: a null preview does not mask a null hero",
  resolveHeroSrc({ heroImage: null, previewUrl: null }), null);
t("B: an empty-string preview is not a src",
  resolveHeroSrc({ heroImage: "/images/blog/x/heroImage.webp", previewUrl: "" }),
  "/images/blog/x/heroImage.webp");
// The rewriter is only ever handed the committed path, never the blob.
{
  const seen = [];
  resolveHeroSrc({ heroImage: "/images/blog/x/heroImage.webp", previewUrl: "blob:abc", rewriteSrc: (s) => (seen.push(s), s) });
  t("B: the rewriter is NOT called when a preview wins", seen, []);
}

/* ============================================================ C. ONE COMPONENT, TWO SURFACES
 * Structural, because BlogHero is JSX and plain node cannot render it. These prove the
 * WIRING — that the harness and both surfaces go through the same component, which is what
 * makes the hero gateable at all. */
const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const hero = code("components/blog/BlogHero.tsx");
const article = code("app/(portfolio)/blog/[slug]/page.tsx");
const canvas = code("components/studio/BlogBlocksEditPanel.tsx");
const harness = code("app/dev/blog-parity/[slug]/page.tsx");

t("C: BlogHero is its own module with a default export",
  /export default function BlogHero/.test(hero), true);
for (const [name, src] of [["the article", article], ["the canvas", canvas], ["the parity harness", harness]]) {
  t(`C: ${name} imports BlogHero`, /import BlogHero from "@\/components\/blog\/BlogHero"/.test(src), true);
}
// THE ARTICLE MUST NOT RENDER THE HERO ITSELF ANY MORE. A leftover inline copy is how the two
// would drift while every gate still passed.
t("C: the article no longer builds the figure inline",
  /aspect-\[16\/9\]/.test(article), false);
t("C: …and no longer imports next/image for it",
  /import Image from "next\/image"/.test(article), false);

// THE ARTICLE KEEPS next/image; ONLY THE CANVAS GETS THE PLAIN <img>. This is the LCP image,
// so losing `priority` and the srcset would be a real user-facing regression that no DOM
// comparison would flag as wrong — it would just be a different, slower page.
t("C: BlogHero still uses next/image", /<Image$/m.test(hero) || /<Image\s/.test(hero), true);
t("C: …with priority, because the hero is the LCP", /priority/.test(hero), true);
t("C: …and the canvas branch is a plain <img> carrying the style",
  /<img[\s\S]{0,120}style=\{HERO_FILL_STYLE\}/.test(hero), true);
t("C: the canvas passes `canvas`, the article does not",
  [/<BlogHero src=\{heroSrc\} canvas \/>/.test(canvas), /<BlogHero src=\{post\.heroImage\} \/>/.test(article)],
  [true, true]);

// ALL THREE BRANCHES. The no-hero spacer lives in the component so neither surface can drop
// it — dropping it gives every hero-less post a different top gap on one surface, which is
// #178's 48px bug in miniature.
t("C: BlogHero owns the no-hero spacer", /mt-\[44px\]/.test(hero), true);
t("C: the article does NOT keep its own copy of the spacer", /mt-\[44px\]/.test(article), false);

// THE HERO SURVIVES AN EMPTY POST. The column is hoisted above the blocks.length check, so a
// post with a hero and no blocks — the state every new post passes through — still shows it.
{
  const col = canvas.indexOf('className="mx-auto max-w-[var(--blog-measure)] px-6 blog-article"');
  const heroAt = canvas.indexOf("<BlogHero");
  const emptyAt = canvas.indexOf("blocks.length === 0");
  t("C: the canvas column opens BEFORE the empty-post branch", col !== -1 && col < emptyAt, true);
  t("C: …and the hero renders before it too", heroAt !== -1 && heroAt < emptyAt, true);
}
// ONE column, not one per branch. Two copies of the string A1 pins is how the measure drifts.
t("C: the canvas declares the 68ch column exactly ONCE",
  canvas.split('className="mx-auto max-w-[var(--blog-measure)] px-6 blog-article"').length - 1, 1);

/* ============================================================ D. THE PARITY HARNESS SEES IT
 * A harness that cannot see the thing a PR adds is worse than no harness, because a pass
 * reads as evidence. #180 shipped `sections: 0, verdict: PARITY OK`. */
t("D: the harness renders a hero pair", /data-parity-section="blog-hero"/.test(harness), true);
t("D: …and still renders the prose pair", /data-parity-section="blog-prose"/.test(harness), true);
t("D: the two pairs have DISTINCT indices",
  [/data-parity-pair=\{0\}/.test(harness), /data-parity-pair=\{1\}/.test(harness)], [true, true]);
t("D: both hero sides are present",
  ["live", "canvas"].filter((s) => harness.includes(`data-parity-side="${s}"`)).length, 2);
// Both sides get the SAME src, or the walk reports a src mismatch that proves nothing about
// layout.
t("D: the hero pair passes the same src to both sides",
  (harness.match(/<BlogHero src=\{post\.heroImage\}/g) ?? []).length, 2);

/* ============================================================ E. THE LIFTED HERO
 * The prop chain that carries an upload to the canvas without a reload. Structural, because
 * the flow itself needs github mode. */
const blogPanel = code("components/studio/BlogEditPanel.tsx");
const projects = code("components/studio/ProjectsEditPanel.tsx");

t("E: onChanged carries the committed path and the FILE",
  /onChanged: \(info: \{ heroImage: string \| null; file: File \| null \}\) => void/.test(projects), true);
t("E: …and is called with both", /onChanged\(\{ heroImage: committed, file \}\)/.test(projects), true);
// PROJECTS NOW CONSUMES THE PAYLOAD, AND THIS ASSERTION IS RETIRED RATHER THAN ROUTED AROUND.
// It recorded a real decision: when `onChanged` was widened for blog, projects kept a zero-arg
// arrow, and asserting that PROVED the widening was safe in a shared component rather than a
// fork. The Details canvas is the thing that reverses it — projects now needs the same two
// halves blog needed, for the same reason, so the decision it pinned no longer holds.
// WHAT REPLACES IT IS THE STRONGER CLAIM: both consumers take the payload, and each one owns and
// revokes its object URL. A zero-arg arrow staying assignable was the old proof that the
// signature was compatible; two live consumers is a better one.
t("E: projects CONSUMES the payload now — the Details canvas needs the file, as blog did",
  /onChanged=\{\(info\) => \{[\s\S]{0,200}?adoptPreview\(info\.file\)/.test(projects), true);
t("E: …and owns its object URL, revoking on replace and on unmount",
  /URL\.revokeObjectURL\(ownedPreview\.current\)/.test(projects)
    && /useEffect\(\s*\(\) => \(\) => \{/.test(projects), true);
t("E: RETIRED — projects no longer passes a zero-arg arrow, which is the point",
  /onChanged=\{\(\) => setUnpublished\(true\)\}/.test(projects), false);
t("E: blog lifts the value into its own state",
  /setHero\(\{ path: info\.heroImage, preview: adoptPreview\(info\.file\) \}\)/.test(blogPanel), true);
// NOT useDraftForm: the hero is committed by the upload route, not by the head patch, so
// putting it in the form would leave "Post" permanently dirty over a field it never posts.
t("E: the hero is plain useState, NOT a useDraftForm field",
  /const \[hero, setHero\] = useState/.test(blogPanel), true);
t("E: both props reach the canvas",
  [/heroImage=\{hero\.path\}/.test(blogPanel), /heroPreviewUrl=\{hero\.preview\}/.test(blogPanel)], [true, true]);
t("E: the canvas resolves them through the shared helper",
  /resolveHeroSrc\(\{ heroImage, previewUrl: heroPreviewUrl, rewriteSrc \}\)/.test(canvas), true);

/* ============================================================ F. THE OBJECT URL LIFETIME
 * Hazard 15. Every successful upload used to strand its predecessor's url — up to 12MB of
 * Blob each — and nothing was freed on unmount either.
 *
 * THE FIX WAS TO DELETE THE SHARED LIFETIME, NOT TO SCHEDULE A REVOKE. Passing the url made
 * two components display ONE revocable resource, and the two genuinely unmount independently:
 * below the fold BlogBlocksEditPanel renders the inspector INSTEAD of the canvas, so
 * switching to the canvas after an upload unmounts the field while the hero is still shown.
 * A revoke in either place would blank the other. Passing the FILE lets each own what it
 * created.
 *
 * These are structural — createObjectURL is a DOM API and plain node cannot run it — so they
 * pin the SHAPE. The behaviour is browser-driven. */

// THE REGRESSION GUARD. If the url ever goes back up the callback, the shared lifetime is
// back and so is the hazard, whatever revocation is written around it.
t("F: the callback does NOT hand up an object url",
  /previewUrl: (objUrl|string)/.test(projects), false);
t("F: …it hands up the File", /file: File \| null/.test(projects), true);

// Each side creates its own, from the same Blob.
t("F: the field creates its own url", /URL\.createObjectURL\(file\)/.test(projects), true);
t("F: the blog panel creates its OWN url too",
  /URL\.createObjectURL\(file\)/.test(blogPanel), true);

// Each side frees exactly what it created, on replace AND on unmount.
for (const [name, src, release] of [
  ["the field", projects, "releaseOwnUrl"],
  ["the blog panel", blogPanel, "releasePreview"],
]) {
  t(`F: ${name} revokes what it owns`,
    new RegExp(`${release} = \\(\\) => \\{[\\s\\S]{0,160}URL\\.revokeObjectURL`).test(src), true);
  t(`F: ${name} frees on UNMOUNT`,
    new RegExp(`useEffect\\(\\(\\) => ${release}, \\[\\]\\)`).test(src), true);
  t(`F: ${name} frees the SUPERSEDED url before adopting a new one`,
    new RegExp(`${release}\\(\\);[\\s\\S]{0,400}?(ownedUrl|ownedPreview)\\.current = `).test(src), true);
}

// The three FAILURE paths must still revoke immediately: nothing ever adopted those urls, so
// they are strandable the moment the request fails. Regression guard on the pre-existing
// behaviour this change moved code around.
t("F: the failure paths still revoke on the spot",
  (projects.match(/if \(objUrl\) URL\.revokeObjectURL\(objUrl\);/g) ?? []).length, 3);

// A ref, not state: revocation is a side effect on a resource, and putting it in state would
// re-render on a value nothing renders.
t("F: ownership is tracked in a ref on both sides",
  [/const ownedUrl = useRef<string \| null>\(null\)/.test(projects),
   /const ownedPreview = useRef<string \| null>\(null\)/.test(blogPanel)], [true, true]);

console.log(`\ncanvas-hero result: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
