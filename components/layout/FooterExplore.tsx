"use client";

import { useLenis } from "lenis/react";

const LINKS = [
  { id: "process",    label: "Process" },
  { id: "work",       label: "Work" },
  { id: "about",      label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills",     label: "Skills" },
  { id: "contact",    label: "Contact" },
] as const;

export default function FooterExplore() {
  const lenis = useLenis();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -72 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div>
      <h4 className="text-[11px] tracking-[.16em] uppercase text-[--color-accent-500] font-semibold mb-3">
        Explore
      </h4>
      {LINKS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(e) => handleClick(e, id)}
          className="block text-[14px] text-[--color-ink-800] hover:text-[--color-accent-500] no-underline transition-colors duration-[--duration-base] mb-[9px]"
        >
          {label}
        </a>
      ))}
    </div>
  );
}
