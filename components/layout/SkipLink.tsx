"use client";

// Skip link (WCAG 2.4.1 Bypass Blocks). The first focusable element on the page,
// hidden until focused, so a keyboard user can jump past the nav straight to the
// main content.
//
// WHY IT MANAGES FOCUS EXPLICITLY rather than relying on the default `#main-content`
// hash jump: this site runs Lenis smooth scroll, and default anchor-jump focus
// behavior is unreliable when a smooth-scroll layer is present (the jump scrolls but
// focus can stay on the link). A skip link that scrolls without MOVING FOCUS is
// broken — the next Tab would resume from the nav, not the content. So the handler
// focuses `<main>` (tabIndex -1, so it can receive focus) and scrolls it into view.
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(e) => {
        const main = document.getElementById("main-content");
        if (!main) return; // no main on this route (e.g. an error page) — let the default run
        e.preventDefault();
        main.focus();
        main.scrollIntoView();
      }}
      className="sr-only border border-etch/8 bg-surface px-4 py-2 text-[14px] font-medium text-text-primary outline-2 outline-accent-500 focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:outline"
    >
      Skip to content
    </a>
  );
}
