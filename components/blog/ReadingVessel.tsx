"use client";

// The reading indicator — a fixed corner form above 1200px and a docked bar at or below it, BOTH
// ALWAYS ON. It fills as you read.
//
// R1 — Lenis cooperation BY CONSTRUCTION. `--read` is driven by a GSAP ScrollTrigger,
// not a raw `scrollY` listener. GSAPProvider calls ScrollTrigger.update() on every
// `lenis.on("scroll")`, so ScrollTrigger is already synced to Lenis' smooth scroll —
// the same mechanism ProcessSection/BeforeAfterStory use. A raw listener would lag it.
//
// ⚠ R2 IS REVERSED, AND THE REASON IT EXISTED IS GONE. It read: SMIL is dropped under reduced
// motion, the wave wobble is an SVG <animate> inside feTurbulence, the global CSS `animation`
// reset cannot stop SMIL, so under reduced motion this component renders NOTHING. Correct while
// the wobble existed. THE WOBBLE IS REMOVED, so there is no SMIL to escape the reset.
//
// A PROGRESS INDICATOR THAT DISAPPEARS UNDER REDUCED MOTION IS A DIFFERENT DEFECT FROM AN
// ANIMATION THAT STOPS. Reduced motion asks for less movement, not less information — and a fill
// tracking scroll position is a DIRECT RESPONSE to input rather than an animation, the same class
// as a scrollbar. So it renders statically now: same fill, same meniscus, no wobble, and `--read`
// still tracks. The animated decorative layers stay covered by the CSS reduce block.
//
// ⚠ THE WATERLINE CROSSES A LABEL AT SOME FILL, AND THAT IS A PROPERTY RATHER THAN A DEFECT. The
// fill is CONTINUOUS and the body's rows are FIXED, so on every article there is a percentage at
// which the meniscus lands on a label rather than between rows. Measured at 73%: it sits on
// "READING TIME" and washes the label out. Changing the row rhythm changes WHICH percentage, not
// whether — and the body text sitting under the fill is the design, not an accident of it.
//
// ⚠ THE ONE THING THAT WOULD ACTUALLY CHANGE IT IS A WATERLINE THAT DOES NOT CROSS TEXT — a fill
// that runs beside the body rather than behind it, or a rail rather than a vessel. THAT IS A
// DIFFERENT COMPONENT, and saying so is what stops this being reopened as a tuning question.
//
// ⚠ AND IT IS NOT NEW FROM ALWAYS-ON. The old gate showed the vessel at 73% too. Always-on made the
// state REACHABLE ON EVERY ARTICLE rather than created it — the third time in this arc a change has
// revealed rather than caused, after the heading hierarchy and the Fosfor raster.
//
// Identical on cream and basalt, which is what places it in geometry rather than in colour: the lime
// waterline is louder than the amber one and both cross the same label at the same fill.
//
// ⚠ ALWAYS ON. The scroll gate and the reveal state are gone, which is the point of the change —
// the component is now visible in ONE state rather than three, so a sweep can see it and its
// colour is readable without catching it mid-reveal.
//
// The vessel is aria-hidden: it is a decorative progress affordance whose metadata is
// already announced in the semantic article header, so it must not double up for AT.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { formatLongDate, formatCapsuleDate } from "@/lib/blog/format";
import LoveButton from "./LoveButton";

const WAVE_PATH_A =
  "M0,7 C25,2 75,2 100,7 C125,12 175,12 200,7 C225,2 275,2 300,7 C325,12 375,12 400,7 L400,13 L0,13 Z";
const WAVE_PATH_B =
  "M0,9 C25,3 75,3 100,9 C125,15 175,15 200,9 C225,3 275,3 300,9 C325,15 375,15 400,9 L400,16 L0,16 Z";

export default function ReadingVessel({
  slug,
  date,
  readingTime,
  topic,
}: {
  slug: string;
  date: string;
  readingTime: number;
  topic: string;
}) {
  const [read, setRead] = useState(0);
  const readRef = useRef(0);

  /* ⚠ THE CORNER IS TAKEN, SO THE ASIDE YIELDS WHILE THE NAV SHEET IS OPEN. Measured: the sheet is
     197x272 at top 68 with z-index 44, and the aside is 216 wide at top 132 with z-index 40 — they
     overlap by roughly 183x208 at 1440 and again at 1280, and the sheet wins. Always-on makes that
     permanent rather than incidental.

     ⚠ UNMOUNTED, NOT FADED, AND ONLY ONE OF PublishBar's TWO REASONS TRANSFERS. Its comment cites a
     clickable pill under a zero-opacity wrapper and the tab order; this element is `aria-hidden` and
     holds no control, so neither applies directly. The reason that does: a zero-opacity element
     still COMPOSITES, and this component's whole history is compositing nobody could read from
     source. Unmount and the question does not arise.

     ⚠ AND IT OBSERVES THE SHEET RATHER THAN SUBSCRIBING TO A PROVIDER. The studio's
     `useReportOccluding` is studio-only, and building a public equivalent would be shared plumbing
     for ONE consumer — the shape this repo refuses. `#nav-sheet` carries `is-open`, so the thing
     that occludes is watched directly. */
  const [occluded, setOccluded] = useState(false);
  useEffect(() => {
    const sheet = document.getElementById("nav-sheet");
    if (!sheet) return;
    const sync = () => setOccluded(sheet.classList.contains("is-open"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(sheet, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        // Avoid churn from sub-pixel updates.
        if (Math.abs(p - readRef.current) > 0.0005) {
          readRef.current = p;
          setRead(p);
        }
      },
    });
    ScrollTrigger.refresh();
    return () => st.kill();
  }, []);

  const style = { "--read": read } as CSSProperties;
  const pct = Math.round(read * 100);

  return (
    <>
      {/* ⚠ THE ASIDE ONLY. The docked form is bottom-anchored at y828 and the sheet is top-anchored
          at y68 to y340, so they cannot intersect at any width — the yield is a no-op there by
          GEOMETRY rather than by a breakpoint, and `reading-indicator` asserts exactly that. */}
      {occluded ? null : (
      <aside className="blog-vessel is-on" style={style} aria-hidden="true">
        <div className="blog-liquid">
          <div className="blog-smoke" />
          <div className="blog-wave is-b">
            <svg viewBox="0 0 400 16" preserveAspectRatio="none">
              <path fill="color-mix(in srgb, var(--color-smoke-4) 55%, transparent)" d={WAVE_PATH_B} />
            </svg>
          </div>
          <div className="blog-wave is-a">
            <svg viewBox="0 0 400 13" preserveAspectRatio="none">
              <path fill="color-mix(in srgb, var(--color-vessel-wave) 85%, transparent)" d={WAVE_PATH_A} />
            </svg>
          </div>
          <div className="blog-glint" />
          <div className="blog-waterline" />
          <span className="blog-bub" />
          <span className="blog-bub" />
          <span className="blog-bub" />
        </div>
        <div className="blog-vessel-body">
          <span className="blog-lbl">Published</span>
          <p className="blog-val">{formatLongDate(date)}</p>
          <span className="blog-lbl">Reading time</span>
          <p className="blog-val">{readingTime} min</p>
          {topic ? (
            <>
              <span className="blog-lbl">Topic</span>
              <p className="blog-val">{topic}</p>
            </>
          ) : null}
          <div className="blog-sep" />
          <span className="blog-lbl">Loved by</span>
          <div className="mt-2">
            {/* A READOUT, not a control. This container is aria-hidden and fixed-position;
                see LoveButton's header for why nothing focusable may live in here. */}
            <LoveButton slug={slug} variant="readout" />
          </div>
          <p className="blog-pct">{pct}% read</p>
        </div>
      </aside>
      )}

      <div className="blog-docked is-on" style={style} aria-hidden="true">
        <div className="blog-capsule">
          <div className="blog-bead" />
          <div className="blog-cap-body">
            <p className="blog-meta-row">
              <span>{formatCapsuleDate(date)}</span>
              <span>{readingTime} min</span>
            </p>
            <div className="blog-cap-right">
              {/* THE REFLOW RISK: margin-left:auto, so the number's width slides this
                  whole group. Count reserves 3ch and uses tabular-nums for that reason. */}
              <LoveButton slug={slug} variant="readout" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
