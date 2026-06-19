import Link from "next/link";
import type { ProjectListItem } from "@/lib/keystatic";
import { PROJECT_SVGS } from "./ProjectCardSvgs";

type Props = { project: ProjectListItem };

export default function ProjectCard({ project }: Props) {
  const { slug, title, summary, facts } = project;
  const eyebrow = [facts.type, facts.platform].filter(Boolean).join(" · ");
  const svg = PROJECT_SVGS[slug];

  return (
    <article className="group cursor-pointer">
      {/* Folder wrapper — glow + fold sit here */}
      <div className="relative">
        {/* Warm radial glow, fades up on hover */}
        <div
          aria-hidden="true"
          className="pc-glow absolute -inset-5 rounded-[22px] opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100"
        />

        {/* Folder surface */}
        <div className="pc-fold relative border border-[--color-border] rounded-[12px] bg-[--color-surface] p-2 transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-[6px]">

          {/* Case study tab — sits above the fold top edge */}
          <div className="pc-tab absolute -top-[19px] left-[18px] border border-b-0 border-[--color-border] rounded-t-[8px] bg-[--color-surface] px-[14px] pt-[5px] pb-2 text-[10px] tracking-[0.13em] uppercase text-[--color-text-muted] transition-colors duration-300 group-hover:text-[--color-accent]">
            Case study
          </div>

          {/* Image frame — fixed aspect ratio, muted filter at rest */}
          <div className="pc-shot relative aspect-[16/10] rounded-[7px] overflow-hidden [filter:saturate(.45)_brightness(1.04)] transition-[filter,transform] duration-[550ms] ease-out group-hover:[filter:none] group-hover:scale-[1.04]">
            {svg ?? null}
            {/* Warm tint — multiply blend fades out on hover */}
            <div
              aria-hidden="true"
              className="pc-tint absolute inset-0 opacity-[.34] transition-opacity duration-[550ms] group-hover:opacity-0 pointer-events-none"
              style={{ background: "#E7C7AE", mixBlendMode: "multiply" }}
            />
          </div>
        </div>
      </div>

      {/* Meta — eyebrow, title with arrow, description */}
      <div className="mt-[18px]">
        {eyebrow && (
          <p className="text-[11px] tracking-[0.12em] uppercase text-[--color-text-muted] max-w-none">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-[7px] mb-[8px] font-body font-semibold text-[21px] text-[--color-text-primary] leading-tight">
          <Link
            href={`/projects/${slug}`}
            className="inline-flex items-center gap-[9px] no-underline"
          >
            <span>{title}</span>
            <span
              aria-hidden="true"
              className="pc-arr text-[--color-accent] transition-transform duration-[350ms] group-hover:translate-x-[6px]"
            >
              &#8594;
            </span>
          </Link>
        </h3>
        {summary && (
          <p
            className="text-[13.5px] leading-[1.5] text-[--color-text-secondary]"
            style={{ maxWidth: "340px" }}
          >
            {summary}
          </p>
        )}
      </div>
    </article>
  );
}
