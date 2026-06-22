import FooterClock from "./FooterClock";
import FooterBackToTop from "./FooterBackToTop";
import { ELSEWHERE } from "@/lib/social-links";

export default function SiteFooter() {
  return (
    <footer className="py-10">
      <div className="container-x">
        <div
          className="relative overflow-hidden rounded-2xl px-[50px] pb-[26px]"
          style={{ backgroundColor: "var(--color-cream-50)" }}
        >
          {/* Ciao backdrop */}
          <div
            aria-hidden="true"
            className="absolute top-[34px] left-[44px] pointer-events-none select-none"
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
              <p className="font-script text-[42px] leading-none text-[--color-text-primary]">
                Akshita Singh
              </p>
              <p className="mt-[13px] text-[12px] tracking-[.22em] uppercase text-[--color-text-subtle]">
                Product Designer
              </p>
              <p className="mt-6 text-[16px] text-[--color-ink-800]">
                Designed by Me{" "}
                <span style={{ color: "var(--color-text-subtle)", margin: "0 8px" }}>·</span>
                Built by{" "}
                <a
                  href="https://www.linkedin.com/in/sagarsinha1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-sagar relative text-[--color-accent-500] no-underline whitespace-nowrap"
                >
                  Sagar
                  <span className="footer-sagar-arrow text-[.8em] ml-[1px]" aria-hidden="true">↗</span>
                </a>
              </p>
              <FooterClock />
            </div>

            {/* Right — social */}
            <div className="text-right">
              <p className="text-[11px] tracking-[.18em] uppercase text-[--color-text-subtle] mb-4">
                Social
              </p>
              <div
                className="footer-social inline-grid items-center text-left"
                style={{ gridTemplateColumns: "auto auto", gap: "13px 12px" }}
              >
                {ELSEWHERE.map(({ label, href, external, glyph }) => (
                  <a
                    key={label}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    style={{ display: "contents", textDecoration: "none" }}
                  >
                    <span
                      className="footer-chip flex items-center justify-center w-[34px] h-[34px] rounded-[9px] text-[12px] font-semibold text-[--color-text-secondary]"
                      style={{ border: "1px solid rgba(120,90,60,0.3)", transition: "border-color 0.2s, color 0.2s" }}
                    >
                      {glyph}
                    </span>
                    <span
                      className="footer-label text-[15px] text-[--color-text-primary]"
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
            className="relative flex justify-between items-center text-[13px] text-[--color-text-subtle] mt-9 pt-[22px]"
            style={{ borderTop: "1px solid rgba(60,45,30,0.1)", zIndex: 2 }}
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
