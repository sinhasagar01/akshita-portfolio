"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";
import { RESUME_LABEL, type ElsewhereLink } from "@/lib/social-links";

// MOST ENTRIES ARE SECTIONS ON THE HOME PAGE, ONE IS A ROUTE, and the difference is
// load-bearing rather than cosmetic. A section entry renders `#id`, is preventDefault'd and
// smooth-scrolled, and participates in the scroll-spy that lights the active link. A route
// entry must do none of those: there is no element to scroll to, so the old shape would
// have produced `/#blog` — an anchor to a section that does not exist — and a click handler
// that cancels the navigation and then scrolls nowhere.
//
// `href` is the discriminator. STATE recorded the blog nav link as "one line, the launch
// switch"; it is not, because this nav was built for anchors only, and nobody had tried it.
const NAV = [
  { id: "process", label: "Process" },
  { id: "work",    label: "Work"    },
  { id: "about",   label: "About"   },
  { id: "blog",    label: "Blog", href: "/blog" },
  { id: "contact", label: "Contact" },
] as const;

type NavItem = (typeof NAV)[number];
/** The ids that are real sections — a route entry has no element and must never reach the
 *  scroll-spy or the scroll handlers. */
type SectionId = Exclude<NavItem, { href: string }>["id"];

const isRoute = (item: NavItem): item is Extract<NavItem, { href: string }> => "href" in item;

/** Where a nav entry points. A route goes to its href; a section goes to its anchor, which
 *  needs the `/` prefix when we are not on the home page. */
const navHref = (item: NavItem, isHome: boolean) =>
  isRoute(item) ? item.href : isHome ? `#${item.id}` : `/#${item.id}`;

// scroll-mt-20 (80px) on every section, header is 72px tall:
// offset = scrollMargin − HEADER_H = 80 − 72 = 8
const HEADER_H = 72;
const SCROLL_TO_OFFSET = 8;
const THRESH = 8; // jitter guard so a trackpad wobble never flaps the bar
// The pill floats at --nav-top (18px) and is ~70px tall, so its bottom sits ~88px down.
// The nav tone is dark while a dark hero's bottom edge is still below that line; once the
// hero has scrolled up past it, the nav is over the cards and returns to light.
const NAV_TONE_SWITCH = 88;

function getActiveSection(): SectionId | null {
  let current: SectionId | null = null;
  for (const item of NAV) {
    // A route entry has no section on this page. Skipping it keeps the spy from querying a
    // dead id on every scroll frame.
    if (isRoute(item)) continue;
    const el = document.getElementById(item.id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= HEADER_H + 2) current = item.id;
  }
  return current;
}

export default function SiteHeader({ links }: { links: ElsewhereLink[] }) {
  const resume                      = links.find((l) => l.label === RESUME_LABEL) ?? null;
  const reduced                     = useReducedMotion();
  const [scrolled, setScrolled]     = useState(false);
  const [active, setActive]         = useState<SectionId | null>(null);
  const [, setHeroInView]           = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false); // mobile clip-path menu (the blob)
  const [navHidden, setNavHidden]   = useState(false); // scroll-down hides the row
  const [sheetOpen, setSheetOpen]   = useState(false); // desktop scrolled glass sheet
  const [onDark, setOnDark]         = useState(false); // pill over a dark case-study hero
  const smoothScroll                = useSmoothScroll();
  const pathname                    = usePathname();
  const isHome                      = pathname === "/";

  const morphRef    = useRef<HTMLButtonElement>(null);
  const menuRef     = useRef<HTMLDivElement>(null);
  const barRef      = useRef<HTMLDivElement>(null);
  const linksRef    = useRef<HTMLElement>(null);
  const indRef      = useRef<HTMLSpanElement>(null);
  const headerRef   = useRef<HTMLElement>(null);
  const fabDeskRef  = useRef<HTMLButtonElement>(null);
  // The current route's dark hero, if any — the page's own tone marker. Cached on route
  // change so readScroll can read its position without a querySelector every frame.
  const darkHeroRef = useRef<HTMLElement | null>(null);
  const lastYRef    = useRef(0);
  const rafRef      = useRef(0);
  const specRafRef  = useRef(0);
  const scrollEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hero visibility observer (kept — feeds the active-section highlight)
  useEffect(() => {
    const hero = document.getElementById("hero");
    const heroObs = hero
      ? new IntersectionObserver(([e]) => setHeroInView(e.isIntersecting), { threshold: 0.1 })
      : null;
    heroObs?.observe(hero!);
    return () => heroObs?.disconnect();
  }, []);

  // The ONE shared scroll reader — direction (hide/show), the scrolled flag, and the active
  // section. It is a READER; ScrollManager (#152) stays the sole owner of scroll POSITION.
  // A programmatic scroll (a nav click) is skipped via the existing isProgrammaticRef so the
  // bar never flaps mid-animation. The pointer specular is idled while this runs.
  const readScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 18);
    if (!isHome) setActive(null);
    else if (!smoothScroll?.isProgrammaticRef.current) setActive(getActiveSection());

    // Nav tone: dark while the pill overlaps the page's dark hero (its own .is-dark
    // marker, cached on route change), light once scrolled past it onto the cards.
    const darkHero = darkHeroRef.current;
    setOnDark(!!darkHero && darkHero.getBoundingClientRect().bottom > NAV_TONE_SWITCH);

    if (!smoothScroll?.isProgrammaticRef.current) {
      const topZone = window.matchMedia("(min-width: 1024px)").matches ? 80 : 40;
      const dy = y - lastYRef.current;
      if (y <= topZone) {
        setNavHidden(false);
        lastYRef.current = y;
      } else if (Math.abs(dy) > THRESH) {
        setNavHidden(dy > 0);
        lastYRef.current = y;
      }
    }

    // idle the pointer specular during scroll (the per-pointermove radial is the frame risk)
    const bar = barRef.current;
    if (bar) {
      bar.classList.add("is-scrolling");
      if (scrollEndRef.current) clearTimeout(scrollEndRef.current);
      scrollEndRef.current = setTimeout(() => bar.classList.remove("is-scrolling"), 140);
    }
  }, [isHome, smoothScroll]);

  // Native scroll (reduced motion / no Lenis) — rAF-throttled.
  useEffect(() => {
    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(() => { rafRef.current = 0; readScroll(); });
    };
    lastYRef.current = window.scrollY;
    readScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [readScroll]);

  // Lenis per-frame (accurate smooth-scroll tracking) — same reader, no extra listener.
  // One call: it both subscribes `readScroll` and hands back the instance used below.
  const lenis = useLenis(readScroll, [readScroll]);

  // Route change (PUSH or POP): show the nav IMMEDIATELY, without animating, reset the
  // direction baseline, and drop any open menu. Covers #152's back/forward restore.
  useEffect(() => {
    const header = headerRef.current;
    header?.setAttribute("data-nav-instant", "true");
    setNavHidden(false);
    setSheetOpen(false);
    setMenuOpen(false);
    lastYRef.current = window.scrollY;
    const id = requestAnimationFrame(() => {
      header?.removeAttribute("data-nav-instant");
      // Re-cache the new route's dark hero (its own .is-dark tone marker) and set the
      // tone for the current scroll position, so a dark hero paints the nav dark on arrival.
      darkHeroRef.current = document.querySelector<HTMLElement>(".hero-ground.is-dark");
      const darkHero = darkHeroRef.current;
      setOnDark(!!darkHero && darkHero.getBoundingClientRect().bottom > NAV_TONE_SWITCH);
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // When the row returns (scroll up / top), the desktop sheet closes with it.
  useEffect(() => {
    if (!navHidden) setSheetOpen(false);
  }, [navHidden]);

  // Cross-page hash scroll (kept)
  useEffect(() => {
    if (!isHome) return;
    const hash = window.location.hash;
    if (hash.length < 2) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      if (smoothScroll) smoothScroll.scrollToTarget(el, { offset: SCROLL_TO_OFFSET });
      else if (lenis) lenis.scrollTo(el, { offset: SCROLL_TO_OFFSET });
      else el.scrollIntoView();
    });
    return () => cancelAnimationFrame(raf);
  }, [isHome, smoothScroll, lenis]);

  // Mobile menu open/close (the clip-path blob — unchanged behaviour)
  function openMenu() {
    setMenuOpen(true);
    // If the row was hidden (scrolled down), bring it back so the pill can be the menu's
    // header and its morph stays reachable — matching the reference's open behaviour.
    setNavHidden(false);
    lenis?.stop();
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    setMenuOpen(false);
    lenis?.start();
    document.body.style.overflow = "";
    morphRef.current?.focus();
  }
  function toggleMenu() {
    if (menuOpen) closeMenu();
    else openMenu();
  }

  function handleMobileNavClick(e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) {
    // A route still has to close the menu and release the scroll lock before it navigates,
    // or the body stays locked on the page it lands on.
    if (isRoute(item)) {
      setMenuOpen(false);
      lenis?.start();
      document.body.style.overflow = "";
      return;
    }
    const id = item.id;
    if (!isHome) {
      setMenuOpen(false);
      lenis?.start();
      document.body.style.overflow = "";
      return;
    }
    e.preventDefault();
    setActive(id);
    const el = document.getElementById(id);
    setMenuOpen(false);
    lenis?.start();
    document.body.style.overflow = "";
    if (!el) return;
    requestAnimationFrame(() => {
      if (smoothScroll) smoothScroll.scrollToTarget(el, { offset: SCROLL_TO_OFFSET });
      else if (lenis) lenis.scrollTo(el, { offset: SCROLL_TO_OFFSET });
      else el.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Focus trap + Escape while the mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const el = menuRef.current;
    if (!el) return;
    const focusable = Array.from(
      el.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])'),
    );
    focusable[0]?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { closeMenu(); return; }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  // Desktop sheet: outside-click + Escape close, focus returns to the FAB
  useEffect(() => {
    if (!sheetOpen) return;
    function onDoc() { setSheetOpen(false); }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSheetOpen(false); fabDeskRef.current?.focus(); }
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) {
    // A ROUTE NAVIGATES. Falling through to preventDefault would cancel the navigation and
    // then scroll to an element that does not exist — a link that silently does nothing.
    if (isRoute(item)) return;
    const id = item.id;
    if (!isHome) return;
    e.preventDefault();
    setActive(id);
    const el = document.getElementById(id);
    if (!el) return;
    if (smoothScroll) smoothScroll.scrollToTarget(el, { offset: SCROLL_TO_OFFSET });
    else if (lenis) lenis.scrollTo(el, { offset: SCROLL_TO_OFFSET });
    else el.scrollIntoView({ behavior: "smooth" });
  }

  // Hover sliding indicator — measure the link and move ONE pill (magic move).
  function moveIndicator(el: HTMLElement) {
    const group = linksRef.current, ind = indRef.current;
    if (!group || !ind) return;
    const gr = group.getBoundingClientRect(), r = el.getBoundingClientRect();
    ind.style.width = `${r.width}px`;
    ind.style.transform = `translate(${r.left - gr.left}px, -50%) scaleX(1)`;
    group.classList.add("is-hot");
  }
  function clearIndicator() { linksRef.current?.classList.remove("is-hot"); }

  // Pointer-tracked specular — rAF-throttled, and skipped while scrolling.
  function onBarPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const bar = barRef.current;
    if (!bar || bar.classList.contains("is-scrolling")) return;
    if (specRafRef.current) return;
    const cx = e.clientX, cy = e.clientY;
    specRafRef.current = requestAnimationFrame(() => {
      specRafRef.current = 0;
      const r = bar.getBoundingClientRect();
      bar.style.setProperty("--mx", `${((cx - r.left) / r.width) * 100}%`);
      bar.style.setProperty("--my", `${((cy - r.top) / r.height) * 100}%`);
    });
  }

  const Logo = (
    <Link
      href="/"
      aria-label="Akshita Singh, home"
      className="logo-link"
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        if (smoothScroll) smoothScroll.scrollToTarget(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
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
  );

  return (
    <header
      ref={headerRef}
      // Hero-as-ground: the nav must FLOAT OVER the hero, not reserve a band above it.
      // Sticky kept the header in flow, so it pushed the hero's top edge down by its own
      // height (69px) and the page's tan background showed through above the hero. Fixed
      // (like the reference) takes it out of flow so the hero starts at y=0. Position only
      // — the glass, morph and scroll-hide from #155 are unchanged.
      className="site-header fixed inset-x-0 z-42"
      // The pill FLOATS on every page: a constant top offset (--nav-top) so its top edge
      // never sits flush against the viewport edge (which read as clipped). The hero still
      // runs under the nav — the hero's top edge stays 0; only the pill is inset. The hero's
      // internal runway (--hero-nav-runway) is keyed off the same token so the gap tracks.
      style={{ top: "var(--nav-top)" }}
      data-nav-hidden={navHidden || undefined}
      data-nav-tone={onDark ? "dark" : undefined}
    >
      <div className="container-x">
        <div className="nav-row">
          <div
            ref={barRef}
            className={`nav-glass${!scrolled && !menuOpen ? " is-ghost" : ""}`}
            onPointerMove={onBarPointerMove}
          >
            {Logo}

            <span className="nav-sepdot" aria-hidden="true" />

            <div className="nav-desktop">
              <nav ref={linksRef} className="nav-links" aria-label="Site sections" onPointerLeave={clearIndicator}>
                <span ref={indRef} className="nav-ind" aria-hidden="true" />
                {NAV.map((item) => (
                  <Link
                    key={item.id}
                    href={navHref(item, isHome)}
                    scroll={false}
                    onClick={(e) => handleNavClick(e, item)}
                    onPointerEnter={(e) => moveIndicator(e.currentTarget)}
                    // A section is current when the spy says so; a ROUTE is current when
                    // you are on it. `page` rather than `true` because that is what it is.
                    aria-current={
                      isRoute(item)
                        ? pathname.startsWith(item.href)
                          ? "page"
                          : undefined
                        : active === item.id
                          ? "true"
                          : undefined
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {resume && (
                <a
                  className="nav-cta"
                  href={resume.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Resume (opens in a new tab)"
                >
                  <span>Resume</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>

            {/* Mobile morph — replaces the burger glyph; toggles the clip-path menu (blob). */}
            <button
              ref={morphRef}
              className={`nav-morph${menuOpen ? " is-open" : ""}`}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={toggleMenu}
            >
              <i /><i /><i />
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop scrolled: floating morph → glass sheet. */}
      <button
        ref={fabDeskRef}
        className={`nav-morph nav-fab nav-fab-desktop${navHidden ? " is-shown" : ""}${sheetOpen ? " is-open" : ""}`}
        aria-expanded={sheetOpen}
        aria-controls="nav-sheet"
        aria-label={sheetOpen ? "Close menu" : "Open menu"}
        onClick={(e) => { e.stopPropagation(); setSheetOpen((o) => !o); }}
      >
        <i /><i /><i />
      </button>
      <div id="nav-sheet" className={`nav-sheet${sheetOpen ? " is-open" : ""}`}>
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={navHref(item, isHome)}
            scroll={false}
            onClick={(e) => { handleNavClick(e, item); setSheetOpen(false); }}
            aria-current={isRoute(item) && pathname.startsWith(item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <div className="nav-sheet-sep" />
        {resume && (
          <a className="nav-sheet-resume" href={resume.href} target="_blank" rel="noopener noreferrer">
            Resume ↗
          </a>
        )}
      </div>

      {/* Mobile hidden: floating morph in its corner, toggles the same menu. */}
      <button
        className={`nav-morph nav-fab nav-fab-mobile${navHidden && !menuOpen ? " is-shown" : ""}${menuOpen ? " is-open" : ""}`}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
      >
        <i /><i /><i />
      </button>

      {/* Mobile menu — fixed clip-path circle reveal (the blob), unchanged. */}
      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal={menuOpen || undefined}
        aria-label="Site navigation"
        inert={!menuOpen}
        className={`header-mobile-menu${menuOpen ? " open" : ""}`}
      >
        <nav aria-label="Mobile site navigation" className="flex flex-col mt-auto">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={navHref(item, isHome)}
              scroll={false}
              className="header-mob-nav-item"
              onClick={(e) => handleMobileNavClick(e, item)}
              aria-current={isRoute(item) && pathname.startsWith(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {resume && (
          <a
            href={resume.href}
            target="_blank"
            rel="noopener noreferrer"
            className="header-mob-resume-pill"
            onClick={closeMenu}
          >
            Resume ↗
          </a>
        )}

        <div className="header-mob-socials">
          {links.map(({ label, href, external, glyph }, i) => (
            <a
              key={i}
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
