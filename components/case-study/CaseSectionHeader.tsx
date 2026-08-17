import { Fragment } from "react";
import type { Rich } from "@/lib/case-studies/types";
import { renderRich } from "./rich";
import { EDIT_AFFORD } from "./editable";

type Props = {
  index?: string;
  eyebrow?: string;
  /** May contain "\n" for an explicit line break. */
  title?: string;
  lead?: Rich;
  /** CS-7d — studio inline canvas only. Tags the plain-string header fields as
   *  in-place editable (inert data-edit markers + contentEditable); the studio wires
   *  the blur writeback. Off by default, so the public render is byte-identical. */
  editable?: boolean;
};

/** `.sechead` index + eyebrow, then the `.stitle` title and optional `.lead`. */
export default function CaseSectionHeader({ index, eyebrow, title, lead, editable = false }: Props) {
  // role=textbox + a name, so the canvas's editable regions are announced as
  // editable fields rather than as anonymous text. The data-edit marker below
  // names the field, which is the SECTION-level writeback seam (setSection), not
  // the block one — so it stays as it is; only the naming is added.
  const aff = editable ? EDIT_AFFORD : "";
  const editProps = (label: string, rich = false) =>
    editable
      ? {
          contentEditable: true,
          suppressContentEditableWarning: true,
          tabIndex: 0,
          role: "textbox",
          "aria-label": label,
          // Rich fields serialize back through richToMarkers, not innerText.
          ...(rich ? { "data-edit-rich": "" } : {}),
        }
      : {};
  return (
    <header>
      {/* ⚠ DEVICE 2 — THE SECTION RULE, AND IT REPLACES THE SAME PATTERN THE HOME PAGE RETIRED.
          This was an italic accent numeral beside a tracked-caps eyebrow: the eyebrow-plus-index
          construction the direction retires by name, carrying an accent that is not one of its four
          sanctioned uses. The content maps onto the device without being rewritten — section `index`
          is already `'01'` and `eyebrow` is already a short label like "The setup", so the rule reads
          `SHEET 01 ———— THE SETUP`, which is what the approved drawing does with the same two slots.

          ⚠ AND THE LINE IS ADDED TO A SHARED COMPONENT, WHICH IS WHY IT IS PARITY-SAFE. The public
          article and the studio canvas render through this same file, so a new element appears in
          BOTH and the element counts stay equal. An editable-ONLY wrapper is the failure mode the
          parity convention names, and this is the opposite of one: nothing here is conditional on
          `editable` except the affordances that were already conditional.

          The eyebrow keeps every editable affordance it had — `data-edit`, `contentEditable`,
          `role="textbox"`, its label and the marker class — because those ADD to the canvas without
          moving a box. The index stays non-editable, exactly as it was. */}
      {(index || eyebrow) && (
        <div className="sheet-rule">
          {index && <span className="sheet-mark-text">{`Sheet ${index}`}</span>}
          <span className="sheet-rule-line" aria-hidden />
          {eyebrow && (
            <span
              {...editProps("Edit section eyebrow")}
              data-edit={editable ? "eyebrow" : undefined}
              className={`sheet-mark-text${editable ? EDIT_AFFORD : ""}`}
            >
              {eyebrow}
            </span>
          )}
        </div>
      )}

      {title && (
        <h2
          {...editProps("Edit section title")}
          data-edit={editable ? "title" : undefined}
          /* ⚠ THE SECTION ROLE, AND THE WEIGHT MOVES 400 TO 600 ON PURPOSE. This was `text-4xl` at
             `font-normal`, so a 36px section head sat LIGHTER than the 600 heads the home page now
             uses at the same level — the size-says-more, weight-says-less cancellation this
             stylesheet already records as a defect. `.sheet-h2` is the declared Section role and
             carries the same clamp, line-height and tracking every other opener on the site has.
             The measure narrows from 44rem to the role's 24ch, which is the spec's own figure for a
             head rather than a paragraph. */
          className={`sheet-h2 mt-[clamp(18px,2.4vw,30px)]${editable ? EDIT_AFFORD : ""}`}
        >
          {title.split("\n").map((line, i, arr) => (
            <Fragment key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </h2>
      )}

      {lead && (
        <p
          {...editProps("Edit section lead", true)}
          data-edit={editable ? "lead" : undefined}
          /* ⚠ THE LEDE ROLE, AND THE MEASURE NARROWS FROM 68ch TO 48ch — WHICH IS A REAL CHANGE AND
             IS THE COMP'S OWN FIGURE RATHER THAN MINE. The approved drawing sets its lede at 46ch and
             the specification's Body role says 48ch for "lede and summaries", so the narrow measure is
             the design's intent rather than a side effect of adopting a class. 68ch is this site's
             PROSE measure — the blog's locked property — and a section lede is not prose at that
             length. Stated because a long lead will wrap more than it used to, and that is worth an
             owner's eye rather than being buried. */
          className={`sheet-lede mt-[clamp(12px,1.4vw,18px)]${aff}`}
        >
          {renderRich(lead)}
        </p>
      )}
    </header>
  );
}
