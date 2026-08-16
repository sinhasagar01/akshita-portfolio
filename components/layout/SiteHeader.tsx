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
  /* ⚠ THIS ORDER IS NOT COSMETIC — `getActiveSection()` BELOW READS IT AS DOM ORDER. It keeps the
     LAST entry whose top is above the header, which is only correct while this array matches the
     page. `nav-order` asserts the two agree; without that, moving a section on the home page makes
     the spy highlight the wrong link and nothing goes red. */
  { id: "work",    label: "Work"    },
  { id: "process", label: "Process" },
  { id: "about",   label: "About"   },
  { id: "blog",    label: "Blog", href: "/blog" },
  /* A THIRD ROUTE ENTRY, and adding it is the whole change for the same reason `blog` and
     `palettes` were: it has an `href` and no home-page section, `isRoute` derives that from the
     presence of `href`, and the four consumers already guard on it.

     ⚠ IT SHIPS WITH THE COLLECTION EMPTY, DELIBERATELY. `/gallery` renders an empty state rather
     than 404ing, so the link goes somewhere real; holding it back until an item exists is how the
     blog nav link became "the launch switch" — a line nobody could test until the day it had to
     work. The alternative failure, a page that ships unreachable, is the one `app/sitemap.ts`
     records three times.

     ⚠ AND THE ORDER PUTS IT BESIDE BLOG RATHER THAN BESIDE WORK, which is a claim about what it
     is. The gallery is explicitly the things that are NOT work — its own masthead says so — so
     sitting next to the case studies would invite exactly the overlap the collection was scoped to
     avoid when "Projects" as a filter was ruled a duplication of the work section. */
  { id: "gallery", label: "Gallery", href: "/gallery" },
  /* ⚠ A ROUTE ENTRY, LIKE `blog` — it has an `href` and NO section on the home page, so the
     scroll-spy and the scroll handlers must never see it. `isRoute` derives that from the presence
     of `href` and every consumer guards on it, which is why adding this line is the whole change.

     ⚠ THIS SENTENCE SAID "four sites, lines 87, 277, 350 and 462". COUNTED: SEVEN, and not one of
     the four line numbers was right. Line numbers in prose are the most decay-prone claim a comment
     can carry — every edit above them moves them, and nothing re-reads the number.

     THE COUNT IS DELETED RATHER THAN CORRECTED. A fresh one would be wrong again by the next
     commit, and what a reader needs is the PROPERTY — a route entry has an `href`, so guard on
     `isRoute` — not a census of where it is enforced. `git grep isRoute` is exact and never stale.

     ⚠ AND THE PARAGRAPH DIRECTLY BELOW IS THIS COMMENT CORRECTING ITSELF FOR THE SAME KIND OF
     ERROR. It was wrong about a symbol; this was wrong about a count and four line numbers. A
     comment that has already been caught making a precise mechanical claim made another one.

     ⚠ THE COMMENT HERE FIRST NAMED A `SECTION_IDS` CONSTANT THAT DOES NOT EXIST. It read as a
     precise mechanical claim, and nothing reads prose — the exact defect this repo has recorded
     against comments a dozen times, written into the last file of the arc that recorded it. The
     symbol is `isRoute`; it was checked before this sentence was rewritten.

     ⚠ AND THERE IS NO `/playground` INDEX BEHIND IT. A section index with one card is a container
     with one item; the link goes straight to the thing.

     ⚠ THE SECOND PIECE HAS NOW SHIPPED AND THE INDEX STILL LOST — THIS LINE PREVIOUSLY READ "if a
     second playground piece ever ships, THAT is when an index earns its existence", which named a
     trigger, and the trigger was met by `/oklch`. The comment is updated rather than left
     describing a decision that has since been made twice.

     THE REASON IT LOST IS THE SAME ONE, ARRIVING AT A DIFFERENT NUMBER: a section index with TWO
     cards is a container with two items, and every visitor now pays a click to reach either of the
     two things instead of arriving at one of them. What an index would have provided is discovery
     of the second piece, and that is supplied by cross-links — each page's hero and closing block
     points at the other — which costs no click for anyone who wanted the first page.

     ⚠ SO THE TRIGGER IS NOT RESTATED WITH A BIGGER NUMBER, because "three pieces" would be the same
     guess wearing a different digit. What would actually earn an index is a piece that CANNOT be
     reached from the others — something nobody arriving at `/palettes` would think to look for. Two
     pages about the same subject, each linking the other, is not that. */
  { id: "palettes", label: "Playground", href: "/palettes" },
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

/* ⚠ THE PREDICATE, WRITTEN AS THE PREDICATE — `data-nav-tone="dark"` means WHAT IS CURRENTLY BEHIND
 * THE NAV IS DARK. Until #396 it computed that from one ANSWER rather than from the question: it
 * cached `.hero-ground.is-dark` and asked whether that specific element was still under the pill.
 *
 * ⚠ THAT WAS ONE WAY THE PREDICATE BECOMES TRUE AND THERE ARE AT LEAST THREE. A dark PAGE ground
 * (a dark palette puts `data-ground="dark"` on `<html>`) left the nav light over it — measured, its
 * links fell to 1.29 against a 4.5 floor. And the dark QUOTE BAND has carried the attribute
 * mid-page since #387, so scrolling the nav over it has the same defect TODAY on the light site.
 *
 * ⚠ SO IT IS NOT "hero OR dark ground" — THAT IS TWO CASES WHERE THERE IS ONE FACT, and a case list
 * is wrong the first time a fourth answer arrives. Every dark region already declares itself with
 * `data-ground="dark"`, including `<html>`, so the question is answerable directly: is any of them
 * behind the nav's band right now? `<html>` on a dark palette always is, which is the page-ground
 * case falling out for free rather than being special-cased. */
const isDarkBehindNav = () => {
  for (const el of document.querySelectorAll<HTMLElement>('[data-ground="dark"]')) {
    const r = el.getBoundingClientRect();
    /* the nav's band is the top strip; a region is behind it if it spans any of that strip */
    if (r.top < NAV_TONE_SWITCH && r.bottom > 0) return true;
  }
  return false;
};

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
  // CONSULTED IN EXACTLY TWO PLACES, AND THE CSS IS WHY THERE ARE ONLY TWO.
  //
  // Hazard 18 described this as unguarded animations. It was real that the hook was unused
  // and wrong about what that cost. Every CSS animation this file drives is ALREADY handled
  // in globals.css under `prefers-reduced-motion` — the blob menu swaps its clip-path for an
  // opacity toggle, the sheet and FAB lose their transitions, the morph and logo blocks are
  // wrapped in `no-preference`, and the hover affordances fall to the global
  // `transition-duration: 0.01ms` reset. The nav row even KEEPS its hide behaviour and only
  // loses the translate, which is the right call and not one a blanket "disable it" would
  // have made.
  //
  // What the reset structurally CANNOT reach is a scroll animated by script. An explicit
  // `behavior: "smooth"` OVERRIDES `scroll-behavior: auto !important`, so the THREE calls
  // that pass it were animating for readers who asked for no animation. That is #171's R2
  // finding one layer up: the CSS reset does not stop SMIL, and by extension does not stop
  // anything driven outside CSS.
  //
  // THREE, not the two the investigation found. Two are `scrollIntoView`; the third is the
  // logo's `window.scrollTo`, which a search for `scrollIntoView` walks straight past. The
  // ralph suite found it, which is the argument for the suite existing.
  //
  // THE IRONY IS THE POINT: the reduced-motion path is the ONLY path that reached them.
  // SmoothScrollProvider returns bare children under reduce, so `smoothScroll` and `lenis`
  // are both null and both branches fall through to the `else`. A reduced-motion reader
  // clicking a nav link got an animated smooth scroll nobody else got.
  //
  // NOTE IT DOES NOT LIVE-UPDATE, whatever its docstring says. `useReducedMotion` snapshots
  // into `useState` at mount and never re-reads (the library's own TODO admits it), and it
  // returns `null` server-side. Toggling the OS setting mid-session changes nothing until a
  // remount — which is why the gate for this had to emulate before load and reload.
  const reduced                     = useReducedMotion();
  const [scrolled, setScrolled]     = useState(false);
  const [active, setActive]         = useState<SectionId | null>(null);
  const [, setHeroInView]           = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false); // mobile clip-path menu (the blob)
  const [navHidden, setNavHidden]   = useState(false); // scroll-down hides the row
  const [sheetOpen, setSheetOpen]   = useState(false); // desktop scrolled glass sheet
  const [onDark, setOnDark]         = useState(false); // pill over ANY dark region — see isDarkBehindNav
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

    // Nav tone: dark while ANY region declaring `data-ground="dark"` is behind the pill — the
    // hero, a mid-page quote band, or the page itself under a dark palette.
    setOnDark(isDarkBehindNav());

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
      // Re-read the tone for the new route at its current scroll position, so a dark region
      // paints the nav dark on arrival rather than after the first scroll event.
      setOnDark(isDarkBehindNav());
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
      // THIS `else` IS THE REDUCED-MOTION PATH. Both branches above are null under reduce
      // (SmoothScrollProvider renders no provider), so an explicit "smooth" here animated
      // for exactly the readers who asked it not to. Same shape as PreviewRail:317.
      else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
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
    // See the note on the same `else` in the mobile handler above — this is the desktop
    // twin, and it is the one a reduced-motion reader hits on every nav click.
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
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
        // The third of the same shape, and the one the investigation MISSED — it greps as
        // `window.scrollTo`, not `scrollIntoView`, so a search for the latter walked past it.
        // The ralph suite caught it. Same reasoning as the two above.
        else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
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
      {/* ⚠ `inert` WHEN CLOSED, AND THE MOBILE DRAWER 38 LINES BELOW ALREADY DID THIS. The sheet
          closes with `opacity: 0` and `pointer-events: none`, which stops a POINTER and does
          nothing to the TAB ORDER — `visibility` stays `visible`, so the eight links inside stayed
          focusable. Measured at 1280x800: the first one took focus at (1051, 84), 180x40, inside
          the viewport, reading "Work". A keyboard visitor got eight focus rings on empty space and
          Enter navigated them somewhere they had never seen. WCAG 2.4.3, 2.4.7 and 4.1.2.

          ⚠ THE PATTERN WAS ALREADY IN THIS FILE AND THIS ELEMENT DID NOT GET IT. `#mobile-menu`
          carries `inert={!menuOpen}` and has since it was built. Two sibling disclosure surfaces,
          one guarded and one not — which is why the defect reads as an omission rather than a
          decision, and why the fix is the existing spelling rather than a new mechanism. */}
      <div id="nav-sheet" inert={!sheetOpen} className={`nav-sheet${sheetOpen ? " is-open" : ""}`}>
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
