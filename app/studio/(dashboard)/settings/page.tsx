import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import HeroEditPanel from "@/components/studio/HeroEditPanel";
import AboutEditPanel from "@/components/studio/AboutEditPanel";
import LinksEditPanel from "@/components/studio/LinksEditPanel";
import ProcessEditPanel from "@/components/studio/ProcessEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { ListDetailLayout } from "@/components/studio/ListDetailLayout";
import { singletonHref } from "@/lib/keystatic-links";

const settingsLink = singletonHref("siteSettings");

export default async function StudioSettings() {
  const { settings } = await getStudioData();

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
        sub="Every homepage group is editable here, then published from the Publish bar."
      />

      {/* UX-1: the panels are Save-draft only; the layout-level PublishBar ships
          every panel's accumulated edits in one singleton-wide merge. The
          list+detail shell puts a fixed section list on the left and one edit
          pane on the right — every panel stays MOUNTED (returns null when
          unselected) so unsaved drafts survive switching sections. */}
      <ListDetailLayout
        sections={[
          { id: "hero", name: "Hero" },
          { id: "about", name: "About" },
          { id: "links", name: "Links" },
          { id: "process", name: "Process" },
        ]}
      >
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
          photo={settings.photo}
        />

        {/* About-A: the second inline-editable group (Surface B), Save-draft only. */}
        <AboutEditPanel
          itemId="about"
          aboutCopy={settings.aboutCopy}
          aboutNote={settings.aboutNote}
          aboutFocusChips={settings.aboutFocusChips}
          aboutSubtext={settings.aboutSubtext}
          aboutPhotoCaption={settings.aboutPhotoCaption}
        />

        {/* PL-2a: the Links group is an inline-editable panel (Surface B). It
            sources the same fields the public header/footer and JSON-LD read. */}
        <LinksEditPanel
          itemId="links"
          resumeUrl={settings.resumeUrl ?? ""}
          email={settings.email}
          linkedinUrl={settings.linkedinUrl ?? ""}
          dribbbleUrl={settings.dribbbleUrl ?? ""}
          behanceUrl={settings.behanceUrl ?? ""}
        />

        {/* PL-2b: the Process group is an inline-editable panel (Surface B),
            four stages each with name, description, and a tags array. */}
        <ProcessEditPanel itemId="process" processStages={settings.processStages} />
      </ListDetailLayout>
    </>
  );
}
