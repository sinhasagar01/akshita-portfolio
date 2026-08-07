import { Fragment } from "react";
import type { Rich } from "@/lib/case-studies/types";
import { isSafeHref } from "@/lib/case-studies/adapter";

/**
 * Render inline rich text. A plain string passes through; a run list renders one mark
 * per run — `{ b }` bold, `{ i }` italic, `{ a, href }` link.
 *
 * The href is re-checked HERE as well as in the parser. The parser gates content coming
 * through the adapter, but runs can also be hand-authored (boat-crest.ts builds them
 * directly), and a render-time check is the one that actually stands between a bad
 * scheme and the DOM. A refused href degrades to its plain text rather than an <a>.
 */
export function renderRich(rich: Rich) {
  if (typeof rich === "string") return rich;
  return rich.map((run, i) => {
    if (typeof run === "string") return <Fragment key={i}>{run}</Fragment>;
    if ("b" in run) {
      return (
        <b key={i} className="font-semibold text-text-primary">
          {run.b}
        </b>
      );
    }
    if ("i" in run) {
      return (
        <em key={i} className="italic">
          {run.i}
        </em>
      );
    }
    if (!isSafeHref(run.href)) return <Fragment key={i}>{run.a}</Fragment>;
    // Only http(s) leaves the site, so only http(s) gets the new-tab treatment and the
    // opener guard. A mailto or an in-page anchor opening in a new tab would be wrong.
    const external = /^https?:/i.test(run.href.trim());
    return (
      <a
        key={i}
        href={run.href}
        className="underline decoration-accent-500/40 underline-offset-2 transition-colors hover:decoration-accent-500"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {run.a}
      </a>
    );
  });
}
