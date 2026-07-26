// Studio sidebar active-route matching. A dependency-free leaf so ralph can load it —
// StudioSidebar.tsx is .tsx and uses next/navigation, so the predicate cannot be tested
// where it used to live.
//
// THE BUG THIS REPLACES: `pathname === area.href`. Exact equality means every DETAIL route
// deselects its own section — /studio/blog/<slug> showed Blog unselected, and
// /studio/projects/<slug> had the identical bug for Case studies since long before the
// blog arc. You could be four clicks deep in a case study with nothing in the nav lit.

/**
 * Is `href` the active nav entry for `pathname`?
 *
 * SECTIONS PREFIX-MATCH so their detail routes keep the section selected. `/studio` is
 * EXACT, because it is a prefix of every other studio route and would otherwise light up
 * Homepage everywhere — the reason the naive fix (prefix-match everything) is wrong.
 *
 * The prefix test requires a trailing SLASH, so a future sibling like
 * `/studio/projects-archive` cannot light up `/studio/projects`. Matching on the bare
 * string would make that a silent, much later bug.
 */
export function isStudioAreaActive(href: string, pathname: string): boolean {
  if (href === "/studio") return pathname === "/studio";
  return pathname === href || pathname.startsWith(`${href}/`);
}
