import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import type { ExperienceListItem } from "@/lib/keystatic";

type Props = { experience: ExperienceListItem[] };

function parseCompany(raw: string): { display: string; acquiredBy: string | null; city: string } {
  const m = raw.match(/^(.+?),\s*acquired by\s+(.+?),\s*(.+)$/i);
  if (m) return { display: m[1].trim(), acquiredBy: m[2].trim(), city: m[3].trim() };
  const idx = raw.lastIndexOf(",");
  if (idx !== -1) return { display: raw.slice(0, idx).trim(), acquiredBy: null, city: raw.slice(idx + 1).trim() };
  return { display: raw, acquiredBy: null, city: "" };
}

function CompanyLine({ raw, className }: { raw: string; className?: string }) {
  const { display, acquiredBy, city } = parseCompany(raw);
  return (
    <div className={className}>
      {display}
      {acquiredBy && (
        <span className="font-display italic normal-case tracking-[0] text-[13px]" style={{ color: "var(--color-accent-500)" }}>
          {" "}acquired by {acquiredBy}
        </span>
      )}
      {city && <span className="normal-case tracking-[0]"> · {city}</span>}
    </div>
  );
}

export default function ExperienceSection({ experience }: Props) {
  if (experience.length === 0) return null;

  const feature = experience.find((e) => e.endDate.trim().toLowerCase() === "present") ?? experience[0];
  const previous = experience.filter((e) => e !== feature);

  return (
    <SectionWrapper>
      <Container>
        <SectionHeading
          index="04"
          title="Experience"
          subtext="Where I have shaped products, the most recent first."
          variant="default"
          tone="warm"
        />
        <div className="mt-8 sm:mt-[52px]">

          {/* Feature block */}
          <div
            className="relative overflow-hidden mb-[30px]"
            style={{ background: "#F3EADB", borderRadius: "14px", padding: "28px 30px" }}
          >
            {/* Static warm glow — inside the card, clipped by overflow hidden */}
            <div
              aria-hidden
              className="absolute right-[-40px] top-[-30px] w-[280px] h-[200px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(closest-side, rgba(181,97,60,.22), transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            {/* Eyebrow */}
            <div
              className="relative flex items-center gap-[7px] text-[11px] tracking-[.16em] uppercase font-semibold"
              style={{ color: "var(--color-accent-500)" }}
            >
              <span
                aria-hidden
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ background: "var(--color-accent-500)" }}
              />
              Currently
            </div>
            {/* Company */}
            <CompanyLine
              raw={feature.company}
              className="relative mt-[14px] text-[12px] tracking-[.13em] uppercase text-[--color-text-muted]"
            />
            {/* Role */}
            <div className="relative font-display italic font-normal text-[23px] sm:text-[28px] leading-[1.15] mt-[6px] text-[--color-text-primary]">
              {feature.title}
            </div>
            {/* Date */}
            <div className="relative text-[13px] text-[--color-text-muted] mt-[10px]">
              {feature.startDate} – {feature.endDate}
            </div>
          </div>

          {/* Previously list */}
          {previous.length > 0 && (
            <>
              <p className="text-[11px] tracking-[.16em] uppercase text-[--color-text-muted] font-semibold mb-2 m-0">
                Previously
              </p>
              <div>
                {previous.map((entry) => (
                  <div
                    key={entry.slug}
                    className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-x-6 gap-y-1 px-3 py-[15px] rounded-[10px] transition-colors duration-300 hover:bg-[#F3EADB] border-b border-[rgba(60,45,30,.09)] last:border-b-0"
                  >
                    <div className="text-[13.5px] text-[--color-text-muted]">
                      {entry.startDate} – {entry.endDate}
                    </div>
                    <div>
                      <CompanyLine
                        raw={entry.company}
                        className="text-[11px] tracking-[.12em] uppercase text-[--color-text-muted]"
                      />
                      <div className="text-[15.5px] font-semibold mt-[3px] text-[--color-text-primary]">
                        {entry.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Container>
    </SectionWrapper>
  );
}
