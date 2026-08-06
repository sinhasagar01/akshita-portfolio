// The Board card's SHAPE — a miniature of what a section renders, one per block KIND.
//
// AN ABSTRACTION, NOT A RENDER, and the distinction is the whole design. A mini that tries to be
// a small copy of the section stops matching it the moment the section changes, and a preview
// that teaches the wrong thing is worse than no preview. These draw the section's SHAPE — where
// the mass sits, whether it is text or image, one column or a grid — and the chips beneath say
// what it actually is. The shape says what it looks like; the chips say what it is.
//
// A MAPPED TYPE, NOT A `Record<string, …>` WITH A FALLBACK, and that is a deliberate departure
// from the precedent it is modelled on. `PreviewRail.tsx`'s THUMB and LABEL tables are both
// `Record<string, …>` read through `?? fallback`, so a 17th kind lands on "txt"/"Section" with no
// compile error. STATE records that exact shape letting `videoEmbed.poster` stay authorable and
// unseen for three PRs, and the rule it drew from it: A MAPPED TYPE FAILS COMPILATION; A SET,
// AND A `default:` ARM, JUST RETURN. So `MINI` is keyed by `SectionBlockKind` and adding a kind
// to the schema breaks the build here until its mini exists.
//
// WHOEVER ADDS A KIND ADDS ITS MINI, IN THE SAME PR. `Generic` exists so the fallback is a
// deliberate choice a future author can make rather than a hole they fall through — it is
// currently referenced by nothing, and if it ever gains a caller that is a decision to record.
import type { SectionBlockKind } from "@/lib/case-studies/sections-raw";

/* THE CONTENTS DEEPEN A STEP ON HOVER RATHER THAN MOVING. A mini that slides competes with the
   card it sits on, so nothing here translates — only opacity moves, on the FOLLOWER tier so it
   trails the card's own lift. The delay is the motion block's existing 40ms rather than a new
   token: the ramp already encodes this order.
   Every token carries its literal fallback, which `studio-motion` C2 requires and C3 checks
   against the declared value. */
const FOLLOW =
  "transition-opacity duration-[var(--studio-lift-follow,240ms)] delay-[var(--studio-t2-delay,40ms)] ease-[var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))]";

/** A text rule. Widths are proportions of the section's real rhythm, not decoration. */
function Line({ w, strong }: { w: string; strong?: boolean }) {
  return (
    <span
      className={`block h-[3px] rounded-[2px] ${strong ? "bg-studio-ink-950/34 group-hover:bg-studio-ink-950/46" : "bg-studio-ink-950/22 group-hover:bg-studio-ink-950/32"} ${FOLLOW}`}
      style={{ width: w }}
    />
  );
}

/** A block of mass — an image, a card, a tile. */
function Box({ grow, tall }: { grow?: boolean; tall?: boolean }) {
  return (
    <span
      className={`block rounded-[3px] bg-studio-ink-950/16 group-hover:bg-studio-ink-950/24 ${tall ? "h-full" : "h-[22px]"} ${grow ? "flex-1" : ""} ${FOLLOW}`}
    />
  );
}

/* HOW MUCH OF THE SLACK A SHAPE TAKES DEPENDS ON WHAT IT REPRESENTS, and getting this wrong
   twice is what taught it. Fixed-height parts centred in a 265px mini read as an empty panel
   with a few marks adrift in it. Stretching everything to fill instead put four text rules 56px
   apart, which reads as a ladder rather than as text — the opposite error, equally wrong.
   THE SPLIT IS BY WHAT THE SHAPE MEANS. A shape standing for MASS — tiles, images, devices, a
   player — fills its box, because mass filling the frame is what those sections do. A shape
   standing for TEXT stays compact and centred, because four evenly-spread rules do not read as a
   paragraph at any size. The empty space around a text mini is not dead space; it is the
   section's own airiness, which is the thing the mini is describing. */
const Stack = ({ children, fill }: { children: React.ReactNode; fill?: boolean }) => (
  <span
    className={`flex w-full flex-col ${fill ? "h-full max-h-[168px] justify-between gap-[6px]" : "justify-center gap-[7px]"}`}
  >
    {children}
  </span>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <span className="flex w-full flex-1 gap-[6px]">{children}</span>
);

/* ---- the archetypes -------------------------------------------------------------------------
   Eleven shapes over sixteen kinds. Kinds share a shape only when they genuinely render the same
   mass — `glanceGrid` and `statCards` are both label/value tiles, `issueList` and `stepper` are
   both titled rows. Where two kinds differ in what the eye sees, they get different minis even if
   their data is similar. */

const Text = () => (
  <Stack>
    <Line w="92%" /> <Line w="78%" /> <Line w="88%" /> <Line w="54%" />
  </Stack>
);

const ClosingLine = () => (
  <span className="flex w-full flex-col items-center gap-[7px]">
    <Line w="70%" strong />
    <Line w="44%" />
  </span>
);

const Quote = () => (
  <span className="flex w-full gap-[9px] pl-[2px]">
    <span className="w-[2px] shrink-0 rounded-[2px] bg-studio-accent-500/60" />
    <Stack>
      <Line w="88%" strong /> <Line w="72%" strong /> <Line w="40%" />
    </Stack>
  </span>
);

const Devices = ({ n }: { n: number }) => (
  <span className="flex h-full max-h-[168px] w-full items-end justify-center gap-[6px]">
    {Array.from({ length: n }, (_, i) => (
      <span
        key={i}
        className={`block w-[15px] rounded-[3px] bg-studio-ink-950/16 group-hover:bg-studio-ink-950/24 ${FOLLOW}`}
        style={{ height: `${i === Math.floor(n / 2) ? 76 : 58}%` }}
      />
    ))}
  </span>
);

const Tiles = ({ cols, rows }: { cols: number; rows: number }) => (
  <Stack fill>
    {Array.from({ length: rows }, (_, r) => (
      <Row key={r}>
        {Array.from({ length: cols }, (_, c) => (
          <Box key={c} grow />
        ))}
      </Row>
    ))}
  </Stack>
);

/* THE ONLY TWO `rounded-full` SHAPES IN THIS FILE ARE DOTS — the stepper's number marker below
   and the annotated image's pins. Both are the same family as the status dots `studio-ink` F5
   already protects, so roundness carries meaning there. `rounded-[1px]` IS RESERVED for the drag handle's dot and F5 counts it; every RULE here takes 2px
   instead: at 3px tall a full round and a 2px radius are the same pixels, and spending a declared
   pill on something indistinguishable would dilute the count that F5 exists to keep honest. */
const ListRows = ({ numbered }: { numbered?: boolean }) => (
  <Stack>
    {[0, 1, 2].map((i) => (
      <span key={i} className="flex w-full items-center gap-[6px]">
        <span
          className={`block size-[9px] shrink-0 bg-studio-ink-950/20 group-hover:bg-studio-ink-950/30 ${numbered ? "rounded-full" : "rounded-[2px]"} ${FOLLOW}`}
        />
        <span className="flex flex-1 flex-col gap-[3px]">
          <Line w={["82%", "68%", "74%"][i]} strong />
          <Line w={["56%", "48%", "60%"][i]} />
        </span>
      </span>
    ))}
  </Stack>
);

const FigureTiles = () => (
  <Stack fill>
    <Row>
      <Box grow tall /> <Box grow tall />
    </Row>
    <Line w="52%" />
  </Stack>
);

const FeatureRows = () => (
  <Stack>
    {[0, 1].map((i) => (
      <span key={i} className={`flex w-full items-center gap-[7px] ${i === 1 ? "flex-row-reverse" : ""}`}>
        <Box grow />
        <span className="flex flex-1 flex-col gap-[3px]">
          <Line w="76%" strong /> <Line w="52%" />
        </span>
      </span>
    ))}
  </Stack>
);

const Split = () => (
  <span className="flex h-full max-h-[168px] w-full items-stretch gap-[7px]">
    <span className="flex flex-1 flex-col gap-[4px]">
      <Box tall />
    </span>
    <span className={`w-px shrink-0 bg-studio-accent-500/40 ${FOLLOW}`} />
    <span className="flex flex-1 flex-col gap-[4px]">
      <Box tall />
    </span>
  </span>
);

const Annotated = () => (
  <span className="relative flex h-full max-h-[168px] w-full items-stretch">
    <Box tall grow />
    {[
      { top: "22%", left: "18%" },
      { top: "58%", left: "62%" },
    ].map((p, i) => (
      <span
        key={i}
        className={`absolute size-[7px] rounded-full bg-studio-accent-500/70 group-hover:bg-studio-accent-500 ${FOLLOW}`}
        style={p}
      />
    ))}
  </span>
);

const Player = () => (
  <span className="relative flex h-full max-h-[168px] w-full items-stretch">
    <Box tall grow />
    <span
      className={`absolute left-1/2 top-1/2 size-0 -translate-x-1/2 -translate-y-1/2 border-y-[6px] border-l-[10px] border-y-transparent border-l-studio-ink-950/34 group-hover:border-l-studio-ink-950/50 ${FOLLOW}`}
    />
  </span>
);

const Swatches = () => (
  <Stack fill>
    <Row>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`block h-5 flex-1 rounded-[3px] bg-studio-ink-950/16 group-hover:bg-studio-ink-950/24 ${FOLLOW}`}
        />
      ))}
    </Row>
    <Line w="46%" />
  </Stack>
);

const Hero = () => (
  <Stack>
    <Line w="34%" />
    <Line w="88%" strong />
    <span className="mt-[2px] flex w-full items-end justify-center gap-[6px]">
      {[0, 1].map((i) => (
        <span
          key={i}
          className={`block w-[15px] rounded-[3px] bg-studio-ink-950/16 group-hover:bg-studio-ink-950/24 ${FOLLOW}`}
          style={{ height: i === 0 ? "52%" : "66%" }}
        />
      ))}
    </span>
  </Stack>
);

/** The deliberate fallback. Referenced by nothing today — if it ever gains a caller, a kind
 *  shipped without its mini and that is a decision to record, not a default to rely on. */
export const Generic = () => (
  <Stack>
    <Line w="70%" /> <Line w="86%" /> <Line w="48%" />
  </Stack>
);

/* THE TABLE. Keyed by the union, so a 17th kind is a compile error here before it is a blank card
   in the studio. Sixteen entries, one per kind — none falls through. */
const MINI: { [K in SectionBlockKind]: () => React.ReactElement } = {
  heroCover: Hero,
  deviceShelf: () => <Devices n={3} />,
  pullQuote: Quote,
  glanceGrid: () => <Tiles cols={3} rows={2} />,
  issueList: () => <ListRows />,
  stepper: () => <ListRows numbered />,
  statCards: () => <Tiles cols={3} rows={1} />,
  principleCards: () => <Tiles cols={2} rows={2} />,
  figureGrid: FigureTiles,
  featureRows: FeatureRows,
  beforeAfter: Split,
  // Same two-column silhouette as beforeAfter — it IS a before/after, scroll-pinned.
  beforeAfterStory: Split,
  swatchTokens: Swatches,
  annotatedImage: Annotated,
  richText: Text,
  closingLine: ClosingLine,
  videoEmbed: Player,
};

/**
 * The section's shape, taken from its FIRST block — the one that sets what the section looks
 * like. An empty section draws nothing rather than a generic shape, because "no blocks yet" is a
 * real state the card already says in words and a shape would contradict it.
 */
export default function SectionMini({ kind }: { kind: SectionBlockKind | null }) {
  if (!kind) return null;
  const Shape = MINI[kind];
  return (
    <span aria-hidden className="flex w-full flex-1 flex-col items-center justify-center overflow-hidden">
      <Shape />
    </span>
  );
}
