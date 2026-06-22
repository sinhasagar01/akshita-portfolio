import FooterClock from "./FooterClock";
import FooterExplore from "./FooterExplore";
import FooterBackToTop from "./FooterBackToTop";

const ELSEWHERE = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/akshita25/",
    external: true,
  },
  {
    label: "Behance",
    href: "https://behance.net/akshitasingh",
    external: true,
  },
  {
    label: "Email",
    href: "mailto:akshitasingh094@gmail.com",
    external: false,
  },
  {
    label: "Resume",
    href: "https://drive.google.com/file/d/1R96hpdb73wixPa-Y9g2H67VGIILFhEhk/view",
    external: true,
  },
] as const;

export default function SiteFooter() {
  return (
    <footer className="py-10">
      <div className="container-x">
        <div
          className="rounded-2xl px-[46px] pt-[44px] pb-9"
          style={{ backgroundColor: "var(--color-cream-50)" }}
        >
          {/* Top row */}
          <div className="flex justify-between gap-10 flex-wrap">

            {/* Identity block */}
            <div>
              <p className="max-w-none font-script text-[34px] leading-none text-[--color-text-primary]">
                Akshita Singh
              </p>
              <p className="max-w-none mt-3 text-[12px] tracking-[.18em] uppercase text-[--color-text-muted]">
                Product Designer
              </p>
              <p className="max-w-none mt-[18px] flex items-center gap-2 text-[13px] text-[--color-text-secondary]">
                Designed and built in Bengaluru{" "}
                <span className="text-[--color-accent-500]" aria-hidden="true">
                  ✦
                </span>
              </p>
              <p className="max-w-none mt-1.5 text-[13px] text-[--color-text-muted]">
                Coded by{" "}
                <a
                  href="https://www.linkedin.com/in/sagarsinha1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[--color-accent-500] underline underline-offset-2 decoration-[--color-accent-500]/40 hover:decoration-[--color-accent-500] transition-colors duration-[--duration-base]"
                >
                  Sagar
                </a>
              </p>
              <FooterClock />
            </div>

            {/* Link columns */}
            <div className="flex gap-[54px] flex-wrap">
              <FooterExplore />

              <div>
                <h4 className="text-[11px] tracking-[.16em] uppercase text-[--color-accent-500] font-semibold mb-3">
                  Elsewhere
                </h4>
                {ELSEWHERE.map(({ label, href, external }) => (
                  <a
                    key={label}
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="block text-[14px] text-[--color-ink-800] hover:text-[--color-accent-500] no-underline transition-colors duration-[--duration-base] mb-[9px]"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Hairline */}
          <div
            aria-hidden="true"
            className="my-[34px]"
            style={{ height: "1px", backgroundColor: "rgba(60,45,30,0.1)" }}
          />

          {/* Bottom row */}
          <div className="flex justify-between items-center gap-5 flex-wrap">
            <span className="text-xs italic font-display text-[--color-text-muted]">
              © 2026 Akshita Singh · Built with Next.js and Tailwind, set in Fraunces and DM Sans
            </span>
            <FooterBackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
