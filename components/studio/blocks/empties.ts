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
  // Born with NO src, which is unpublishable on purpose — the same shape as an
  // image block born without an upload. The picker cannot know whether a URL is
  // coming, so the publish gate refuses it rather than the editor pretending it is
  // complete. VE-3 gives it a form; until then it is unreachable from the picker.
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

