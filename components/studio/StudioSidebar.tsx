"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconGrid,
  IconBriefcase,
  IconLayers,
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
    { href: "/studio/skills", label: "Skills", Icon: IconLayers },
  ];

  const settings: Area = { href: "/studio/settings", label: "Site settings", Icon: IconSliders };

  function renderLink(area: Area, pinned = false) {
    const active = pathname === area.href;
    return (
      <Link
        key={area.href}
        href={area.href}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] transition-colors",
          active
            ? "bg-cream-50 font-medium text-ink-950 shadow-sm"
            : "text-ink-600 hover:bg-cream-50/70 hover:text-ink-950",
        ].join(" ")}
      >
        <area.Icon className={`size-4 ${active ? "text-accent-500" : "text-ink-400"}`} />
        <span>{area.label}</span>
        {area.count != null && (
          <span className="ml-auto text-[11px] text-ink-400">{area.count}</span>
        )}
      </Link>
    );
  }

  return (
    <aside className="flex flex-col border-b border-ink-950/8 bg-cream-100 p-3 lg:w-[200px] lg:flex-none lg:border-b-0 lg:border-r lg:p-4">
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
