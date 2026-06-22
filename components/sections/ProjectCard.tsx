"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import type { ProjectListItem } from "@/lib/keystatic";
import { PROJECT_SVGS } from "./ProjectCardSvgs";

type Props = { project: ProjectListItem };

// Expo-out — the same curve on every transition for a cohesive feel
const E = "cubic-bezier(.16,1,.3,1)";

export default function ProjectCard({ project }: Props) {
  const { slug, title, summary, facts } = project;
  const eyebrow = [facts.type, facts.platform].filter(Boolean).join(" · ");
  const svg = PROJECT_SVGS[slug];

  // Default true (reduced) so SSR never renders the spotlight, avoiding hydration mismatch
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const spotRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!spotRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    spotRef.current.style.left = `${e.clientX - r.left}px`;
    spotRef.current.style.top = `${e.clientY - r.top}px`;
  }
  function handleMouseEnter() {
    if (spotRef.current) spotRef.current.style.opacity = "1";
  }
  function handleMouseLeave() {
    if (spotRef.current) spotRef.current.style.opacity = "0";
  }

  return (
    <article className="group cursor-pointer" data-cursor="card">
      <div className="relative">

        {/* Warm radial glow behind the card */}
        <div
          aria-hidden="true"
          className="pc-glow absolute -inset-5 rounded-[22px] opacity-0 pointer-events-none group-hover:opacity-100"
          style={{ transition: "opacity .5s" }}
        />

        {/* Folder surface — lifts the whole card on hover */}
        <div
          className="pc-fold relative border border-[--color-border] rounded-[12px] bg-[--color-surface] p-2 group-hover:-translate-y-[6px]"
          style={{ transition: "transform .45s cubic-bezier(.22,1,.36,1) background: #ede3d5;", background: "#ede3d5" }}
        >

          {/* Case study tab */}
          <div
            className="pc-tab absolute -top-[19px] left-[18px] border border-b-0 border-[--color-border] rounded-t-[8px] bg-[--color-surface] px-[14px] pt-[5px] pb-2 text-[10px] tracking-[0.13em] uppercase text-[--color-text-muted] group-hover:text-[--color-accent]"
            style={{ transition: "color .3s, border-color .3s" }}
          >
            Case study
          </div>

          {/* Image frame — filter + zoom on the frame itself, spotlight inside */}
          <div
            className="pc-shot relative aspect-[16/10] rounded-[7px] overflow-hidden"
            onMouseMove={reducedMotion ? undefined : handleMouseMove}
            onMouseEnter={reducedMotion ? undefined : handleMouseEnter}
            onMouseLeave={reducedMotion ? undefined : handleMouseLeave}
          >

            {svg ?? null}

            {/* Warm multiply tint — mutes image at rest, fades out on hover */}
            <div
              aria-hidden="true"
              className="pc-tint absolute inset-0 pointer-events-none"
            />

            {/* Warm cursor spotlight — follows pointer, fades in/out on enter/leave.
                Not rendered under prefers-reduced-motion. */}
            {!reducedMotion && (
              <div
                ref={spotRef}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  width: 230,
                  height: 230,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255,238,214,.55) 0%, rgba(255,238,214,0) 60%)",
                  left: 0,
                  top: 0,
                  transform: "translate(-50%, -50%)",
                  opacity: 0,
                  transition: `opacity 350ms ${E}`,
                  pointerEvents: "none",
                  zIndex: 4,
                }}
              />
            )}

          </div>
        </div>
      </div>

      {/* Meta */}
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
              className="pc-arr text-[--color-accent] group-hover:translate-x-[6px]"
              style={{ transition: "transform .35s" }}
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
