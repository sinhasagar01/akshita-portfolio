import { Fragment } from "react";
import type { Rich } from "@/lib/case-studies/types";

/** Render inline rich text. A plain string passes through; { b } runs render bold. */
export function renderRich(rich: Rich) {
  if (typeof rich === "string") return rich;
  return rich.map((run, i) =>
    typeof run === "string" ? (
      <Fragment key={i}>{run}</Fragment>
    ) : (
      <b key={i} className="font-semibold text-ink-950">
        {run.b}
      </b>
    ),
  );
}
