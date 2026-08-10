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

  return (
    <>
      <JsonLd data={personSchema(settings)} />
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
