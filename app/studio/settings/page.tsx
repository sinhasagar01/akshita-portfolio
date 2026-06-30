import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import HeroEditPanel from "@/components/studio/HeroEditPanel";
import { singletonHref } from "@/lib/keystatic-links";
import { IconUser, IconWorkflow, IconArrowUpRight } from "@/components/studio/icons";

const settingsLink = singletonHref("siteSettings");

export default async function StudioSettings() {
  const { settings, settingsDraftState } = await getStudioData();

  if (!settings) {
    return (
      <>
        <AreaHeader title="Site settings" sub="The global singleton behind the homepage." />
        <a
          href={settingsLink}
          className="block max-w-sm rounded-lg border border-ink-950/8 bg-cream-50 p-5 text-[13px] text-ink-600 hover:border-accent-500/40"
        >
          Site settings not yet created. Open it in Keystatic to set it up.
        </a>
      </>
    );
  }

  const chips = settings.aboutFocusChips?.length ?? 0;

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
        positioningLine={settings.positioningLine}
        photo={settings.photo}
        differs={settingsDraftState.differs}
      />

      <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        <ContentCard
          index="02"
          title="About"
          icon={<IconUser />}
          status="live"
          meta={`Copy, note, ${chips} focus ${chips === 1 ? "chip" : "chips"}`}
          href={settingsLink}
          ariaLabel="Edit About fields in Keystatic site settings"
        />
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
