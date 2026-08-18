import type { HTMLAttributes, ReactNode } from "react";

/**
 * THE SECTION RULE PLUS THE HEADING IT INTRODUCES — the sheet grammar's replacement for the
 * retired section heading on the home page.
 *
 * ⚠ THE RULE AND THE HEADING ARE TWO ELEMENTS, WHICH IS THE WHOLE POINT OF THE SWAP. The
 * component this replaces rendered ONE element that was an index numeral, an italic display word
 * and a glow, all in a stack — the eyebrow-above-a-heading pattern the direction retires. Here the
 * rule is a rule with labels ON it, and the heading is a heading. `.sheet-rule` carries no
 * heading of its own precisely so that the section owns its outline.
 *
 * ⚠ AND THE HEADING STAYS AN `h2` ON EVERY SECTION, WHICH IS A DELIBERATE DEPARTURE FROM THE
 * APPROVED SHEET. In that document sheet 02 has a rule and no section heading, because its ROWS
 * carry the headings. Copying that literally would leave a top-level region of the page with no
 * heading at all and drop a level out of the document outline — an accessibility regression paid
 * for a visual convention. So the rule is adopted and the outline is kept, and if a section is
 * later meant to read without a visible heading that is a design decision with a mock rather than
 * a side effect of a component swap.
 *
 * ⚠ THE RIGHT-HAND LABEL IS NOT THE HEADING TEXT. On the sheet, `Sheet 02` sits opposite
 * `Plate schedule · four studies` while the heading says something else entirely. Passing one
 * string for both would collapse a real distinction: the label describes what the sheet CONTAINS
 * and the heading is what the section SAYS. `mark` defaults to `title` only so a call site that
 * genuinely has one string is not forced to repeat it.
 */

type Props = {
  /** The sheet number, printed as given. "01", not 1 — a sheet number is a label, not a count. */
  sheet: string;
  /** The heading. Rendered as the section's `h2`. */
  title: string;
  /**
   * The rule's right-hand label. Describes what the section contains. Falls back to `title`
   * rather than to an empty rule, because a rule with one label reads as unfinished.
   */
  mark?: string;
  /** The lede beneath the heading. Optional, because not every sheet carries one. */
  lede?: string;
  className?: string;
  /**
   * Attributes spread onto the `h2`. A pass-through rather than an `editable` prop, matching the
   * component it replaces — "editable" is the studio's concept and does not belong in a
   * presentational file.
   */
  titleProps?: HTMLAttributes<HTMLHeadingElement>;
  /** Rendered between the heading block and whatever follows. Used for a section's own controls. */
  children?: ReactNode;
};

/* The gap below the rule and above the heading, and the gap under the heading block. Both are
   fluid on the same curve as the sheet's own vertical rhythm so a narrow viewport does not spend
   its height on air — the record already carries a hero that put 126px of air in a 573px column
   and pushed its scroll cue below the fold.

   ⚠ THESE WERE INLINE STYLES AND THE REASON THEY HAD TO BE IS GONE. `.sheet-lede` declared
   `margin: 0` while being UNLAYERED, so a `mt-*` utility on it resolved to nothing and an inline
   style was the only spelling that reached the element. The roles stopped declaring `margin`, so
   the utilities work, and these are the same two numbers `CaseSectionHeader` has always written —
   which is the point. One intent had two mechanisms across two components, and only one drew.

   AND THE CLASSES COST NOTHING, MEASURED RATHER THAN ASSUMED. Both already exist in the built
   stylesheet because the case-study head emits them, so this is a second consumer of an existing
   rule and not a new one. An inline style, by contrast, is emitted per element into every rendered
   page and is invisible to every gate this repository has. */

export default function SheetSectionHead({
  sheet,
  title,
  mark,
  lede,
  className,
  titleProps,
  children,
}: Props) {
  return (
    <div className={className}>
      {/* DEVICE 2. `aria-hidden` on the line alone, never on the labels: the line is decoration
          and the labels are the only place the sheet number is stated. */}
      <div className="sheet-rule">
        <span className="sheet-mark-text">{`Sheet ${sheet}`}</span>
        <span className="sheet-rule-line" aria-hidden />
        <span className="sheet-mark-text">{mark ?? title}</span>
      </div>

      <div className="mt-[clamp(18px,2.4vw,30px)]">
        <h2 className="sheet-h2" {...titleProps}>
          {title}
        </h2>
        {lede ? (
          <p className="sheet-lede mt-[clamp(12px,1.4vw,18px)]">
            {lede}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}
