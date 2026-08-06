import { getStudioData } from "@/lib/studio/data";
import ThemeEditPanel from "@/components/studio/ThemeEditPanel";
import HeroEditPanel from "@/components/studio/HeroEditPanel";
import AboutEditPanel from "@/components/studio/AboutEditPanel";
import LinksEditPanel from "@/components/studio/LinksEditPanel";
import ProcessEditPanel from "@/components/studio/ProcessEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { ListDetailLayout } from "@/components/studio/ListDetailLayout";
import { STUDIO_SETTINGS_SECTIONS } from "@/lib/studio/settings-sections";

export default async function StudioSettings() {
  const { settings } = await getStudioData();

  if (!settings) {
    return (
      <div className="p-4 lg:p-6">
        <StudioEmptyState>Site settings have not been created yet.</StudioEmptyState>
      </div>
    );
  }

  return (
    <>
      {/* NO PAGE WRAPPER AND NO PAGE HEADER — see the experience route for the reasoning: a
          full-height shell has nowhere padded to put an `h1`, and the area name is already in
          the sidebar's active nav item while the detail bar names the group being edited.

          UX-1: the panels are Save-draft only; the layout-level PublishBar ships
          every panel's accumulated edits in one singleton-wide merge. The
          list+detail shell puts a fixed section list on the left and one edit
          pane on the right — every panel stays MOUNTED (returns null when
          unselected) so unsaved drafts survive switching sections. */}
      <ListDetailLayout sections={STUDIO_SETTINGS_SECTIONS} searchPlaceholder="Search settings">
        {/* The palette. First because it changes how every panel below it renders. */}
        <ThemeEditPanel itemId="theme" theme={settings.theme} />

        {/* GH-5a: the Hero group is the featured editable card (Surface B). */}
        <HeroEditPanel
          itemId="hero"
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
        />

        {/* About-A: the second inline-editable group (Surface B), Save-draft only.
            Carries the site photo, since it renders on the About section. */}
        <AboutEditPanel
          itemId="about"
          aboutCopy={settings.aboutCopy}
          aboutNote={settings.aboutNote}
          aboutFocusChips={settings.aboutFocusChips}
          aboutSubtext={settings.aboutSubtext}
          aboutPhotoCaption={settings.aboutPhotoCaption}
          photo={settings.photo}
        />

        {/* PL-2a: the Links group is an inline-editable panel (Surface B). It
            sources the same fields the public header/footer and JSON-LD read. */}
        <LinksEditPanel itemId="links" email={settings.email} links={settings.links} />

        {/* PL-2b: the Process group is an inline-editable panel (Surface B),
            four stages each with name, description, and a tags array. */}
        <ProcessEditPanel itemId="process" processStages={settings.processStages} />
      </ListDetailLayout>
    </>
  );
}
