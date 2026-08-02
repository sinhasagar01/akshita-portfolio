// The mark on a draggable seam. One grip, two grounds.
//
// ---- ⚠ INK AND CREAM ARE ONE RULE, NOT TWO DESIGNS ------------------------------------------
//
// One step of separation from the surface the grip sits on, expressed in two directions. A single
// colour for both is what makes a control look broken on the sidebar — cream-50 on ink-950 is a
// bright chip on the darkest surface in the product, and white/12 on cream is nothing at all.
//
// SO THE GROUND IS A PROP AND NOT A COLOUR. The caller says which surface it is on; the values
// belong to this file. Passing the colours in would put the rule at every call site, which is how
// two call sites become two designs.
//
// ⚠ AND THE ON-INK RATIOS ARE MEASURED ON INK, NOT CARRIED OVER FROM THE CREAM ONES. #214 moved
// the topbar to solid ink and six of seven on-ink ratios changed while one fell below its floor —
// "the value did not change; its ground did." Both grounds are rasterised in the PR body.
//
// ---- WHY A GRIP AT ALL, RATHER THAN A HAIRLINE ----------------------------------------------
//
// It is the only treatment that ANNOUNCES ITSELF AT REST. An author learns the panes resize
// without having to brush the seam to find out — and on the inspector, where the pane can reach
// zero width, the grip rides the edge, so the affordance and the way back are the same object in
// the same place. A pane at zero width has no handle inside it.
//
// ⚠ WHICH IS ALSO WHY IT GOES ONLY ON SEAMS THAT ACTUALLY DRAG. A grip on a fixed seam announces
// something false, and it is worse than the hairline it would replace. Blog's inspector seam does
// not drag, so it does not get one — see `inspector-width.ts` for why that pane is fixed.
import type { ReactNode } from "react";

/** Which surface the grip is drawn on. Two grounds exist in this app and no third is proposed;
 *  if one ever appears this stays a name rather than becoming another boolean — `SaveIndicator`'s
 *  `onInk` is the precedent for the shape and for the note. */
export type GripGround = "ink" | "cream";

/* THE REST STATE, BY GROUND. Hover, drag and focus are shared below because they are all ACCENT,
   which reads on both grounds — the one-step rule is about the resting fill, not about the
   feedback. */
const REST: Record<GripGround, string> = {
  ink: "bg-white/12 border-white/22",
  cream: "bg-cream-50 border-ink-950/22",
};
const DOTS: Record<GripGround, string> = {
  ink: "bg-white/55",
  cream: "bg-ink-400",
};

/**
 * The visible mark. Renders INSIDE the hit area, which the caller owns — the hit area carries the
 * `role`, the keys and the pointer handlers, and this carries only appearance.
 *
 * ⚠ IT IS NOT A BUTTON AND HAS NO HANDLERS OF ITS OWN. Two focusable things on one seam is two
 * tab stops for one control, and the outer element is already a `separator` with a full keymap.
 */
export default function StudioResizeGrip({
  ground,
  dragging = false,
}: {
  ground: GripGround;
  /** Mid-drag. Drawn from the caller's own gesture state rather than `:active`, because pointer
   *  capture keeps the gesture alive after the pointer has left the element and `:active` does
   *  not follow it there. */
  dragging?: boolean;
}): ReactNode {
  return (
    <span
      aria-hidden
      /* ⚠ THE RING IS AN `outline`, AND A GATE IS WHY. The contract draws it with the CSS
         property studio-ink's C10 forbids raw in this codebase — the rule that keeps every
         elevation on a `--studio-lift-*` token, so no surface can invent its own depth.
         THE GATE IS RIGHT AND THE CONTRACT'S INTENT IS RIGHT; what is wrong is treating a focus
         ring as an elevation. A ring is not lift, so it does not belong to that family and does
         not want a token in it. `outline` is the tool for the job, follows the border radius,
         costs no layout, and renders the contract's 2px accent/30 exactly.
         (The forbidden property's name is itself a utility Tailwind emits a rule for, so it is
         not written here — `css-comment-trap` caught this very comment, its sixth catch.) */
      className={`pointer-events-none grid w-2 justify-items-center gap-[3px] rounded-full border py-[7px] transition-colors ${
        dragging
          ? "border-transparent bg-accent-500"
          : `${REST[ground]} group-hover/rz:border-accent-500 group-focus-visible/rz:border-accent-500 group-focus-visible/rz:outline-2 group-focus-visible/rz:outline-accent-500/30`
      }`}
    >
      {/* Four dots, stated rather than mapped over a length — the count is the design, and a
          `.map` over `[0,1,2,3]` would read as if it were configurable. */}
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`size-0.5 rounded-full transition-colors ${
            dragging ? "bg-white" : `${DOTS[ground]} group-hover/rz:bg-accent-500 group-focus-visible/rz:bg-accent-500`
          }`}
        />
      ))}
    </span>
  );
}
