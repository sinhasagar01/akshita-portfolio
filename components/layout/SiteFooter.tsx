import FooterClock from "./FooterClock";
import FooterBackToTop from "./FooterBackToTop";
import type { ElsewhereLink } from "@/lib/social-links";

export default function SiteFooter({ links }: { links: ElsewhereLink[] }) {
  return (
    <footer className="py-10">
      <div className="container-x">
        <div
          className="footer-panel relative overflow-hidden rounded-lg px-[50px] pb-[26px]"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {/* ⚠ THE BACKDROP TAKES THE PAGE GROUND, NOT A LADDER RUNG. It was `cream-300`, which is a
              FIXED VALUE where the design wants a RELATION — one step off the panel it sits on — and
              globals.css already records that exact sentence about this exact token. `cream-300` is
              one of the few rungs the dark-ground block does not remap, so every dark palette
              declares it at L 88% and a near-white word blared behind the name:

                  light   ratio 1.37   a whisper, as drawn
                  dark    ratio 11.67  against a name at 15.24 — two shouts, 1.3x apart

              ⚠ AND THE TOKEN WAS NOT THE THING TO FIX. `cream-300`'s only other public consumers are
              the process diagram's depicted wireframe and the case-study illustrations, both
              boundary-listed as artwork that MUST NOT follow the ground. Remapping the rung would
              have moved two things that are deliberately fixed in order to move one that is not.

              `--color-background` is `canvas` on light and `band-dark` on dark, so the word reads as
              the page showing through a raised panel — the same material relation on both grounds,
              and always DARKER than the panel rather than flipping direction. */}
          {/* Ciao backdrop */}
          <div
            aria-hidden="true"
            className="footer-ciao absolute top-[34px] left-[44px] pointer-events-none select-none"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "116px",
              lineHeight: 1,
              letterSpacing: "-2px",
              color: "var(--color-background)",
              whiteSpace: "nowrap",
              zIndex: 0,
            }}
          >
            Ciao
          </div>

          {/* Content grid */}
          <div
            className="relative grid gap-[50px] items-start"
            style={{ gridTemplateColumns: "1fr auto", paddingTop: "52px", zIndex: 2 }}
          >
            {/* Left — identity */}
            <div>
              {/* ⚠ THE NAME SET NO COLOUR AT ALL AND INHERITED, WHICH IS WHY IT WENT WHITE ON DARK.
                  Inheriting means taking `text-primary`, the loudest foreground on the page — the
                  right weight for a heading and wrong for a signature, and on a dark ground it put
                  the name at 15.24 beside a backdrop at 11.67 with nothing separating them.

                  `accent-text` is a ROLE and resolves per ground, so this is one declaration rather
                  than a light value and a dark one: 6.88 to 8.45 on the light palettes and 5.94 to
                  6.62 on the dark, every one clear of the 4.5 floor. */}
              <p className="font-script text-[42px] leading-none text-accent-text">
                Akshita Singh
              </p>
              <p className="mt-[13px] text-[12px] tracking-[.22em] uppercase text-text-subtle">
                Product Designer
              </p>
              <p className="hidden lg:block mt-6 text-[16px] text-text-lead">
                Designed by Me{" "}
                <span style={{ color: "var(--color-text-subtle)", margin: "0 8px" }}>·</span>
                Built by{" "}
                <a
                  href="https://www.linkedin.com/in/sagarsinha1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-sagar relative text-accent no-underline whitespace-nowrap"
                >
                  Sagar
                  <span className="footer-sagar-arrow text-[.8em] ml-[1px]" aria-hidden="true">↗</span>
                </a>
              </p>
              <div className="hidden lg:block">
                <FooterClock />
              </div>
            </div>

            {/* Right — social */}
            <div className="text-right">
              <p className="text-[12px] tracking-[.18em] uppercase text-text-subtle mb-4">
                Social
              </p>
              <div
                className="footer-social inline-grid items-center text-left"
                style={{ gridTemplateColumns: "auto auto", gap: "13px 12px" }}
              >
                {links.map(({ label, href, external, glyph }, i) => (
                  <a
                    key={i}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    style={{ display: "contents", textDecoration: "none" }}
                  >
                    <span
                      className="footer-chip flex items-center justify-center w-[34px] h-[34px] rounded-[9px] text-[12px] font-semibold text-text-secondary"
                      style={{ border: "1px solid color-mix(in srgb, var(--color-rule) 30%, transparent)", transition: "border-color 0.2s, color 0.2s" }}
                    >
                      {glyph}
                    </span>
                    <span
                      className="footer-label text-[15px]"
                      style={{ transition: "color 0.2s" }}
                    >
                      {label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Hairline + bottom row */}
          <div
            className="relative flex flex-wrap justify-between items-center gap-y-[10px] text-[14px] text-text-subtle mt-9 pt-[22px]"
            style={{ borderTop: "1px solid color-mix(in srgb, var(--color-ink-800) 10%, transparent)", zIndex: 2 }}
          >
            <span className="flex items-center gap-[7px]">
              Built in Bengaluru with love
              <svg
                className="footer-heart shrink-0"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ transformOrigin: "center", display: "inline-block" }}
              >
                <path
                  d="M12 21S4 14.5 4 9a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 5.5-8 12-8 12z"
                  fill="var(--color-accent)"
                />
              </svg>
            </span>
            <FooterBackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
