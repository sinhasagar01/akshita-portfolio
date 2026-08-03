// BS-3c — the blog block TABLE: kinds, labels, empties, and the Style verdict. No JSX.
//
// WHY THIS IS A SEPARATE .ts FILE, and not just part of blog-registry.tsx: ralph runs
// under `node --experimental-strip-types`, which handles .ts but NOT .tsx. A table living
// beside a Form component would be unreachable by the very suite that exists to prove the
// table is complete. The projects side already made this split for the same reason —
// blocks/empties.ts holds BLOCK_EMPTIES while registry.tsx holds the forms.
//
// THIS IS THE THIRD TIME THE STRIP-TYPES CONSTRAINT HAS SHAPED ARCHITECTURE (3a's
// keystatic mirror, 3b's injected combinators, and now this split). The rule, stated
// once: A MODULE RALPH MUST UNIT-TEST CANNOT BE .tsx, AND CANNOT CARRY AN EXTENSIONLESS
// RELATIVE TS IMPORT. Keep it a dependency-free .ts leaf, or inject/split what it needs.
import type { BlogBlockKind, BlogRawValue } from "@/lib/blog/blocks-raw";

/**
 * DEFINED HERE, NOT IMPORTED FROM ./empties — this must stay a dependency-free leaf so
 * ralph can load it (an extensionless relative TS import breaks type-stripping; see the
 * header). The three shared kinds therefore restate what BLOCK_EMPTIES already says.
 *
 * WHY THAT DUPLICATION IS SAFE HERE, when #173 refused to duplicate the field
 * combinators: an empty is a VALUE, so the two copies can be compared TOTALLY — every
 * key, every default — exactly as 3a compared the image bases. #173's objection was that
 * a corpus test over a FUNCTION (a URL validator) only proves the cases someone
 * enumerated. That does not apply to a fixed record. blog-registry.mjs asserts these
 * deep-equal the projects originals, so a drift fails immediately rather than silently.
 */
const img = () => ({
  src: null,
  alt: "",
  width: null, intrinsicWidth: null, intrinsicHeight: null,
  rotate: null,
  translateX: null,
  translateY: null,
  z: null,
  // Omit-when-empty: a new image is born frameless (""); the sanitizer drops the empty.
  frame: "",
});

export const emptyHeading = (): BlogRawValue<"heading"> => ({ text: "" });

/**
 * Exhaustive by construction over the BLOG union — a fifth blog kind is a compile error
 * here, and a new PROJECTS kind is a compile error over there, with neither able to
 * silently satisfy the other.
 *
 * `heading` is the gap this closes: BLOCK_EMPTIES is `{ [K in SectionBlockKind]: … }` over
 * the PROJECTS union and has never had one, because #171 added the kind to the schema and
 * the renderer while every projects-keyed table quietly stayed as it was.
 */
export const BLOG_BLOCK_EMPTIES: { [K in BlogBlockKind]: () => BlogRawValue<K> } = {
  richText: () => ({ paragraphs: [] }),
  heading: emptyHeading,
  pullQuote: () => ({ text: "" }),
  // Born with NO image and NO alt, which is why the sanitizer accepts both and the
  // publish gate is where a blank alt actually bites. `src: null` (not "") matches how
  // Keystatic represents an unset image and what the imageSrc gate requires.
  imageBlock: () => ({ src: null, alt: "", caption: "", wide: false, decorative: false }),
  videoEmbed: () => ({
    src: "",
    poster: { ...img() },
    caption: "",
    frame: "browser",
    aspect: "",
    eyebrow: "",
    title: "",
  }),
};

export const BLOG_BLOCK_LABELS: { [K in BlogBlockKind]: string } = {
  richText: "Paragraph",
  heading: "Heading",
  pullQuote: "Pull quote",
  imageBlock: "Image",
  videoEmbed: "Video",
};

/**
 * Which blog kinds have any STYLE-tab field. A MAPPED TYPE, not a Set.
 *
 * A MAPPED TYPE FAILS COMPILATION; A `Set<Kind>` JUST RETURNS FALSE. SectionsEditPanel's
 * KIND_HAS_STYLE / IMAGE_KINDS / GRID_KINDS are Sets, so a kind missing from one is not
 * an error — it is a Style tab that silently never appears. This is the same information
 * in a shape where the next kind is a build failure instead.
 */
export const BLOG_KIND_HAS_STYLE: { [K in BlogBlockKind]: boolean } = {
  richText: false,
  heading: false,
  pullQuote: false,
  // FALSE, and that is the imgSpecFields decision showing through: imageBlock carries no
  // geometry (no width/rotate/translate/z/frame), so every one of its five fields is
  // Content. `wide` is a placement choice the author makes while writing, not styling.
  imageBlock: false,
  // frame + aspect live under Style. The poster is no longer hidden — BlogProse renders
  // images now, so the field it feeds is finally one a reader shows.
  videoEmbed: true,
};

/** The order the picker offers them in — writing order, not schema order. THIS IS THE
 *  CURATION: the case-study picker is `Object.keys(BLOCK_REGISTRY)` with no filter, and
 *  because blog owns its own table there is nothing to filter. */
export const BLOG_PICKER_ORDER: BlogBlockKind[] = [
  "richText",
  "heading",
  "pullQuote",
  "imageBlock",
  "videoEmbed",
];
