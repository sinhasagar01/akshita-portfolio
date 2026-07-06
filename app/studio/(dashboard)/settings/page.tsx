import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import HeroEditPanel from "@/components/studio/HeroEditPanel";
import AboutEditPanel from "@/components/studio/AboutEditPanel";
import LinksEditPanel from "@/components/studio/LinksEditPanel";
import ProcessEditPanel from "@/components/studio/ProcessEditPanel";
import StudioEmptyState from "@/components/studio/StudioEmptyState";
import { PublishProvider } from "@/components/studio/PublishProvider";
import PublishBar from "@/components/studio/PublishBar";
import { singletonHref } from "@/lib/keystatic-links";

const settingsLink = singletonHref("siteSettings");

export default async function StudioSettings() {
  const { settings, draftDiffers } = await getStudioData();

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
        sub="Every homepage group is editable here, then published from the bar below."
      />

      {/* UX-1: the panels are Save-draft only; the page-level PublishBar ships
          every panel's accumulated edits in one singleton-wide merge. The
          provider seeds the singleton differs and tracks any panel's pending
          edits so Publish gates exactly like the old Hero control. */}
      <PublishProvider initialDiffers={draftDiffers}>
        {/* Two-column grid at lg (the site's mobile breakpoint); stacks below.
            items-start so a collapsed card never stretches to an expanded
            neighbour's height. Panels no longer carry their own mt — the grid
            gap owns the spacing. */}
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 lg:items-start">
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
        />

        {/* About-A: the second inline-editable group (Surface B), Save-draft only. */}
        <AboutEditPanel
          aboutCopy={settings.aboutCopy}
          aboutNote={settings.aboutNote}
          aboutFocusChips={settings.aboutFocusChips}
          aboutSubtext={settings.aboutSubtext}
          aboutPhotoCaption={settings.aboutPhotoCaption}
        />

        {/* PL-2a: the Links group is an inline-editable panel (Surface B). It
            sources the same fields the public header/footer and JSON-LD read. */}
        <LinksEditPanel
          resumeUrl={settings.resumeUrl ?? ""}
          email={settings.email}
          linkedinUrl={settings.linkedinUrl ?? ""}
          dribbbleUrl={settings.dribbbleUrl ?? ""}
          behanceUrl={settings.behanceUrl ?? ""}
        />

        {/* PL-2b: the Process group is an inline-editable panel (Surface B),
            four stages each with name, description, and a tags array. */}
        <ProcessEditPanel processStages={settings.processStages} />
        </div>

        {/* Clear the fixed floating Publish bar so the last panel is not hidden. */}
        <div className="h-20" aria-hidden />
        <PublishBar />
      </PublishProvider>
    </>
  );
}
