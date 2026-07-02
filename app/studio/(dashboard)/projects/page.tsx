import { getStudioData } from "@/lib/studio/data";
import AreaHeader from "@/components/studio/AreaHeader";
import ContentCard, { type CardSignal } from "@/components/studio/ContentCard";
import { collectionItemHref, collectionListHref } from "@/lib/keystatic-links";
import { IconGrid } from "@/components/studio/icons";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function StudioProjects() {
  const { projects } = await getStudioData();

  return (
    <>
      <AreaHeader
        title="Projects"
        sub="Case studies, sorted by order. Each opens its own editor."
      />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
          {projects.map((p, i) => {
            const factsValues = [
              p.facts.role,
              p.facts.type,
              p.facts.platform,
              p.facts.timeline,
            ];
            const factsSet = factsValues.filter((v) => v.trim()).length;

            const signals: CardSignal[] = [];
            if (!p.heroImage) signals.push({ label: "No hero image", tone: "warn" });
            if (!p.summary.trim()) signals.push({ label: "No summary", tone: "warn" });
            if (factsValues.some((v) => !v.trim()))
              signals.push({ label: "Incomplete facts", tone: "warn" });

            const meta = `order ${p.orderIndex}, ${
              p.heroImage ? "hero set" : "no hero"
            }, ${factsSet} facts`;

            return (
              <ContentCard
                key={p.slug}
                index={pad(i + 1)}
                title={p.title}
                icon={<IconGrid />}
                status="live"
                meta={meta}
                signals={signals}
                href={collectionItemHref("projects", p.slug)}
                ariaLabel={`Edit ${p.title} in Keystatic`}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <a
      href={collectionListHref("projects")}
      className="block max-w-sm rounded-lg border border-ink-950/8 bg-cream-50 p-5 text-[13px] text-ink-600 hover:border-accent-500/40"
    >
      No projects yet. Open the Projects collection in Keystatic to add one.
    </a>
  );
}
