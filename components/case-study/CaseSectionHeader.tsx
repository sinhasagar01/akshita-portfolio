import { Fragment } from "react";
import type { Rich } from "@/lib/case-studies/types";
import { renderRich } from "./rich";

type Props = {
  index?: string;
  eyebrow?: string;
  /** May contain "\n" for an explicit line break. */
  title?: string;
  lead?: Rich;
};

/** `.sechead` index + eyebrow, then the `.stitle` title and optional `.lead`. */
export default function CaseSectionHeader({ index, eyebrow, title, lead }: Props) {
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
            <span className="text-eyebrow tracking-[0.2em] uppercase font-semibold text-text-subtle">
              {eyebrow}
            </span>
          )}
        </div>
      )}

      {title && (
        <h2 className="font-display text-4xl font-normal text-ink-950 leading-[1.05] tracking-snug mt-6 max-w-[44rem]">
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
