import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import type { ProjectListItem } from "@/lib/keystatic";

type Props = { project: ProjectListItem };

export default function ProjectCard({ project }: Props) {
  const { slug, title, summary, heroImage, facts } = project;
  const eyebrow = [facts.type, facts.platform].filter(Boolean).join(" · ");

  return (
    <article className="group flex flex-col gap-5 transition-transform duration-[--duration-slow] ease-[--ease-out-expo] hover:-translate-y-1">
      <div className="relative aspect-[16/10] rounded-[--radius-md] overflow-hidden bg-[--color-surface]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 ease-[--ease-out-expo] group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <ImagePlaceholder label="1600 × 1000" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="text-eyebrow tracking-eyebrow uppercase text-[--color-text-muted]">
            {eyebrow}
          </p>
        )}
        <h3 className="font-body font-semibold text-xl text-[--color-text-primary] leading-[--leading-snug]">
          <Link
            href={`/projects/${slug}`}
            className="inline-flex items-center gap-1.5 hover:text-[--color-accent] transition-colors duration-[--duration-base]"
          >
            <span>{title}</span>
            <span
              aria-hidden="true"
              className="inline-block text-[--color-accent] opacity-0 -translate-x-1 transition-all duration-[--duration-base] ease-[--ease-out-expo] group-hover:opacity-100 group-hover:translate-x-0"
            >
              →
            </span>
          </Link>
        </h3>
        {summary && (
          <p className="text-base text-[--color-text-secondary] leading-[--leading-relaxed] max-w-[52ch]">
            {summary}
          </p>
        )}
      </div>
    </article>
  );
}
