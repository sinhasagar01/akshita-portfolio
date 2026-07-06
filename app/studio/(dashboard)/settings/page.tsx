import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import HeroEditPanel from "@/components/studio/HeroEditPanel";
import AboutEditPanel from "@/components/studio/AboutEditPanel";
import LinksEditPanel from "@/components/studio/LinksEditPanel";
import ProcessEditPanel from "@/components/studio/ProcessEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { singletonHref } from "@/lib/keystatic-links";

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

  return (
    <>
      <AreaHeader
        title="Site settings"
        sub="Every homepage group is editable here, then published from the Hero panel."
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
        aboutSubtext={settings.aboutSubtext}
        aboutPhotoCaption={settings.aboutPhotoCaption}
      />

      {/* PL-2a: the Links group is now an inline-editable panel (Surface B),
          Save-draft only. It sources the same fields the public header/footer
          and JSON-LD read, so there is one source of truth. */}
      <LinksEditPanel
        resumeUrl={settings.resumeUrl ?? ""}
        email={settings.email}
        linkedinUrl={settings.linkedinUrl ?? ""}
        dribbbleUrl={settings.dribbbleUrl ?? ""}
        behanceUrl={settings.behanceUrl ?? ""}
      />

      {/* PL-2b: the Process group is now an inline-editable panel (Surface B),
          four stages each with name, description, and a tags array. */}
      <ProcessEditPanel processStages={settings.processStages} />
    </>
  );
}
