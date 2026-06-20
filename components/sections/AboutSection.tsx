import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import RevealSection from "@/components/motion/RevealSection";
import type { SiteSettingsEntry } from "@/lib/keystatic";

type Props = { settings: SiteSettingsEntry | null };

const BOLD_SPANS = ["LTIMindtree", "20,000 merchants"] as const;

function renderWithBold(text: string) {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  for (const term of BOLD_SPANS) {
    const idx = remaining.indexOf(term);
    if (idx === -1) continue;
    if (idx > 0) nodes.push(remaining.slice(0, idx));
    nodes.push(
      <strong key={term} style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
        {term}
      </strong>
    );
    remaining = remaining.slice(idx + term.length);
  }
  nodes.push(remaining);
  return nodes;
}

export default function AboutSection({ settings }: Props) {
  if (!settings || !settings.aboutCopy) return null;

  const paragraphs = settings.aboutCopy
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const lead = paragraphs[0];
  const body = paragraphs[1];
  const note = settings.aboutNote || null;
  const chips = settings.aboutFocusChips ?? [];

  return (
    <RevealSection
      id="about"
      className="scroll-mt-20 overflow-hidden py-0! px-0!"
    >
      <div className="grid grid-cols-1 md:grid-cols-[.92fr_1.08fr] items-stretch">

        {/* Photo column */}
        <div className="ab-photo min-h-[520px] reveal-card">
          <div className="ab-img">
            {settings.photo ? (
              <Image
                src={settings.photo}
                alt="Portrait of Akshita"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 46vw"
              />
            ) : (
              <ImagePlaceholder label="900 × 1200" />
            )}
          </div>
          {settings.photo && <div className="ab-tint" aria-hidden="true" />}
          <div className="ab-hint" aria-hidden="true">hover &#8594;</div>
          <div className="ab-cap">off the clock, painting under a tree</div>
        </div>

        {/* Bio column */}
        <div
          className="flex flex-col justify-start reveal-card"
          style={{ padding: "48px 44px" }}
        >

          <SectionHeading
            index="03"
            title="About"
            subtext="Seven years turning rough ideas into products people actually use."
            variant="watermark"
            tone="grey"
          />

          <div className="mt-8 sm:mt-[52px] flex flex-col gap-5">
          {lead && (
            <p
              className="font-display italic text-[--color-text-primary]"
              style={{ fontSize: "27px", lineHeight: "1.3", letterSpacing: "var(--tracking-snug)" }}
            >
              {lead}
            </p>
          )}

          {body && (
            <p
              className="max-w-[50ch]"
              style={{ fontSize: "15px", lineHeight: "1.62", color: "#4a4239" }}
            >
              {renderWithBold(body)}
            </p>
          )}

          {note && (
            <p
              className="font-display italic text-[--color-accent-500] max-w-[44ch]"
              style={{ fontSize: "16px", lineHeight: "1.45" }}
            >
              {note}
            </p>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap mt-[6px]" style={{ gap: "8px" }}>
              {chips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    fontSize: "12px",
                    color: "#5F584E",
                    backgroundColor: "#F1E9DC",
                    border: "1px solid rgba(120,90,60,.16)",
                    borderRadius: "9999px",
                    padding: "7px 13px",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
          </div>

        </div>
      </div>
    </RevealSection>
  );
}
