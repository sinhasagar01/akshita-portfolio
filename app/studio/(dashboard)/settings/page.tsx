import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import HeroEditPanel from "@/components/studio/HeroEditPanel";
import AboutEditPanel from "@/components/studio/AboutEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { singletonHref } from "@/lib/keystatic-links";
import { IconWorkflow, IconArrowUpRight } from "@/components/studio/icons";

const settingsLink = singletonHref("siteSettings");

export default async function StudioSettings() {
  const { settings, settingsDraftState } = await getStudioData();

  if (!settings) {
    return (
      <>
        <AreaHeader title="Site settings" sub="The global singleton behind the homepage." />
        <StudioEmptyState href={settingsLink}>
          Site settings not yet created. Open it in Keystatic to set it up.
        </StudioEmptyState>
      </>
    );
  }

  const linkSignals: CardSignal[] = [];
  if (!settings.resumeUrl) linkSignals.push({ label: "No resume URL", tone: "warn" });
  if (!settings.linkedinUrl) linkSignals.push({ label: "LinkedIn not set", tone: "muted" });
  if (!settings.dribbbleUrl) linkSignals.push({ label: "Dribbble not set", tone: "muted" });
  if (!settings.behanceUrl) linkSignals.push({ label: "Behance not set", tone: "muted" });

  return (
    <>
      <AreaHeader
        title="Site settings"
        sub="Hero is editable here. The rest open in Keystatic."
      />

      {/* GH-5a: the Hero group is the featured editable card (Surface B). */}
      <HeroEditPanel
        heroCopy={settings.heroCopy}
        tab1Label={settings.tab1Label}
        tab1Line={settings.tab1Line}
        tab2Label={settings.tab2Label}
        tab2Line={settings.tab2Line}
        tab3Label={settings.tab3Label}
        tab3Line={settings.tab3Line}
        tab4Label={settings.tab4Label}
        tab4Line={settings.tab4Line}
        heroRoleLabel={settings.heroRoleLabel}
        heroScrollCue={settings.heroScrollCue}
        photo={settings.photo}
        differs={settingsDraftState.differs}
      />

      {/* About-A: the second inline-editable group (Surface B), Save-draft only. */}
      <AboutEditPanel
        aboutCopy={settings.aboutCopy}
        aboutNote={settings.aboutNote}
        aboutFocusChips={settings.aboutFocusChips}
      />

      <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        <ContentCard
          index="03"
          title="Process copy"
          icon={<IconWorkflow />}
          status="live"
          meta="4 stage copy fields"
          href={settingsLink}
          ariaLabel="Edit Process copy in Keystatic site settings"
        />
        <ContentCard
          index="04"
          title="Links"
          icon={<IconArrowUpRight />}
          status="live"
          meta="Email, resume, socials"
          signals={linkSignals}
          href={settingsLink}
          ariaLabel="Edit links in Keystatic site settings"
        />
      </div>
    </>
  );
}
