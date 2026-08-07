"use client";

// BS-4b — the love affordance, wired to the real count.
//
// TWO VARIANTS, AND ONLY ONE OF THEM IS PRESSABLE SITE-WIDE.
//
//   `control` — the end-of-article pill. The ONE love control on the whole site.
//   `readout` — heart plus number, not a button, not focusable. The vessel, the capsule,
//               and both index cards.
//
// WHY THE READOUTS ARE NOT BUTTONS. Two independent reasons, either one sufficient:
//
//   1. The vessel and capsule are aria-hidden="true" containers that get pointer-events
//      when shown. Focusable content inside an aria-hidden subtree is an ARIA violation,
//      and it cannot be patched from below — aria-hidden="false" on a descendant does not
//      undo an ancestor's true. Today it is legal only because PR 2's button was disabled.
//   2. They are FIXED-POSITION and appear and vanish on scroll. Putting one in the tab
//      order means a keyboard reader meets it at a point unrelated to reading order, and
//      it can disappear from under their focus mid-article. No aria surgery fixes that.
//
//   The index cards have their own reason: both sit INSIDE the card's block-level <a>
//   (blog/page.tsx), and interactive content inside an anchor is an invalid content model
//   — not merely a click-handling problem that stopPropagation would patch. Making them
//   pressable would mean un-wrapping both cards. And one-way love plus thumb-sized targets
//   in a scrolling list means an accidental tap permanently loves an unread post.
//
// NO aria-pressed ANYWHERE. Love is one-way (4a), so there is no second state to toggle
// back to, and aria-pressed would promise one. Once loved, the pill stays MOUNTED and
// switches to aria-disabled — not `disabled`, and not unmounted. Both of those blur the
// element, dropping a keyboard reader's place in the article the instant they press.
import { useEffect, useState } from "react";
import { useLove } from "./LoveProvider";

const HEART_PATH =
  "M12 20.5S3.5 14.8 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.6-8.5 11.3-8.5 11.3Z";

function Heart({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d={HEART_PATH}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

/**
 * The number slot. ALWAYS RENDERED, always `min-w-[3ch]` and `tabular-nums`, even when it
 * holds nothing.
 *
 * Reserving the space is what makes the count's arrival cost ZERO layout shift. The
 * capsule is the reason: `.blog-cap-right` is `margin-left: auto`, so anything changing
 * its width slides the whole group sideways — a number appearing, and later 9 becoming 10,
 * would both visibly jump. tabular-nums holds the digits steady; the min-width holds 1, 2
 * and 3 digits at one width. Past 999 it grows once, which is a good problem to have.
 *
 * Rendering NOTHING at 0 and at null is PR 2's fabricated-fact rule: an absent number
 * reads as "not loaded", a "0" claims nobody liked it. Reserving the box claims nothing.
 */
function Count({ count, className = "" }: { count: number | null; className?: string }) {
  return (
    // h/leading match the heart's 18px so the box is the SAME SIZE EMPTY AS FULL. Without
    // the fixed height an empty inline-block has no line box at all, and the first digit's
    // arrival grew the stream card's meta row by 0.38px — small, but a shift is a shift,
    // and it is the one axis min-width does not cover.
    <span className={`inline-block h-[18px] min-w-[3ch] leading-[18px] tabular-nums ${className}`}>
      {count !== null && count > 0 ? count : null}
    </span>
  );
}

export default function LoveButton({
  slug,
  variant = "readout",
}: {
  slug: string;
  variant?: "readout" | "control";
}) {
  const { count, loved, love } = useLove(slug);
  const [burst, setBurst] = useState(false);

  // The burst is mounted for its duration and then removed. `animate-ping` is a Tailwind
  // built-in, so the whole animation needs no authored CSS — and the global reduced-motion
  // killswitch (globals.css) zeroes animation-duration, so it self-disables there.
  useEffect(() => {
    if (!burst) return;
    const id = window.setTimeout(() => setBurst(false), 620);
    return () => window.clearTimeout(id);
  }, [burst]);

  if (variant === "readout") {
    // Not a button, not focusable, no handler. A reflection of state it does not own.
    return (
      /* ⚠ THE SECONDARY TEXT ROLE, NOT THE ink-400 RUNG — THIS IS TEXT, at 12.5px, and it was
         failing AA on EVERY palette: 3.49 / 3.71 / 3.62 / 4.50 / 4.42 on cream-50 and worse on
         canvas. The usage map's row for that rung asserted "never text"; this readout is where the
         claim was false. The role lands at 7.42 / 7.11 / 7.26 / 8.94 / 8.73.

         ⚠ AND NO GATE PROTECTS THIS ONE. `theme-contrast` M finds a foreground near a ground
         declared in the same file; this readout inherits its ground from the article card several
         components up, so restoring the failure leaves M green — proven by mutation. The comment is
         the protection. (The old class is described rather than spelled: naming it would make it
         compile from this comment alone.) */
      <span className={`inline-flex items-center gap-1.5 ${loved ? "text-accent-500" : "text-text-secondary"}`}>
        <Heart filled={loved} className="size-[18px]" />
        <Count count={count} className="text-[12.5px]" />
      </span>
    );
  }

  return (
    <button
      type="button"
      // aria-disabled, NOT disabled: it keeps the element focusable, so pressing it does
      // not throw the reader back to <body>.
      aria-disabled={loved || undefined}
      aria-label={loved ? "You loved this post" : "Love this post"}
      onClick={
        loved
          ? undefined
          : () => {
              setBurst(true);
              love();
            }
      }
      className={`inline-flex items-center gap-3 rounded-full border px-7 py-3.5 text-[15px] transition-colors ${
        loved
          ? "cursor-default border-accent-500 bg-accent-500/[0.07] text-accent-600"
          : "border-ink-400 text-text-secondary hover:border-accent-500 hover:text-accent-600"
      }`}
    >
      <span className="relative inline-flex">
        {burst ? (
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-accent-500/40" />
        ) : null}
        <Heart
          filled={loved}
          className={`relative size-[22px] transition-transform duration-200 ${burst ? "scale-125" : "scale-100"}`}
        />
      </span>
      {loved ? "Loved" : "Love this"}
    </button>
  );
}

/**
 * The end-of-article hint, and the article's polite live region.
 *
 * Nothing at null (not loaded) and nothing at 0 — the same rule the Count slot follows.
 * PR 2 dropped this line because there was no count to report; with one it can return, but
 * "0 people loved this" would be the exact fabricated fact PR 2 refused.
 *
 * It doubles as the aria-live region, so the count change after a press is announced once.
 * The button's own accessible name flipping to "You loved this post" is the other half.
 * `min-h` holds the line's space so its arrival does not nudge the block.
 */
export function LoveHint({ slug }: { slug: string }) {
  const { count } = useLove(slug);
  return (
    <p aria-live="polite" className="mt-4 min-h-[1.4em] text-[14px] text-text-secondary">
      {count !== null && count > 0 ? `${count} ${count === 1 ? "person" : "people"} loved this` : null}
    </p>
  );
}
