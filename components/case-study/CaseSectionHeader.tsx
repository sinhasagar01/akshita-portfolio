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
  const edit = editable
    ? { contentEditable: true, suppressContentEditableWarning: true, tabIndex: 0 }
    : {};
  return (
    <header>
      {(index || eyebrow) && (
        <div className="flex items-baseline gap-[18px]">
          {index && (
            <span className="font-display italic text-xl text-accent-500 leading-none">
              {index}
            </span>
          )}
          {eyebrow && (
            <span
              {...edit}
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
          {...edit}
          data-edit={editable ? "title" : undefined}
          className={`font-display text-4xl font-normal text-ink-950 leading-[1.05] tracking-snug mt-6 max-w-[44rem]${editable ? EDIT_AFFORD : ""}`}
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
        <p className="text-lg text-ink-600 leading-relaxed mt-5 max-w-[68ch]">
          {renderRich(lead)}
        </p>
      )}
    </header>
  );
}
