"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { motion, LayoutGroup, useReducedMotion } from "motion/react";

const NAV = [
  { id: "work",    label: "Work" },
  { id: "about",   label: "About" },
  { id: "contact", label: "Contact" },
] as const;

type SectionId = (typeof NAV)[number]["id"];

function useHeaderState() {
  const [scrolled, setScrolled]   = useState(false);
  const [active, setActive]       = useState<SectionId | null>(null);
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    const HEADER_H = 72;

    const hero = document.getElementById("hero");
    const heroObs = hero
      ? new IntersectionObserver(([e]) => setHeroInView(e.isIntersecting), {
          threshold: 0.1,
        })
      : null;
    heroObs?.observe(hero!);

    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 18);

      let current: SectionId | null = null;
      for (const { id } of NAV) {
        const el = document.getElementById(id);
        if (!el) continue;
        const docTop = el.getBoundingClientRect().top + y;
        if (y + HEADER_H >= docTop) current = id;
      }
      setActive(current);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      heroObs?.disconnect();
    };
  }, []);

  return { scrolled, active, heroInView };
}

export default function SiteHeader() {
  const reduced                          = useReducedMotion();
  const lenis                            = useLenis();
  const { scrolled, active, heroInView } = useHeaderState();

  const showMarker  = !heroInView && active !== null;
  const markerTrans = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 30 };

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
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
    <header
      className="site-header sticky z-30"
      style={{ top: scrolled ? "15px" : "0" }}
    >
      <div className="container-x">
        <div className={`site-header-bar${scrolled ? " scrolled" : ""}`}>

          <Link
            href="/"
            className="font-display italic text-xl text-[--color-text-primary] hover:text-[--color-accent] transition-colors duration-[--duration-base]"
          >
            Akshita
          </Link>

          <LayoutGroup id="site-header">
            <nav className="relative inline-flex gap-1" aria-label="Site sections">
              {NAV.map(({ id, label }) => {
                const isActive = active === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => handleNavClick(e, id)}
                    aria-current={isActive ? "true" : undefined}
                    className={[
                      "relative px-3.5 py-1.5 text-sm rounded-full select-none transition-colors duration-[--duration-base]",
                      isActive
                        ? "text-[--color-accent-500] font-medium"
                        : "text-[--color-text-secondary] nav-link",
                    ].join(" ")}
                  >
                    {showMarker && isActive && (
                      <motion.span
                        layoutId="nav-marker"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full"
                        style={{
                          backgroundColor: "oklch(56% 0.14 42 / 0.12)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                          border: "1px solid oklch(56% 0.14 42 / 0.34)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                        }}
                        transition={markerTrans}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </a>
                );
              })}
            </nav>
          </LayoutGroup>

        </div>
      </div>
    </header>
  );
}
