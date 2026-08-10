"use client";

// BS-3c — the BLOG block registry: the four kinds' FORMS. Blog owns its table; the three
// shared kinds are reused BY REFERENCE from the projects registry, so there is one
// implementation of each form, not two.
//
// The DATA half (kinds, labels, empties, the Style verdict, the picker order) lives in
// blog-empties.ts, a plain .ts leaf, so ralph can assert the table is complete — this
// file is .tsx and node's type-stripping cannot load it. See that file's header for the
// standing constraint.
//
// WHY BLOG NEEDS ITS OWN TABLE AT ALL. `BLOCK_REGISTRY` is `{ [K in EditableBlockKind]: … }`
// over the PROJECTS union and has no `heading` — no form, no label, no empty. That is the
// same decay #173 found in the sanitizer, one layer up: #171 added `heading` to the schema
// and the renderer, and every projects-keyed table has silently lacked it since, because
// each PR's scope stopped at its own seam.
//
// THE SWEEP of every table keyed to the projects block union (the list is the useful
// part, not the fixes):
//   1. VALIDATORS        sections-format.ts     — closed for blog in #173
//   2. BLOCK_REGISTRY    blocks/registry.tsx    — no `heading`  ← closed for blog HERE
//   3. BLOCK_LABELS      blocks/registry.tsx    — no `heading`  ← closed for blog HERE
//   4. BLOCK_EMPTIES     blocks/empties.ts      — no `heading`  ← closed for blog HERE
//   5. BLOCK_KINDS       adapter.ts             — no `heading`, and a NON-GAP: BlogProse
//                                                 renders raw and never calls the adapter
//   6. KIND_HAS_STYLE    SectionsEditPanel.tsx  — a Set, host-local
//   7. IMAGE/GRID_KINDS  SectionsEditPanel.tsx  — Sets, board-only; blog needs neither
// 2-4 are closed FOR BLOG here. They REMAIN GAPS for projects-side reuse, and that is
// correct: `heading` is a blog kind and projects has no reason to grow one. The value of
// the sweep is the list.
import { publishBlockers } from "@/lib/studio/validate-blog-post";
import type { ComponentType } from "react";
import type { BlogBlockKind, BlogRawValue } from "@/lib/blog/blocks-raw";
import { BLOCK_REGISTRY } from "./registry";
import { BLOG_BLOCK_EMPTIES, emptyHeading } from "./blog-empties";
import { BlockImageField, TextField, TextArea, CheckField } from "./fields";
import type { PreviewUpload } from "@/lib/studio/preview-map";

/** The props a blog block form receives — the same contract BlockFormProps states, over
 *  the BLOG value union. `collection` is threaded exactly as #172 requires. */
export type BlogBlockFormProps<K extends BlogBlockKind> = {
  value: BlogRawValue<K>;
  /** `upload` rides ALONGSIDE the new value when a form's image field just took one, so the
   *  host can hold a preview for it — the committed path 404s until publish and the canvas
   *  rewriter's snapshot predates the upload. Optional, so a form that has no image field
   *  never mentions it. It carries the PATH beside the File deliberately: the host receives
   *  an opaque value and must not have to guess which of its fields is the image. */
  onChange: (next: BlogRawValue<K>, upload?: PreviewUpload) => void;
  onBlur?: () => void;
  slug: string;
  collection: string;
};

type BlogEntry<K extends BlogBlockKind> = {
  label: (value: BlogRawValue<K>) => string;
  Form: ComponentType<BlogBlockFormProps<K>>;
  empty: () => BlogRawValue<K>;
};

/** The only genuinely new form in the arc: one text field. `heading` renders as an <h2>
 *  and carries no inline marks in the design, so it is a plain TextField rather than a
 *  rich TextArea, which would imply **bold** support the renderer does not apply. */
const HeadingForm = ({
  value,
  onChange,
  onBlur,
}: BlogBlockFormProps<"heading">) => (
  <TextField
    label="Heading"
    value={value.text}
    onChange={(text) => onChange({ ...value, text })}
    onBlur={onBlur}
  />
);

/** The inline figure's form. Composes existing primitives only — no new field type.
 *
 *  FIVE FIELDS, ALL UNDER CONTENT, because imageBlock carries no geometry. It deliberately
 *  does NOT use ImgSpecFields, which would add width/rotate/translateX/translateY/z/frame —
 *  six knobs BlogProse reads none of, which is the videoEmbed.poster condition multiplied.
 *
 *  The `wide` note states an ACTION, not an apology. A wide figure bleeds past the canvas
 *  pane when the post list is open (measured: ~24-27px of slack against a ~120px bleed) and
 *  fits with it collapsed (~143-146px). That clipping is a deliberate trade — one bleed
 *  value means the canvas and the article agree on geometry whenever the canvas has room —
 *  so the author is told what to do, not why. */
const ImageBlockForm = ({
  value,
  onChange,
  onBlur,
  slug,
  collection,
}: BlogBlockFormProps<"imageBlock">) => (
  <>
    <BlockImageField
      label="Image"
      src={value.src}
      slug={slug}
      collection={collection}
      // The upload commits the blob and hands back the server-derived path; the src edit
      // then rides the ordinary save, so `blocks` keeps its single writer.
      //
      // THE FILE RIDES BESIDE THE VALUE, never inside it. `src` stays exactly the string the
      // server derived, so what is saved is unchanged; the bytes travel on the second
      // argument and never reach the entry file. A clear passes no upload — `src` is null
      // and there is nothing to preview.
      onChange={(src, file) =>
        onChange({ ...value, src }, src && file ? { src, file } : undefined)
      }
    />
    {/* ⚠ THE MARK, AND ITS PREDICATE IS THE VALIDATOR'S OWN. `publishBlockers` is asked about a
        one-block document, so the condition that lights this mark is byte-for-byte the condition
        that will refuse the publish — src set, not decorative, alt blank. Advisory: the field
        still saves, because a block is born with a blank alt. */}
    <TextField
      label="Alt text"
      value={value.alt}
      onChange={(alt) => onChange({ ...value, alt })}
      onBlur={onBlur}
      blocker={
        /* No topics needed — the alt rule does not consult them, and passing a real list here
           would imply it did. */
        publishBlockers({ blocks: [{ discriminant: "imageBlock", value }] }, [])
          .find((b) => b.field === "blocks[0].alt")?.message
          ? "Needed to publish — describe the image, or tick Decorative."
          : null
      }
    />
    <TextArea
      label="Caption (optional) — supports **bold**, *italic*, [links](url)"
      value={value.caption}
      onChange={(caption) => onChange({ ...value, caption })}
      onBlur={onBlur}
    />
    <CheckField
      label="Break wider than the text column"
      value={value.wide}
      onChange={(wide) => onChange({ ...value, wide })}
      onBlur={onBlur}
    />
    {value.wide ? (
      <p className="text-[12px] leading-relaxed text-studio-text-subtle">
        A wide image shows in full with the post list collapsed.
      </p>
    ) : null}
    <CheckField
      label="Decorative — no alt text needed"
      value={value.decorative}
      onChange={(decorative) => onChange({ ...value, decorative })}
      onBlur={onBlur}
    />
  </>
);

const firstLine = (s: string, fallback: string) => s.split("\n")[0].trim() || fallback;

/**
 * Exhaustive by construction over the BLOG union. The three shared entries are the SAME
 * OBJECTS the case-study editor uses — assignable without a cast because #171 copied
 * their schemas verbatim, so the value shapes are identical.
 */
export const BLOG_BLOCK_REGISTRY: { [K in BlogBlockKind]: BlogEntry<K> } = {
  richText: BLOCK_REGISTRY.richText,
  heading: {
    label: (v) => firstLine(v.text, "Heading"),
    Form: HeadingForm,
    empty: emptyHeading,
  },
  pullQuote: BLOCK_REGISTRY.pullQuote,
  imageBlock: {
    label: (v) => firstLine(v.alt, "Image"),
    Form: ImageBlockForm,
    empty: BLOG_BLOCK_EMPTIES.imageBlock,
  },
  // THE POSTER IS NO LONGER HIDDEN. It was hidden because `BlogProse` rendered an <iframe>
  // and never read it — an authorable field no reader shows, the same condition that kept
  // `imageBlock` deferred. BlogProse draws images now, so the field feeds something. Blog
  // uses the shared entry unmodified again, which is why this is a plain reference rather
  // than a wrapper: the projects form IS the blog form again.
  videoEmbed: BLOCK_REGISTRY.videoEmbed,
};

// Re-exported so the host has one import for the whole registry surface.
export {
  BLOG_BLOCK_EMPTIES,
  BLOG_BLOCK_LABELS,
  BLOG_KIND_HAS_STYLE,
  BLOG_PICKER_ORDER,
  emptyHeading,
} from "./blog-empties";
