import Container from "@/components/layout/Container";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SheetSectionHead from "@/components/sheet/SheetSectionHead";
import type { ExperienceListItem } from "@/lib/keystatic";
import { selectCurrentExperience } from "./experience-current";

type Props = { experience: ExperienceListItem[] };

function parseCompany(raw: string): { display: string; acquiredBy: string | null; city: string } {
  const m = raw.match(/^(.+?),\s*acquired by\s+(.+?),\s*(.+)$/i);
  if (m) return { display: m[1].trim(), acquiredBy: m[2].trim(), city: m[3].trim() };
  const idx = raw.lastIndexOf(",");
  if (idx !== -1) return { display: raw.slice(0, idx).trim(), acquiredBy: null, city: raw.slice(idx + 1).trim() };
  return { display: raw, acquiredBy: null, city: "" };
}

function CompanyLine({
  raw,
  location,
  className,
}: {
  raw: string;
  location?: string;
  className?: string;
}) {
  const { display, acquiredBy, city: parsedCity } = parseCompany(raw);
  // Prefer the explicit location field when set; fall back to the city parsed
  // from the company name so entries without a location render unchanged.
  const city = location?.trim() || parsedCity;
  return (
    <div className={className}>
      {display}
      {acquiredBy && (
        /* ⚠ THE ACCENT LEAVES AN INLINE META PHRASE, WHICH IS NOT ONE OF ITS FOUR SANCTIONED JOBS.
           "acquired by X" is a fact about the company, at the same size as the line around it, and
           it was in the signal colour purely to look soft. `text-secondary`'s stated job is
           "supporting text — meta lines, captions, labels", which is exactly what this is.

           ⚠ AND THE ITALIC IS GONE NOW, WITH A CORRECTION TO WHAT THAT WAS SUPPOSED TO BUY. The note
           above said deciding the italic sites together "is what would let that font file go". IT IS
           NOT. `parseRich` supports `*italic*` as an AUTHORED mark and `rich.tsx` renders it as an
           `<em>`, in every case-study rich-text field and every blog paragraph — and it is IN USE, 8
           occurrences in live content. So the italic file is load-bearing for published prose and
           stays regardless of what this page does. What retiring these six sites buys is a page whose
           chrome is upright while emphasis an author writes is still slanted, which is the right
           split rather than a consolation. */
        <span className="font-display normal-case tracking-[0] text-[14px]" style={{ color: "var(--color-text-secondary)" }}>
          {" "}acquired by {acquiredBy}
        </span>
      )}
      {city && <span className="normal-case tracking-[0]"> · {city}</span>}
    </div>
  );
}

export default function ExperienceSection({ experience }: Props) {
  if (experience.length === 0) return null;

  // Current = endDate empty/whitespace OR "Present" (case-insensitive). No forced
  // experience[0] fallback: when nothing is current, feature is null, no badge
  // shows, and every entry renders under Previously (Phase-1 T3).
  const { feature, previous } = selectCurrentExperience(experience);

  return (
    <SectionWrapper id="experience" className="scroll-mt-20">
      <Container>
        <SheetSectionHead
          sheet="04"
          title="Experience"
          mark={`Service record · ${experience.length} roles`}
          lede="Where I have shaped products, the most recent first."
        />
        <div className="mt-8 sm:mt-[52px]">

          {/* Feature block — only when an entry is current (no forced fallback) */}
          {feature && (
          <div
            className="relative overflow-hidden mb-[30px]"
            style={{ background: "var(--color-cream-200)", padding: "28px 30px" }}
          >
            {/* Static warm glow — inside the card, clipped by overflow hidden */}
            <div
              aria-hidden
              className="absolute right-[-40px] top-[-30px] w-[280px] h-[200px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(closest-side, color-mix(in oklch, var(--color-accent) 22%, transparent), transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            {/* Eyebrow */}
            <div
              className="relative flex items-center gap-[7px] text-[12px] tracking-[.16em] uppercase font-semibold"
              /* ⚠ TEXT takes `accent-text`; the dot above it keeps `accent`. Same element tree, two
                 roles, split by KIND rather than by ground — the dot is a mark and this is read.
                 Measured 4.36 against a 4.5 floor on the dark page, which is 0.14 short and still
                 short. */
              style={{ color: "var(--color-accent-text)" }}
            >
              <span
                aria-hidden
                className="w-[6px] h-[6px] rounded-full shrink-0"
                style={{ background: "var(--color-accent)" }}
              />
              Currently
            </div>
            {/* Company */}
            <CompanyLine
              raw={feature.company}
              location={feature.location}
              className="relative mt-[14px] text-[12px] tracking-[.13em] uppercase text-text-subtle"
            />
            {/* ⚠ THE CURRENT ROLE TAKES THE STUDY ROLE RATHER THAN JUST LOSING ITS SLANT, because it
                IS a head — the most important line in the feature block — and the grammar already has
                a level for that. It was `font-normal` at 23/28px italic; `sheet-h3` is 600 at
                clamp(21px, 2.5vw, 31px) upright, which is the same treatment its siblings got in
                Process and Contact. Dropping only the italic would have left a 400-weight head above
                a 600-weight one elsewhere on the page, which is the size-says-more, weight-says-less
                cancellation this stylesheet already records. */}
            <div className="relative sheet-h3 mt-[6px]">
              {feature.title}
            </div>
            {/* Date */}
            <div className="relative text-[14px] text-text-subtle mt-[10px]">
              {feature.startDate} – {feature.endDate}
            </div>
          </div>
          )}

          {/* Previously list */}
          {previous.length > 0 && (
            <>
              <p className="text-[12px] tracking-[.16em] uppercase text-text-subtle font-semibold mb-2 m-0">
                Previously
              </p>
              <div>
                {previous.map((entry) => (
                  <div
                    key={entry.slug}
                    className="grid grid-cols-1 lg:grid-cols-[170px_1fr] gap-x-6 gap-y-1 px-3 py-[15px] transition-colors duration-300 hover:bg-cream-200 border-b border-[color-mix(in_srgb,_var(--color-ink-800)_9%,_transparent)] last:border-b-0"
                  >
                    <div className="text-[13.5px] text-text-subtle">
                      {entry.startDate} – {entry.endDate}
                    </div>
                    <div>
                      <CompanyLine
                        raw={entry.company}
                        location={entry.location}
                        className="text-[12px] tracking-[.12em] uppercase text-text-subtle"
                      />
                      <div className="text-[15.5px] font-semibold mt-[3px]">
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
