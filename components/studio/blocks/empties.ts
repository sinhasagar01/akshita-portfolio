// P4 4(b)-iii — the initial value for a newly added block, one per kind.
//
// Deferred from PR A deliberately: until block-add existed these would have been
// fourteen hand-written values with no consumer and no proof, drifting from the
// schema. They land here with both.
//
// A SEPARATE .ts MODULE, not inlined in registry.tsx, for one reason: the registry
// is a client component with JSX, so `node --experimental-strip-types` cannot import
// it, and the ralph suite would have to RESTATE these shapes — a second copy of
// exactly the kind that drifts. Here the suite and the registry read the same source.
//
// Typed `{ [K in SectionBlockKind]: () => RawValue<K> }`, so:
//  - a MISSING kind is a compile error (the mapped type is exhaustive), and
//  - a missing or wrong-typed KEY is a compile error (RawValue<K> is derived from
//    the Keystatic schema),
// which is why these are checked before they are ever saved. The sanitizer's
// every-key rule is the runtime backstop; the type system is the first line.
import type { SectionBlockKind, RawValue } from "@/lib/case-studies/sections-raw";

const img = () => ({
  src: null,
  alt: "",
  width: null,
  rotate: null,
  translateX: null,
  translateY: null,
  z: null,
  // CS-4 — frame is OPTIONAL and omit-when-empty. A new image is born frameless
  // (""); the sanitizer drops the empty so nothing is written, and the adapter
  // defaults it to phone. Present here only because the derived type requires it.
  frame: "",
});

export const emptyDevice = () => ({ ...img(), label: "", dotColor: "" });
export const emptyImg = img;
export const emptyGlow = () => ({ text: "", top: "", right: "", bottom: "", left: "", size: "" });

export const BLOCK_EMPTIES: { [K in SectionBlockKind]: () => RawValue<K> } = {
  // heroCover.devices is the schema's ONLY length constraint ({min:2,max:2}), so an
  // empty heroCover is BORN with two devices — `devices: []` is rejected by
  // arrayOfLen the moment it is saved.
  heroCover: () => ({
    title: "",
    thesis: "",
    position: "",
    eyebrow: "",
    watermark: "",
    ratingChip: { stat: "", rest: "" },
    meta: [],
    devices: [emptyDevice(), emptyDevice()],
    glow: emptyGlow(),
  }),
  deviceShelf: () => ({ devices: [], glow: emptyGlow(), minHeight: null }),
  pullQuote: () => ({ text: "" }),
  glanceGrid: () => ({ items: [] }),
  issueList: () => ({ items: [] }),
  stepper: () => ({ steps: [] }),
  statCards: () => ({ heading: "", stats: [] }),
  principleCards: () => ({ heading: "", subhead: "", cards: [] }),
  figureGrid: () => ({ heading: "", items: [] }),
  featureRows: () => ({ features: [] }),
  beforeAfter: () => ({ pairs: [] }),
  swatchTokens: () => ({ groups: [] }),
  annotatedImage: () => ({
    image: emptyImg(),
    scrawl: { text: "", top: "", right: "", bottom: "", left: "" },
    callouts: [],
  }),
  richText: () => ({ paragraphs: [] }),
  closingLine: () => ({ text: "" }),
};

/**
 * EMPTY as of P4 4(b)-iv — every kind is addable.
 *
 * heroCover and annotatedImage were withheld while their REQUIRED image could not be
 * set: their empty's src is null, the fail-loud ssg adapter refuses that, and adding
 * one would have wedged the WHOLE publish (including unrelated edits) while preview
 * looked fine, because preview substitutes a placeholder.
 *
 * Upload now exists, but that alone did NOT make un-gating safe — a new block is
 * still born `src: null`, so publishing between adding and uploading would wedge the
 * build just the same. What makes it safe is that the gate MOVED to where it can
 * actually check: publish now re-renders every changed project through the ssg
 * adapter and refuses an unpublishable draft with the adapter's own message
 * (lib/studio/validate-draft-sections.ts). The picker could only guess; publish can
 * look.
 *
 * Kept as an empty set rather than deleted, so the mechanism stays available if a
 * future kind ever needs gating again.
 */
export const ADD_GATED_UNTIL_UPLOAD = new Set<SectionBlockKind>();
