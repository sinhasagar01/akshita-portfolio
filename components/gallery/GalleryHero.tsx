import Image from "next/image";
import Link from "next/link";
import { galleryCounts, type GalleryItem } from "@/lib/studio/gallery-format";

// The /gallery hero — pill, headline, dek, two actions, the fanned strip, and the fact row on its
// hairline. Scope ENDS at that hairline; the filter row, masonry and lightbox below are the
// existing page.
//
// ---- ⚠ ONE COMPONENT, BOTH STATES, AND THAT IS THE WHOLE STRUCTURAL CLAIM ---------------------
//
// The collection is empty or nearly so, and the empty rendering is what ships. It is NOT a second
// component and NOT an early return to a different layout: the same markup runs, and the only
// things that change are that the frames carry no image and the figures read zero. A hero that
// changes SHAPE on the first upload is two designs, and this repository already carries one page
// that grew a second layout exactly that way.
//
// ---- ⚠ THREE ELEMENTS THE CONTRACT DRAWS ARE ABSENT, FOR ONE REASON --------------------------
//
// The mock carries a date chip reading `latest 2025 · earliest 2022`, a year label on each frame,
// and calls the strip "the five most recent". NONE of the three ships, because THE GALLERY SCHEMA
// HAS NO DATE OF ANY KIND — `title, kind, image, width, height, alt, description, tags, caseStudy,
// orderIndex` and nothing else, with `validateGalleryEntry` refusing unknown keys.
//
// ⚠ AND THE DATA IS NOT MERELY MISSING, IT IS DESTROYED. `upload-block-image` runs
// `sharp(input)…webp()…toBuffer()` with no `.withMetadata()`, so EXIF — including
// `DateTimeOriginal` — is stripped at upload, irreversibly, for every image the studio has ever
// accepted. A git commit date answers a different question (when it was uploaded, not when it was
// made) and a four-digit tag is a heuristic over a freeform field. There is no source, so there is
// no chip, and inventing a range is the thing this record keeps deleting.
//
// ---- ⚠ THE STRIP IS THE FIRST FIVE IN AUTHOR ORDER. IT IS NOT "RECENT" -----------------------
//
// `orderIndex` is a curated position set by dragging rows in /studio, and `getGalleryItems` sorts
// it ascending and says "in author order" where it does. It carries NO time information. Writing
// "the five most recent" in this comment would be prose describing behaviour the code does not
// have, which is a shape this arc has found four separate times — every one written by the author
// of the code, in the same sitting, believing it.
//
// ---- ⚠ THE FRAMES ARE DECORATIVE AND OUT OF THE TAB ORDER ------------------------------------
//
// Every frame is repeated in the masonry directly below, where it already opens the lightbox with a
// composed accessible name. Linking them would give the same five items TWO TAB STOPS AND TWO
// DIFFERENT NAMES EACH, for no new destination — a cost paid by exactly the readers who can least
// afford it. So they are `aria-hidden`, they are not focusable, they carry no per-frame hover, and
// the real affordance sits directly above them.

/** The headline, held as PARTS rather than as a string with an italic word parsed back out of it.
 *  One accent word is a structural fact about the sentence; recovering it from prose at render
 *  time would make the copy and its emphasis two claims that can disagree. */
const HEADLINE = { lead: "Things I made", tail: "that aren't ", accent: "work" };

const DEK =
  "Photographs, drawings, and the odd product study that never became a case study. Mostly taken before 7am or after midnight.";

/**
 * The five frame boxes, fanned. Fixed pixel sizes because the rotation and the overlap are
 * composed against each other — a fluid strip would fan differently at every width and the
 * arrangement is the design.
 *
 * ⚠ `sizes` IS A FIXED PIXEL VALUE AND THAT IS THE WHOLE OPTIMISATION. The browser picks its source
 * from `sizes`, never from the rendered box, so reusing the masonry's `(max-width: 1023px) 50vw,
 * 25vw` here would fetch `w=640` for a 168px frame — measured at 17,443 bytes against 8,094 for
 * `w=384`, five times over, 45.7 KB above the fold for pixels nothing can display.
 */
const FRAMES = [
  { w: 118, h: 148, rotate: -4, lift: 8 },
  { w: 168, h: 116, rotate: 1.5, lift: -2 },
  { w: 132, h: 166, rotate: -1, lift: -8 },
  { w: 162, h: 112, rotate: 3, lift: 6 },
  { w: 116, h: 146, rotate: -2.5, lift: 2 },
] as const;

/** Reader-facing plurals for the fact row. The filter chips carry their own labels for the reason
 *  `GalleryBrowser` states — two surfaces are free to word three buckets differently — but the
 *  NUMBERS come from one derivation, so the two can never disagree about the collection. */
const FACTS: readonly { key: "all" | "photo" | "illus" | "proj"; one: string; many: string }[] = [
  { key: "all", one: "piece", many: "pieces" },
  { key: "photo", one: "photograph", many: "photographs" },
  { key: "illus", one: "drawing", many: "drawings" },
  { key: "proj", one: "study", many: "studies" },
];

export default function GalleryHero({ items }: { items: readonly GalleryItem[] }) {
  const { shown, all, byKind } = galleryCounts(items);
  const strip = shown.slice(0, FRAMES.length);

  /* ⚠ `pt-32` AND NOT `pt-16`, WHICH IS A MEASUREMENT RATHER THAN A PREFERENCE. The masthead this
     replaces began at 64px, and the fixed nav's glass pill runs 18 to 88 — so the pill eyebrow sat
     24px UNDER the nav, unreadable, on every load. It was invisible to every gate here: the nav is
     `position: fixed` and the hero is in flow, so no cascade walk and no source check can see two
     boxes overlap. The case study clears at 164 and this clears at 128. Only the render found it,
     which is what the render step is for. */
  return (
    <header className="gallery-hero relative isolate overflow-hidden pt-32 text-center">
      {/* The accent wash. `aria-hidden` and pointer-transparent — it is a ground, not content. */}
      <div aria-hidden className="gallery-hero-glow" />

      <div className="relative z-[2] mx-auto max-w-[980px] px-[30px]">
        {/* ⚠ A STANDALONE TRACKED-CAPS EYEBROW IN A PILL IS THE CONSTRUCTION THIS DIRECTION RETIRES
            BY NAME, and it is the last one on the public site. It also carried a fifth mono size
            (9.5px) and a fourth tracking value (0.26em) against a vocabulary of three sizes and one
            tracking — the erosion `globals.css` predicts in the mono block's own comment.
            The dot was an accent use with no job beside it; the rule's object line does that work. */}
        <div className="sheet-rule">
          <span className="sheet-mark-text">Gallery</span>
          <span className="sheet-rule-line" aria-hidden="true" />
          <span className="sheet-mark-text">A record of looking</span>
        </div>

        {/* ⚠ NO FAMILY OR WEIGHT UTILITY HERE. The unlayered `h1, h2` reset sets both and beats
            anything in `@layer utilities`, so either would be inert — the gallery masthead this
            replaces carried the same note. The 600 comes from `.gallery-hero-title`, which is
            unlayered for exactly that reason. Leading and tracking ARE utilities because those two
            properties were lifted into `@layer base` by #350's sequence and a utility now wins. */}
        <h1 className="gallery-hero-title mt-[26px] text-[clamp(2.375rem,6vw,5.25rem)] leading-[0.94] tracking-[-0.052em] text-text-primary">
          {HEADLINE.lead}
          <br />
          {HEADLINE.tail}
          {/* ⚠ UPRIGHT AND IN INK, WHICH IS TWO RULINGS AT ONCE. The slant is the retired device,
              and the accent was a FIFTH use — the direction sanctions it for the current floor, the
              readout figures, the outcome column and the resume control, and a headline word is
              none of them. The accent has not left the hero: it moved to the fact row below, where
              a readout figure is one of the four. The `<em>` stays because the emphasis is real
              markup; only its treatment changes. */}
          <em className="font-medium not-italic">{HEADLINE.accent}</em>.
        </h1>

        {/* ⚠ `text-lead`, WHICH IS WHAT THE MASTHEAD THIS REPLACES USED — and moving it to the
            quieter role to match the mock's `--subtle` MEASURED 3.79 TO 4.17 ON THE FIVE LIGHT
            PALETTES, under the 4.5 floor. The cause is this hero's own glow: the wash darkens the
            ground directly under the copy, so the dek sits on 228,205,187 where the fact row 300px
            below sits on 237,227,213 and the SAME quiet role clears there at 4.56. A role that
            passes in one band of a page and fails in another is the ground being local, which is
            why the pair is measured from the paint rather than from the token. */}
        <p className="mx-auto mt-[22px] max-w-[54ch] text-base leading-[1.62] text-text-lead">
          {DEK}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-[11px]">
          {/* ⚠ BOTH CONTROLS LOSE THEIR CAPSULE, on the nav ruling that squared every control on the
              site. The accent fill stays on the primary — a page's single primary action is the
              resume control's precedent, which is one of the direction's four sanctioned uses. */}
          {/* ⚠ AN ANCHOR TO A FRAGMENT, NOT A SCROLL HANDLER. The target is the grid below; a
              handler would need the client boundary and would break for a reader who opens it in a
              new tab. The browser's own fragment navigation already honours reduced motion. */}
          {/* ⚠ NO COLOUR UTILITY ON EITHER — THEY ARE ANCHORS, AND `a { color: inherit }` IS
              UNLAYERED, so a `text-*` class here draws nothing. `cascade-public` C1 caught exactly
              that: both shipped with one and the public collision census went 4 to 7. The colours
              are asserted unlayered in `globals.css` beside this note's other half. */}
          <a
            href="#gallery-grid"
            className="gallery-hero-cta inline-flex items-center gap-2 bg-accent px-5 py-3 text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            Browse everything <span aria-hidden>↓</span>
          </a>
          <Link
            href="/#work"
            className="gallery-hero-cta-ghost inline-flex items-center gap-2 border border-etch/8 px-5 py-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            See the work instead <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>

      {/* ⚠ THE STRIP IS ENTIRELY `aria-hidden`, INCLUDING ITS PLACEHOLDERS. A screen reader hearing
          five empty frames announced would learn nothing the fact row does not say in words. */}
      <div aria-hidden className="gallery-hero-strip relative z-[1] mt-10 flex min-h-[186px] items-center justify-center gap-3 px-[30px] pb-1.5">
        {FRAMES.map((f, i) => {
          const item = strip[i];
          return (
            <span
              key={i}
              className={`gallery-hero-frame relative block flex-none overflow-hidden border bg-surface-well ${
                item ? "border-etch/8" : "gallery-hero-frame--empty border-dashed border-etch/8"
              }`}
              style={{
                width: `${f.w}px`,
                height: `${f.h}px`,
                /* ⚠ THE REST ROTATION IS A STATIC TRANSFORM AND NOT MOTION, so it is not gated on
                   `prefers-reduced-motion` — nothing animates into it and nothing animates out of
                   it unless the reader hovers. The STRAIGHTENING is the motion, and it lives in
                   the stylesheet behind a `no-preference` query. */
                ["--f-rotate" as string]: `${f.rotate}deg`,
                ["--f-lift" as string]: `${f.lift}px`,
              }}
            >
              {item ? (
                <Image
                  src={item.image as string}
                  alt=""
                  fill
                  /* ⚠ FIXED PIXELS. See `FRAMES` above — the browser reads this and never the box,
                     so a vw-based value here fetches masonry-width bytes for a 168px frame. */
                  sizes="170px"
                  className="object-cover"
                />
              ) : null}
            </span>
          );
        })}
      </div>

      {/* ⚠ THE FACT ROW BECOMES `.sheet-readout`, AND IT IS THAT DEVICE'S FIRST CONSUMER. The
          device was declared with the grammar and had zero consumers until now — a 2px accent rule
          above, a hairline below, and equal columns divided by hairlines. A count of what is in the
          collection is exactly the readout it was drawn for.

          ⚠ AND THIS IS WHERE THE HEADLINE'S ACCENT WENT. `.sheet-readout-value` paints
          `--color-accent`, which is one of the direction's four sanctioned uses, so the hero keeps
          its one accent and moves it from a decorative word to a figure that means something. */}
      <div className="sheet-readout relative z-[2] mx-auto mt-[26px] max-w-[980px] px-[30px]">
        {FACTS.map((f) => {
          const n = f.key === "all" ? all : byKind[f.key] ?? 0;
          return (
            <div key={f.key}>
              {/* ⚠ THE ZERO IS QUIETER AND STILL PRESENT. A hidden figure would make "are there any
                  drawings" answerable only by noticing an absence, which is the one thing a reader
                  cannot do — the same argument `GalleryBrowser` records for its zero chips. */}
              {/* ⚠ THE ZERO KEEPS ITS QUIETER INK, WHICH IS WHY THE COLOUR IS STILL STATED. The
                  device paints every figure in the accent; a zero in the accent would advertise an
                  empty bucket as loudly as a full one, and the note above records why the zero is
                  shown at all rather than hidden. */}
              <b className={`sheet-readout-value block${n === 0 ? " text-text-subtle" : ""}`}>{n}</b>
              <span className="sheet-readout-key sheet-mono-micro block">
                {n === 1 ? f.one : f.many}
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
