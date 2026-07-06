import type { SiteSettingsEntry } from "@/lib/keystatic";

export type ElsewhereLink = {
  label: string;
  href: string;
  external: boolean;
  glyph: string;
};

// PL-2a — the siteSettings singleton is the single source of truth for the
// site's links. This module holds only the PRESENTATION metadata (label, glyph,
// external, and the display order); every href comes from settings. The header
// and footer both render buildSiteLinks(settings), so the visible links can no
// longer drift from the JSON-LD, which reads the same fields.
type LinkDef = {
  label: string;
  external: boolean;
  glyph: string;
  href: (s: SiteSettingsEntry) => string | null | undefined;
};

// Order is load-bearing — it is the order the footer and mobile socials render.
const LINK_DEFS: LinkDef[] = [
  { label: "LinkedIn", external: true,  glyph: "in", href: (s) => s.linkedinUrl },
  { label: "Behance",  external: true,  glyph: "Bē", href: (s) => s.behanceUrl },
  { label: "Dribbble", external: true,  glyph: "Db", href: (s) => s.dribbbleUrl },
  { label: "Email",    external: false, glyph: "@",  href: (s) => (s.email ? `mailto:${s.email}` : null) },
  { label: "Resume",   external: true,  glyph: "CV", href: (s) => s.resumeUrl },
];

/** The label the header uses to pick out the Resume link (desktop CTA + mobile pill). */
export const RESUME_LABEL = "Resume";

/**
 * Build the visible link list from settings. Any field that is blank or absent
 * is omitted entirely, so a cleared URL drops its link cleanly rather than
 * rendering a broken empty href.
 */
export function buildSiteLinks(settings: SiteSettingsEntry | null): ElsewhereLink[] {
  if (!settings) return [];
  return LINK_DEFS.map((def) => ({
    label: def.label,
    external: def.external,
    glyph: def.glyph,
    href: (def.href(settings) ?? "").trim(),
  })).filter((link) => link.href.length > 0);
}
