import type { Metadata } from "next";
import { getHomePageData } from "@/lib/keystatic";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { personSchema, webSiteSchema } from "@/lib/structured-data";
import JsonLd from "@/components/seo/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import AboutSection from "@/components/sections/AboutSection";
import ProcessSection from "@/components/sections/ProcessSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ContactSection from "@/components/sections/ContactSection";
import HomePaletteTeaser from "@/components/palettes/HomePaletteTeaser";
import { THEME_GROUND } from "@/lib/theme";
import { TEASER_THEMES } from "@/lib/palettes/teaser";
import { paletteCompatibility } from "@/lib/palettes/compatibility";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    url: SITE_URL,
    images: [
      {
        url: absoluteUrl("/opengraph-image.png"),
        width: 1200,
        height: 630,
        alt: "Akshita Singh, Product Designer",
      },
    ],
  },
  twitter: { images: [absoluteUrl("/twitter-image.png")] },
};

export default async function HomePage() {
  const { settings, skills, projects, experience } = await getHomePageData();

  /* ⚠ THE SWATCH COLOURS COME FROM THE SAME GENERATOR THE `/palettes` CONSOLE READS, resolved to
     literals at build. A dot DEPICTS a palette, so its colour must not follow the page's current
     one — and taking it from `paletteCompatibility()` means the homepage and the console cannot
     disagree about what harbour looks like. The ground token differs by class: a dark palette's
     page ground is `band-dark`, not `canvas`, which is the distinction `GROUND_TOKEN` exists for. */
  const byName = new Map(paletteCompatibility().map((p) => [p.name, p]));
  const swatches = TEASER_THEMES.map((name) => {
    const p = byName.get(name);
    const isDark = THEME_GROUND[name] === "dark";
    return {
      name,
      isDark,
      ground: p?.tokens[isDark ? "band-dark" : "canvas"] ?? "",
      accent: p?.tokens["accent-500"] ?? "",
    };
  });

  return (
    <>
      <JsonLd data={personSchema(settings)} />
      {/* ⚠ HOMEPAGE ONLY, AND DELIBERATELY NOT IN THE LAYOUT. The DOTS are a homepage control; the
          INDICATOR and its exit are already global, mounted once in `app/(portfolio)/layout.tsx`.
          That split is the point of premise 4 — a preview that survives navigation while its
          control vanishes is a control that appears to break, and the escape hatch is the half that
          must follow the visitor. Putting the dots in the layout would put a homepage affordance on
          every case study and the blog. */}
      <HomePaletteTeaser
        swatches={swatches}
      />
      <JsonLd data={webSiteSchema()} />
      {/* Hero as ground — a full-bleed page header, a sibling of <main> (not inside the
          padded container), so the nav is no longer crushed against a card corner. */}
      <HeroSection
        heroCopy={settings?.heroCopy}
        /* The hero's four tabs come from one array now, not eight flat keys. `line` keeps its
           name at this boundary because HeroSection's prop is unchanged — the field it reads is
           `headline`, and renaming the prop is the layout PR's business rather than the schema's. */
        tabs={(settings?.heroTabs ?? []).map((t) => ({
          label: t.label, line: t.headline, support: t.support,
          callouts: t.callouts, stats: t.stats,
        }))}
        roleLabel={settings?.heroRoleLabel}
        scrollCue={settings?.heroScrollCue}
        figure={settings?.heroFigure ?? null}
      />
      <main id="main-content" tabIndex={-1} className="container-x outline-none">
      <ProcessSection settings={settings} />
      <ProjectsSection projects={projects} />
      <AboutSection settings={settings} />
      <ExperienceSection experience={experience} />
      <SkillsSection skills={skills} />
      <ContactSection settings={settings} />
      </main>
    </>
  );
}
