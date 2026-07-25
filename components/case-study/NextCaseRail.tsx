"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The next-case rail (NCR-1) — a fixed bottom bar on public case-study pages that
 * offers "All work" on the left and the next case study on the right. CHROME, NOT
 * CONTENT: its target is DERIVED from the projects collection (getAdjacentProject,
 * the public read), so it adds no schema and no /studio surface. It mounts ONLY from
 * the two public route pages, never from the studio canvas or preview — the same
 * exclusion PreviewRail relies on.
 *
 * Visibility is driven by TWO IntersectionObservers and ZERO scroll listeners
 * (decision #1 — ScrollManager owns scroll). The rail shows once the FIRST body
 * section has scrolled fully above the viewport, and hides again while the site footer
 * is in view so it never covers the footer's own links. There is ONE layout at every
 * width — "All work" + eyebrow + title + arrow — so no thumbnail and no collapse.
 *
 * Reduced motion is handled entirely in CSS (the .next-rail reduce block forces the
 * rail permanently visible, decision #6), so this effect does not run under it — a
 * reduced-motion reader sees the rail from the top rather than waiting on a transition.
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
  const prefersReduced = useReducedMotion();
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Reduced motion: the CSS keeps the rail permanently visible, so there is nothing
    // for the observers to drive. Skip them (decision #6 — never hidden).
    if (prefersReduced) return;
    const rail = railRef.current;
    if (!rail) return;

    // The first body section is the first child of the case-study article (the hero is
    // a sibling of <main>, not in the article). The footer is the ONE page-level footer,
    // matched as `body > footer` so a block kind that renders its own <footer> can never
    // become the hide trigger.
    const firstSection = document.querySelector("article.case-study > :first-child");
    const footer = document.querySelector("body > footer");
    if (!firstSection || !footer) return;

    let pastFirstSection = false;
    let footerVisible = false;
    const sync = () => {
      rail.dataset.shown = pastFirstSection && !footerVisible ? "true" : "false";
    };

    // SHOW once the first body section has scrolled fully ABOVE the viewport: it is no
    // longer intersecting and its bottom edge has passed the top of the viewport
    // (boundingClientRect.bottom <= 0). This is the single show predicate.
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          pastFirstSection = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
        }
        sync();
      },
      { threshold: 0 },
    );
    sectionObserver.observe(firstSection);

    // HIDE while the footer is in view, so the rail never covers the footer's links.
    const footerObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          footerVisible = entry.isIntersecting;
        }
        sync();
      },
      { threshold: 0 },
    );
    footerObserver.observe(footer);

    return () => {
      sectionObserver.disconnect();
      footerObserver.disconnect();
    };
  }, [prefersReduced]);

  return (
    <nav ref={railRef} className="next-rail" data-shown="false" aria-label="Case study navigation">
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
