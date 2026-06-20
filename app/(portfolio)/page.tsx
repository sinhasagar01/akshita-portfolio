import { getHomePageData } from "@/lib/keystatic";
import HeroSection from "@/components/sections/HeroSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import AboutSection from "@/components/sections/AboutSection";
import ProcessSection from "@/components/sections/ProcessSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import SkillsSection from "@/components/sections/SkillsSection";
import ContactSection from "@/components/sections/ContactSection";

export default async function HomePage() {
  const { settings, skills, projects, experience } = await getHomePageData();

  return (
    <main className="container-x">
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
