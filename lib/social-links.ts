import type { SiteSettingsEntry } from "@/lib/keystatic";

export type ElsewhereLink = {
  label: string;
  href: string;
  external: boolean;
  glyph: string;
};

// Item 10 — the siteSettings `links` ARRAY is the single source of truth for the
// site's links (label + url), replacing the old fixed resume/linkedin/dribbble/
// behance fields. buildSiteLinks maps that array; the SET of links comes entirely
// from settings. This module only supplies PRESENTATION glyphs.
//
// KNOWN_GLYPHS is a presentation-only label→glyph lookup so the recognizable marks
// survive the migration; any other (custom) link falls back to an initials pill
// derived from its label. It is NOT the list of links.
const KNOWN_GLYPHS: Record<string, string> = {
  LinkedIn: "in",
  Behance: "Bē",
  Dribbble: "Db",
  Email: "@",
  Resume: "CV",
};

/** The label the header uses to pick out the Resume link (desktop CTA + mobile
 *  pill). A link labelled "Resume" becomes the CTA; if the owner renames or
 *  removes it, the CTA simply does not render (graceful). */
export const RESUME_LABEL = "Resume";

/** A short glyph for a link with no known mark: the first two characters of a
 *  single-word label, or the initials of the first two words. */
function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

function glyphFor(label: string): string {
  return KNOWN_GLYPHS[label] ?? initials(label);
}

/**
 * Build the visible link list from settings. The `links` array supplies the set
 * and order; each item's url must be non-blank to render (a cleared url drops its
 * link cleanly rather than a broken empty href). The contact `email` is a separate
 * field, appended as a mailto link when set.
 */
export function buildSiteLinks(settings: SiteSettingsEntry | null): ElsewhereLink[] {
  if (!settings) return [];
  const links: ElsewhereLink[] = (settings.links ?? [])
    .map((link) => ({
      label: link.label,
      href: (link.url ?? "").trim(),
      external: /^https?:\/\//i.test((link.url ?? "").trim()),
      glyph: glyphFor(link.label),
    }))
    .filter((link) => link.href.length > 0);

  const email = (settings.email ?? "").trim();
  if (email) {
    links.push({ label: "Email", href: `mailto:${email}`, external: false, glyph: KNOWN_GLYPHS.Email });
  }
  return links;
}
