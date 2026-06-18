import Grid from "@/components/layout/Grid";
import SectionLabel from "@/components/ui/SectionLabel";
import type { ExperienceListItem } from "@/lib/keystatic";

type Props = { entry: ExperienceListItem };

export default function ExperienceEntry({ entry }: Props) {
  const { company, title, startDate, endDate, description } = entry;
  const lines = description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <Grid cols={12} className="py-8 md:py-10">
      <div className="col-span-4 md:col-span-3">
        <p className="text-sm text-[--color-text-muted] leading-[--leading-normal] mt-1">
          {startDate} - {endDate}
        </p>
      </div>
      <div className="col-span-4 md:col-span-9 flex flex-col gap-3">
        <SectionLabel>{company}</SectionLabel>
        <h3 className="font-body font-semibold text-lg text-[--color-text-primary] leading-[--leading-snug]">
          {title}
        </h3>
        {lines.map((line, i) => (
          <p
            key={i}
            className="text-base text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[60ch]"
          >
            {line}
          </p>
        ))}
      </div>
    </Grid>
  );
}
