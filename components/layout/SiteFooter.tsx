import FooterClock from "./FooterClock";
import FooterBackToTop from "./FooterBackToTop";
import type { ElsewhereLink } from "@/lib/social-links";

export default function SiteFooter({ links }: { links: ElsewhereLink[] }) {
  return (
    <footer className="py-10">
      <div className="container-x">
        <div
          className="footer-panel relative overflow-hidden rounded-lg px-[50px] pb-[26px]"
          style={{ backgroundColor: "var(--color-cream-50)" }}
        >
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
              color: "var(--color-cream-300)",
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
              <p className="font-script text-[42px] leading-none">
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
                  className="footer-sagar relative text-accent-500 no-underline whitespace-nowrap"
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
                  fill="var(--color-accent-500)"
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
