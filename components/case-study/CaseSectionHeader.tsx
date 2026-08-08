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
      {(index || eyebrow) && (
        <div className="flex items-baseline gap-[18px]">
          {index && (
            <span className="font-display italic text-xl text-accent leading-none">
              {index}
            </span>
          )}
          {eyebrow && (
            <span
              {...editProps("Edit section eyebrow")}
              data-edit={editable ? "eyebrow" : undefined}
              className={`text-eyebrow tracking-[0.2em] uppercase font-semibold text-text-subtle${editable ? EDIT_AFFORD : ""}`}
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
          className={`font-display text-4xl font-normal text-text-primary leading-[1.05] tracking-snug mt-6 max-w-[44rem]${editable ? EDIT_AFFORD : ""}`}
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
          className={`text-lg text-text-secondary leading-relaxed mt-5 max-w-[68ch]${aff}`}
        >
          {renderRich(lead)}
        </p>
      )}
    </header>
  );
}
