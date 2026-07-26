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
import type { ComponentType } from "react";
import type { BlogBlockKind, BlogRawValue } from "@/lib/blog/blocks-raw";
import { BLOCK_REGISTRY } from "./registry";
import { BLOG_BLOCK_EMPTIES, emptyHeading } from "./blog-empties";
import { TextField } from "./fields";

/** The props a blog block form receives — the same contract BlockFormProps states, over
 *  the BLOG value union. `collection` is threaded exactly as #172 requires. */
export type BlogBlockFormProps<K extends BlogBlockKind> = {
  value: BlogRawValue<K>;
  onChange: (next: BlogRawValue<K>) => void;
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
