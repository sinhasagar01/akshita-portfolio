import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import { singletonHref } from "@/lib/keystatic-links";
import {
  IconUser,
  IconSparkles,
  IconWorkflow,
  IconArrowUpRight,
} from "@/components/studio/icons";

const settingsLink = singletonHref("siteSettings");

export default async function StudioSettings() {
  const { settings } = await getStudioData();

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

  const identitySignals: CardSignal[] = settings.photo
    ? []
    : [{ label: "No photo", tone: "warn" }];

  const linkSignals: CardSignal[] = [];
  if (!settings.resumeUrl) linkSignals.push({ label: "No resume URL", tone: "warn" });
  if (!settings.linkedinUrl) linkSignals.push({ label: "LinkedIn not set", tone: "muted" });
  if (!settings.dribbbleUrl) linkSignals.push({ label: "Dribbble not set", tone: "muted" });
  if (!settings.behanceUrl) linkSignals.push({ label: "Behance not set", tone: "muted" });

  return (
    <>
      <AreaHeader
        title="Site settings"
        sub="One singleton. Every card opens the same editor."
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        <ContentCard
          index="01"
          title="Identity"
          icon={<IconSparkles />}
          status="live"
          meta="Hero copy, positioning, photo"
          signals={identitySignals}
          href={settingsLink}
          ariaLabel="Edit identity fields in Keystatic site settings"
        />
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
