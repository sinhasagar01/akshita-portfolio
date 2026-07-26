"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isStudioAreaActive } from "@/lib/studio/nav-active";
import {
  IconHome,
  IconGrid,
  IconBriefcase,
  IconLayers,
  IconFileText,
  IconSliders,
  IconSparkles,
  IconLogout,
} from "./icons";
import { useStudioCounts } from "./StudioCountsProvider";

type Area = {
  href: string;
  label: string;
  Icon: typeof IconHome;
  count?: number;
};

export default function StudioSidebar() {
  const pathname = usePathname();
  // Live counts from the shared store (seeded from server data in the layout,
  // kept in sync by each list editor's optimistic add/remove).
  const { counts } = useStudioCounts();

  const areas: Area[] = [
    { href: "/studio", label: "Homepage", Icon: IconHome },
    { href: "/studio/projects", label: "Case studies", Icon: IconGrid, count: counts.projects },
    { href: "/studio/experience", label: "Experience", Icon: IconBriefcase, count: counts.experience },
    { href: "/studio/blog", label: "Blog", Icon: IconFileText, count: counts.blog },
    { href: "/studio/skills", label: "Skills", Icon: IconLayers },
  ];

  const settings: Area = { href: "/studio/settings", label: "Site settings", Icon: IconSliders };

  function renderLink(area: Area, pinned = false) {
    const active = isStudioAreaActive(area.href, pathname);
    return (
      <Link
        key={area.href}
        href={area.href}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] transition-colors",
          active
            ? "bg-ink-950 font-medium text-cream-50"
            : "text-ink-600 hover:bg-cream-50/70 hover:text-ink-950",
        ].join(" ")}
      >
        <area.Icon className={`size-4 ${active ? "text-cream-50" : "text-ink-400"}`} />
        {/* The label carries its OWN colour rather than inheriting the anchor's. It used
            to be a bare <span>, and in the selected pill it computed to ink-950 on an
            ink-950 background — invisible. The icon beside it was fine precisely because
            it already had its own class, which is the tell. Every child of this pill now
            states its colour explicitly, so none of them depends on the anchor's. */}
        <span className={active ? "text-cream-50" : undefined}>{area.label}</span>
        {area.count != null && (
          // The count carried a HARDCODED text-ink-400 that the active branch did not
          // override, so in the selected ink pill it sat at ink-400 on ink-950 while the
          // label beside it was cream-50 — the one element in the pill the active state
          // did not reach. The label was never the problem; it has no class of its own and
          // inherits cream-50 correctly.
          <span className={`ml-auto text-[11px] ${active ? "text-cream-50/70" : "text-ink-400"}`}>
            {area.count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="flex flex-col border-b border-ink-950/8 bg-cream-100 p-3 lg:sticky lg:top-0 lg:h-screen lg:w-[236px] lg:flex-none lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
      <div className="flex items-center gap-2.5 px-1.5 pb-3 lg:pb-4">
        <span className="grid size-6 place-items-center rounded-md bg-accent-500 text-cream-50">
          <IconSparkles className="size-3.5" />
        </span>
        <span className="font-display text-base text-ink-950">Studio</span>
      </div>

      <span className="hidden px-2 pb-1 text-[10px] uppercase tracking-eyebrow text-ink-400 lg:block">
        Content
      </span>

      <nav className="flex flex-1 flex-row gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {areas.map((area) => renderLink(area))}
        <div className="lg:mt-auto lg:border-t lg:border-ink-950/8 lg:pt-2.5">
          {renderLink(settings, true)}
          <form action="/api/studio/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] text-ink-600 transition-colors hover:bg-cream-50/70 hover:text-ink-950"
            >
              <IconLogout className="size-4 text-ink-400" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </nav>
    </aside>
  );
}
