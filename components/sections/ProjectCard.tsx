import Image from "next/image";
import Link from "next/link";
import type { ProjectListItem } from "@/lib/keystatic";

type Props = { project: ProjectListItem };

export default function ProjectCard({ project }: Props) {
  const { slug, title, summary, heroImage, facts } = project;
  const eyebrow = [facts.type, facts.platform].filter(Boolean).join(" · ");

  return (
    <article className="group flex flex-col gap-4">
      <div className="relative aspect-[16/10] rounded-[--radius-md] overflow-hidden bg-[--color-surface] transition-transform duration-[--duration-slow] ease-[--ease-out-expo] group-hover:scale-[1.01]">
        {heroImage && (
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="text-xs tracking-[--tracking-widest] uppercase text-[--color-text-muted]">
            {eyebrow}
          </p>
        )}
        <h3 className="font-body font-semibold text-xl text-[--color-text-primary] leading-[--leading-snug]">
          <Link
            href={`/work/${slug}`}
            className="hover:text-[--color-accent] transition-colors"
          >
            {title}
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
