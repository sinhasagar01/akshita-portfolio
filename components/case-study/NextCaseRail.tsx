"use client";

/**
 * The next-case rail (NCR-1) — a fixed bottom bar on public case-study pages that
 * offers "All work" on the left and the next case study on the right. CHROME, NOT
 * CONTENT: its target is DERIVED from the projects collection (getAdjacentProject,
 * the public read), so it adds no schema and no /studio surface. It mounts ONLY from
 * the two public route pages, never from the studio canvas or preview — the same
 * exclusion PreviewRail relies on.
 *
 * Step 2 renders the hidden state only: data-shown is a fixed "false" and there are
 * no observers yet. Step 3 adds the two IntersectionObservers that flip data-shown.
 * There is ONE layout at every width — "All work" + eyebrow + title + arrow — so there
 * is no thumbnail and no responsive collapse.
 */

export type NextCaseRailProps = {
  /** Where "All work" points — the homepage work anchor, passed from the page so the
   *  value is never retyped here. */
  allWorkHref: string;
  /** The next study's route (projectPath) and title, from getAdjacentProject. */
  nextHref: string;
  nextTitle: string;
};

export default function NextCaseRail({ allWorkHref, nextHref, nextTitle }: NextCaseRailProps) {
  return (
    <nav className="next-rail" data-shown="false" aria-label="Case study navigation">
      <a className="next-rail-all" href={allWorkHref}>
        <span aria-hidden="true">←</span> All work
      </a>
      <a className="next-rail-link" href={nextHref}>
        <span className="next-rail-labels">
          <span className="next-rail-eyebrow">Next case study</span>
          <span className="next-rail-title">{nextTitle}</span>
        </span>
        <span className="next-rail-arrow" aria-hidden="true">→</span>
      </a>
    </nav>
  );
}
