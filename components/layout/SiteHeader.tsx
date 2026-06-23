"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { motion, LayoutGroup, useReducedMotion } from "motion/react";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";
import { ELSEWHERE, RESUME_LINK } from "@/lib/social-links";

const NAV = [
  { id: "process", label: "Process" },
  { id: "work",    label: "Work"    },
  { id: "about",   label: "About"   },
  { id: "contact", label: "Contact" },
] as const;

type SectionId = (typeof NAV)[number]["id"];

// scroll-mt-20 (80px) on every section, header is 72px tall:
// offset = scrollMargin − HEADER_H = 80 − 72 = 8
const HEADER_H = 72;
const SCROLL_TO_OFFSET = 8;

function getActiveSection(): SectionId | null {
  let current: SectionId | null = null;
  for (const { id } of NAV) {
    const el = document.getElementById(id);
    if (!el) continue;
    // +2 tolerance for subpixel rounding at lerp animation end
    if (el.getBoundingClientRect().top <= HEADER_H + 2) current = id;
  }
  return current;
}

export default function SiteHeader() {
  const reduced                        = useReducedMotion();
  const [scrolled, setScrolled]        = useState(false);
  const [active, setActive]            = useState<SectionId | null>(null);
  const [heroInView, setHeroInView]    = useState(true);
  const [menuOpen, setMenuOpen]        = useState(false);
  const smoothScroll                   = useSmoothScroll();
  const pathname                       = usePathname();
  const burgerRef                      = useRef<HTMLButtonElement>(null);
  const menuRef                        = useRef<HTMLDivElement>(null);

  // Hero visibility observer
  useEffect(() => {
    const hero = document.getElementById("hero");
    const heroObs = hero
      ? new IntersectionObserver(([e]) => setHeroInView(e.isIntersecting), {
          threshold: 0.1,
        })
      : null;
    heroObs?.observe(hero!);
    return () => heroObs?.disconnect();
  }, []);

  // Native scroll fallback (reduced motion / no Lenis)
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 18);
      if (smoothScroll?.isProgrammaticRef.current) return;
      setActive(getActiveSection());
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [smoothScroll]);

  // Lenis scroll — fires every animation frame for accurate smooth-scroll tracking
  const lenisScrollCallback = useCallback(() => {
    setScrolled(window.scrollY > 18);
    if (smoothScroll?.isProgrammaticRef.current) return;
    setActive(getActiveSection());
  }, [smoothScroll]);

  const lenis = useLenis(lenisScrollCallback, [smoothScroll]);

  // Menu open/close helpers — lenis ref is stable after first mount
  function openMenu() {
    setMenuOpen(true);
    lenis?.stop();
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    setMenuOpen(false);
    lenis?.start();
    document.body.style.overflow = "";
    burgerRef.current?.focus();
  }

  // Mobile nav tap: unlock first, scroll on next frame, no focus return to burger
  function handleMobileNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: SectionId) {
    e.preventDefault();
    setActive(id);
    const el = document.getElementById(id);
    setMenuOpen(false);
    lenis?.start();
    document.body.style.overflow = "";
    if (!el) return;
    requestAnimationFrame(() => {
      if (smoothScroll) {
        smoothScroll.scrollToTarget(el, { offset: SCROLL_TO_OFFSET });
      } else if (lenis) {
        lenis.scrollTo(el, { offset: SCROLL_TO_OFFSET });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  function toggleMenu() {
    if (menuOpen) closeMenu();
    else openMenu();
  }

  // Focus trap + Escape handler while menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const el = menuRef.current;
    if (!el) return;
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')
    );
    focusable[0]?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { closeMenu(); return; }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  const showMarker  = !heroInView && active !== null;
  const markerTrans = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 30 };

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: SectionId) {
    e.preventDefault();
    setActive(id); // instant highlight before scroll arrives
    const el = document.getElementById(id);
    if (!el) return;
    if (smoothScroll) {
      smoothScroll.scrollToTarget(el, { offset: SCROLL_TO_OFFSET });
    } else if (lenis) {
      lenis.scrollTo(el, { offset: SCROLL_TO_OFFSET });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header
      className="site-header sticky z-42"
      style={{ top: scrolled ? "15px" : "0" }}
    >
      <div className="container-x">
        <div className={`site-header-bar${scrolled ? " scrolled" : ""}`}>

          <Link
            href="/"
            aria-label="Akshita Singh, home"
            className="logo-link"
            onClick={(e) => {
              if (pathname !== "/") return;
              e.preventDefault();
              if (smoothScroll) {
                smoothScroll.scrollToTarget(0);
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <span className="logo-sigwrap">
              <svg className="logo-grid" width="148" height="48" aria-hidden="true" focusable="false">
                <line x1="0" y1="10" x2="148" y2="10" />
                <line x1="0" y1="38" x2="148" y2="38" />
                <line x1="14" y1="0" x2="14" y2="48" />
                <line x1="70" y1="0" x2="70" y2="48" />
                <line x1="130" y1="0" x2="130" y2="48" />
                <circle cx="14" cy="10" r="2.4" />
                <circle cx="130" cy="38" r="2.4" />
              </svg>
              <span className="logo-sig">Akshita</span>
            </span>
            <span className="logo-vbar" aria-hidden="true" />
            <span className="logo-singh">SINGH</span>
          </Link>

          {/* Desktop right: nav + divider + Resume CTA — visibility via CSS, not Tailwind */}
          <div className="header-desktop-right">
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

            <span className="header-vdiv" aria-hidden="true" />

            <a
              className="header-resume-cta"
              href={RESUME_LINK.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Resume (opens in a new tab)"
            >
              <span className="header-resume-u">Resume</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          {/* Burger button — visibility via CSS, not Tailwind */}
          <button
            ref={burgerRef}
            className={`header-burger${menuOpen ? " open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={toggleMenu}
          >
            <span className="header-burger-bar" />
            <span className="header-burger-bar" />
            <span className="header-burger-bar" />
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          </button>

        </div>
      </div>

      {/* Mobile menu — fixed overlay, circle reveal from burger corner */}
      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`header-mobile-menu${menuOpen ? " open" : ""}`}
      >
        <nav aria-label="Mobile site navigation" className="flex flex-col mt-auto">
          {NAV.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="header-mob-nav-item"
              onClick={(e) => handleMobileNavClick(e, id)}
            >
              {label}
            </a>
          ))}
        </nav>

        <a
          href={RESUME_LINK.href}
          target="_blank"
          rel="noopener noreferrer"
          className="header-mob-resume-pill"
          onClick={closeMenu}
        >
          Resume ↗
        </a>

        <div className="header-mob-socials">
          {ELSEWHERE.map(({ label, href, external, glyph }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="header-mob-soc-chip"
              aria-label={label}
              onClick={closeMenu}
            >
              {glyph}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
