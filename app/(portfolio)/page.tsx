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
    <main className="container-x">
      <JsonLd data={personSchema(settings)} />
      <JsonLd data={webSiteSchema()} />
      <HeroSection />
      <ProcessSection settings={settings} />
      <ProjectsSection projects={projects} />
      <AboutSection settings={settings} />
      <ExperienceSection experience={experience} />
      <SkillsSection skills={skills} />
      <ContactSection settings={settings} />
    </main>
  );
}
