/* THE BLOG DIAGRAMS, REDRAWN AS JSX SO THEY FOLLOW THE PALETTE.
 *
 * ---- ⚠ WHY JSX AND NOT INLINE SVG, WHICH IS WHAT THE CASE STUDIES GOT --------------------------
 *
 * #365 rebuilt eight Fosfor illustrations as inline `<svg>` and that was right for them: they were
 * PURE GEOMETRY — cylinders, bars, an hourglass, a clock — so tracing paths reproduced them exactly
 * and a shape-diff could verify it.
 *
 * THESE TWO ARE TEXT. The flow below carries eleven box labels, two section labels, an inline
 * annotation and two captions; the squads grid carries a tracked-caps header, four card labels, a
 * two-line legend and a caption. SVG `<text>` DOES NOT REFLOW — a caption would break at a fixed
 * point regardless of container width, and any later copy edit would break the layout silently.
 *
 * So the text is real text, the boxes are real boxes, and every colour is a token. They reflow at
 * the blog measure, they scale with the reader's font size, and they are searchable.
 *
 * ---- WHAT THEY REPLACE ------------------------------------------------------------------------
 *
 * Two rasters drawn in cream's own ground — 81.3% and 50.3% of their pixels within 12 of `cream-50`
 * on the hue-aware predicate. `raster-grounds` found them; the render on theme three is what made
 * them visible, as a warm card in the middle of a violet article.
 *
 * ⚠ THE RASTERS STAY IN `src` AS THE FALLBACK, exactly as the Fosfor eight kept theirs. An id that
 * stops resolving draws the old picture rather than nothing.
 */
import type { ReactNode } from "react";

/* One hairline, one label, one caption — shared so the two diagrams cannot drift apart in the
 * details that are supposed to be identical. */
function Rule() {
  return <div className="h-px w-full bg-etch/10" />;
}

function Label({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    /* ⚠ `ink-600`, NOT `ink-400`. The first version used ink-400 and measured 3.33 on cream — a
       FAIL at 11px, where AA needs 4.5 and nothing about tracked caps counts as large text. Caught
       by measuring all three palettes rather than by looking, because at a glance it reads as an
       ordinary quiet label. */
    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${accent ? "text-accent-600" : "text-text-secondary"}`}>
      {children}
    </p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="font-display italic text-[0.95rem] leading-[1.5] text-text-secondary">{children}</p>;
}

/** A step in the flow — a plain card with a label. */
function Step({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[52px] flex-1 items-center justify-center rounded-lg border border-etch/8 bg-surface px-3 py-2 text-center text-[0.8rem] leading-[1.3] text-text-primary shadow-sm">
      {children}
    </div>
  );
}

/** The arrow between steps. `aria-hidden` because the reading order already implies sequence. */
function Arrow() {
  return (
    <span aria-hidden="true" className="shrink-0 select-none px-1 text-text-secondary">
      →
    </span>
  );
}

/* ---- the AI-first post ------------------------------------------------------------------- */

/** Two versions of one task: five steps with an assistant bolted onto the middle, then three of
 *  those steps collapsed into one. */
function AssistantRoute() {
  const before = ["Open the report", "Set the filters", "Read the table", "Export it", "Decide"];
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-etch/8 bg-surface-well p-5 sm:p-7">
      <div className="flex flex-col gap-3">
        <Label>Bolted on</Label>
        <Rule />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-stretch gap-1">
          {before.map((s, i) => (
            <div key={s} className="flex flex-1 items-stretch gap-1">
              <Step>{s}</Step>
              {i < before.length - 1 && <Arrow />}
            </div>
          ))}
        </div>

        {/* The bolted-on branch, hanging off the middle step. Dashed because it is the addition. */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
          <div className="flex flex-col items-center">
            <span aria-hidden="true" className="text-accent-600">↑</span>
            <div className="rounded-full border border-dashed border-accent-500/70 bg-accent-500/8 px-4 py-2 text-[0.8rem] text-accent-600">
              Ask the assistant
            </div>
          </div>
          <Note>A second route to a screen that already existed.</Note>
        </div>
      </div>

      <Rule />

      <div className="flex flex-col gap-3">
        <Label accent>Reshaped</Label>
      </div>

      <div className="flex items-stretch gap-1">
        <Step>State the question</Step>
        <Arrow />
        {/* The three collapsed steps, drawn as ghosts inside one accent-tinted region — the point
            of the diagram is that they still exist and are no longer decisions. */}
        <div className="flex flex-[2.4] flex-col justify-center gap-2 rounded-lg border border-accent-500/35 bg-accent-500/8 p-2">
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((k) => (
              <div key={k} className="h-5 flex-1 rounded border border-dashed border-accent-500/30" />
            ))}
          </div>
          <p className="text-center text-[0.75rem] leading-[1.3] text-accent-600">
            Filter, read and export collapse into one step
          </p>
        </div>
        <Arrow />
        <Step>Decide</Step>
      </div>

      <Note>The same job. A different number of decisions, and the working still shown.</Note>
    </div>
  );
}

/* ---- the design-system post --------------------------------------------------------------- */

/** A skeleton bar. Width is passed so the four cards read as four different screens rather than
 *  four copies — which is the whole subject of the diagram. */
function Bar({ w, tall = false }: { w: string; tall?: boolean }) {
  return <div aria-hidden="true" className={`${tall ? "h-3" : "h-1.5"} rounded-full bg-etch/8`} style={{ width: w }} />;
}

function Pill({ w, solid = false }: { w: string; solid?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`h-6 rounded-full ${solid ? "bg-ink-950" : "bg-etch/8"}`}
      style={{ width: w }}
    />
  );
}

/** Four squads building the same form four ways, with one rule they all kept. */
function FourSquads() {
  /* Each card is deliberately a DIFFERENT arrangement. The accent bar sits at the same place in
     every one, and that constancy is the only thing the diagram is asserting. */
  const squads = [
    { name: "Squad one", head: ["58%"], after: <><Pill w="42%" solid /><Pill w="30%" /></>, tail: ["78%", "58%", "66%"] },
    { name: "Squad two", head: ["avatar", "62%"], after: <><Bar w="88%" /><Bar w="72%" /><Bar w="80%" /></>, tail: [], foot: <Pill w="38%" solid /> },
    { name: "Squad three", head: ["46%"], after: <div className="rounded-md bg-etch/5 p-2"><Bar w="72%" /><div className="h-1.5" /><Bar w="48%" /></div>, tail: [], foot: <Pill w="46%" solid /> },
    { name: "Squad four", head: ["70%"], after: <><Pill w="30%" /><Pill w="42%" solid /></>, tail: ["82%", "56%"] },
  ];
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-etch/8 bg-surface-well p-5 sm:p-7">
      <div className="flex flex-col gap-3">
        <Label>Four squads · one component library · six months</Label>
        <Rule />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {squads.map((s) => (
          <div key={s.name} className="flex flex-col gap-2.5 rounded-lg border border-etch/8 bg-surface p-3 shadow-sm">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-text-secondary">{s.name}</p>
            {/* ⚠ FIXED HEIGHT, BECAUSE THE ALIGNMENT IS THE CLAIM. Squad two's head carries an
                avatar and the others carry a bar; letting the row size to its content put its
                accent bar 10px below the other three — measured in the browser, and it broke the
                one thing the diagram asserts. The row is now the same height in all four whatever
                sits in it, so "same place" is structural rather than coincidental. */}
            <div className="flex h-4 items-center gap-1.5">
              {s.head.map((h, k) =>
                h === "avatar"
                  ? <div key={k} aria-hidden="true" className="size-4 shrink-0 rounded-full bg-etch/8" />
                  : <Bar key={k} w={h} />,
              )}
            </div>

            {/* ⚠ THE ONE CONSTANT. Same rule, same place, four squads — the accent bar is the
                diagram's entire claim, so it is the only accent-coloured thing in the card. */}
            <div aria-hidden="true" className="h-1.5 w-[68%] rounded-full bg-accent-500" />

            <div className="rounded-md border border-etch/8 bg-surface-well px-2 py-2">
              <Bar w="56%" />
            </div>
            <div className="flex flex-col gap-1.5">{s.after}</div>
            {s.tail?.map((w, k) => <Bar key={k} w={w} />)}
            {s.foot}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-start gap-2.5 text-[0.85rem] leading-[1.5] text-text-primary">
          <span aria-hidden="true" className="mt-[7px] h-1.5 w-6 shrink-0 rounded-full bg-accent-500" />
          The error message sits above the field. Same rule, same place, four squads.
        </p>
        <p className="flex items-start gap-2.5 text-[0.85rem] leading-[1.5] text-text-secondary">
          <span aria-hidden="true" className="mt-[7px] h-1.5 w-6 shrink-0 rounded-full bg-etch/12" />
          Everything else moved.
        </p>
      </div>

      <Note>Nobody did anything wrong. Everyone moved quickly in a slightly different direction.</Note>
    </div>
  );
}

/** ⚠ THE REGISTRY IS THE ADDRESSABLE SURFACE, and an id that is not here falls through to the
 *  raster rather than throwing — a content file naming a missing diagram must not take a post down.
 *  `blog-diagrams` asserts the content and this table agree, so the silent branch is a runtime
 *  safety net rather than the thing keeping them in step. */
export const BLOG_DIAGRAMS = {
  "assistant-route": AssistantRoute,
  "four-squads": FourSquads,
} as const;

export type BlogDiagramId = keyof typeof BLOG_DIAGRAMS;

export function isBlogDiagramId(v: string): v is BlogDiagramId {
  return Object.prototype.hasOwnProperty.call(BLOG_DIAGRAMS, v);
}
