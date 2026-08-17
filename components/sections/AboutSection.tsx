import Image from "next/image";
import SheetSectionHead from "@/components/sheet/SheetSectionHead";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import RevealSection from "@/components/motion/RevealSection";
import type { SiteSettingsEntry } from "@/lib/keystatic";
import { parseRich } from "@/lib/case-studies/adapter";

type Props = { settings: SiteSettingsEntry | null };

// The bio's bold emphasis is authored INLINE, as **bold** markers in aboutCopy.
//
// It used to be keyed to a hardcoded list of literal phrases, so rewording the
// bio silently dropped the emphasis — the one thing an owner editing their own
// bio in /studio is most likely to do. Marking it inline puts the emphasis in
// the content, where the person writing the sentence controls it.
//
// The parser is the case studies' parseRich, deliberately: **bold** already
// means this in every case-study text field, so the site has ONE definition of
// the marker rather than a second dialect for About. Only the rendering is
// local, because About's <strong> carries its own weight and colour.
function renderWithBold(text: string) {
  const parsed = parseRich(text);
  if (typeof parsed === "string") return parsed;
  return parsed.map((run, i) => {
    if (typeof run === "string") return run;
    if ("b" in run) {
      return (
        <strong key={i} style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
          {run.b}
        </strong>
      );
    }
    // parseRich gained italic and link marks. About only ever authored bold, and the bio
    // is a short paragraph rather than an editorial surface, so the other marks render as
    // their text instead of growing a second link treatment here. Falling through to
    // nothing would silently DROP the words, which is the failure that matters.
    if ("i" in run) return <em key={i}>{run.i}</em>;
    return <span key={i}>{run.a}</span>;
  });
}

export default function AboutSection({ settings }: Props) {
  // Only a missing settings singleton hides the section. A blank aboutCopy no
  // longer nukes the whole block (About-A) — the copy paragraphs simply omit
  // while the photo, heading, note, and chips still render.
  if (!settings) return null;

  const paragraphs = (settings.aboutCopy ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // The first paragraph is the display lead; every later paragraph is a body
  // paragraph (About-A — previously only paragraph 2 rendered, 3+ was dropped).
  const lead = paragraphs[0];
  const bodyParagraphs = paragraphs.slice(1);
  const note = settings.aboutNote || null;
  const chips = settings.aboutFocusChips ?? [];

  // CMS with fallbacks to the previous literals (About-C), same blank-to-fallback
  // pattern as the Hero role label and scroll cue.
  const subtext = settings.aboutSubtext?.trim()
    ? settings.aboutSubtext
    : "Eight years turning rough ideas into products people actually use.";
  const photoCaption = settings.aboutPhotoCaption?.trim()
    ? settings.aboutPhotoCaption
    : "off the clock, painting under a tree";

  return (
    <RevealSection
      id="about"
      className="scroll-mt-20 overflow-hidden py-0! px-0!"
    >
      {/* ⚠ `lg`, NOT `md` — THE SITE GOES MOBILE AT ONE BREAKPOINT AND THIS WAS ONE OF FOUR PLACES
          THAT DID NOT. At 820px (iPad Air portrait) the nav was a hamburger and the work grid was
          one column, while this block was already two — a 340px column beside a 400px one under a
          mobile menu. Measured, not inferred. See ExperienceSection, SkillsBody and ProcessSection
          for the other three. */}
      <div className="grid grid-cols-1 lg:grid-cols-[.92fr_1.08fr] items-stretch">

        {/* Photo column */}
        <div className="ab-photo min-h-[520px] reveal-card">
          <div className="ab-img">
            {settings.photo ? (
              <Image
                src={settings.photo}
                alt="Portrait of Akshita"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1023px) 100vw, 46vw"
              />
            ) : (
              <ImagePlaceholder label="900 × 1200" />
            )}
          </div>
          {settings.photo && <div className="ab-tint" aria-hidden="true" />}
          <div className="ab-hint" aria-hidden="true">hover &#8594;</div>
          <div className="ab-cap">{photoCaption}</div>
        </div>

        {/* Bio column */}
        <div
          className="flex flex-col justify-start reveal-card"
          style={{ padding: "48px 44px" }}
        >

          <SheetSectionHead
            sheet="03"
            title="About"
            mark="Drawn by"
            lede={subtext}
          />

          <div className="mt-8 sm:mt-[52px] flex flex-col gap-5">
          {lead && (
            <p
              className="font-display italic"
              style={{ fontSize: "27px", lineHeight: "1.3", letterSpacing: "var(--tracking-snug)" }}
            >
              {lead}
            </p>
          )}

          {bodyParagraphs.map((para, i) => (
            <p
              key={i}
              className="max-w-[50ch]"
              style={{ fontSize: "15px", lineHeight: "1.62", color: "var(--color-text-body)" }}
            >
              {renderWithBold(para)}
            </p>
          ))}

          {note && (
            <p
              className="font-display italic text-accent max-w-[44ch]"
              style={{ fontSize: "16px", lineHeight: "1.45" }}
            >
              {note}
            </p>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap mt-[6px]" style={{ gap: "8px" }}>
              {chips.map((chip, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "12px",
                    /* ⚠ WAS THE HARDCODED `#5F584E`, WHICH NO ROLE NAMED AND WHICH CANNOT REMAP —
                       2.39 against a 4.5 floor on a dark ground, across all four chips.
                       `text-secondary`'s stated job is "supporting text — meta lines, captions,
                       labels", and a skills chip is a label: THE RIGHT ROLE THAT HAPPENS TO BE 10.0
                       AWAY, not the nearest token dressed up as one. Were it merely nearest, 10.0
                       would be a reason to refuse, as it has been twice in this arc.
                       Light side improves on every palette — +0.62 / +0.33 / +0.40 / +1.93 / +1.72 /
                       +1.77 — so the visible change is a repair with a side effect in the right
                       direction rather than a trade. */
                    color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-cream-200)",
                    border: "1px solid color-mix(in srgb, var(--color-rule) 16%, transparent)",
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
