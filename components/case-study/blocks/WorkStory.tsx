"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import type { Feature } from "@/lib/case-studies/types";
import { renderRich } from "../rich";
import SheetStamp from "../SheetStamp";
import { BEZEL_W, BEZEL_H, SCREEN_BG, clamp, lerp, eIO, unitGeo, EDGE } from "./deviceScroller";
import { EDIT_AFFORD, inlineEditProps } from "../editable";
import bezel from "@/public/work/boat-crest/scroll-assets/phone-frame-bezel.png";

/* Auto-playing pinned story (cs-07) — 1:1 port of docs/case-study-page/
   work-pinned-autoscroll.html. One frame cycles the five features on a single rAF
   timer (dwell 5s, entrance 0.85s, loops 05→01). Each screen is the genuine device
   bezel with the app body auto-scrolling inside it during the dwell behind a fixed
   status bar + bottom bar. Hover never pauses; arrows / ←→ skip one feature with the
   full entrance and autoplay continues from there. Started on scroll-in via
   IntersectionObserver. prefers-reduced-motion → instant, rest at top, arrows work. */

const ENT = 850;
const DWELL = 5000;
const CYCLE = ENT + DWELL;

const eE = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)); // easeOutExpo (phone)
const eC = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic (copy)

const HAIRLINE = "color-mix(in oklch, var(--color-ink-950) 12%, transparent)";
const ARROW_BORDER = "color-mix(in oklch, var(--color-ink-950) 16%, transparent)";
const PHONE_W = { desktop: 220, mobile: 188 };

export default function WorkStory({
  features,
  editable = false,
  blockIndex,
}: {
  features: Feature[];
  /* ⚠ ACCEPTED SO THE CANVAS CAN RENDER THIS THE WAY THE PUBLIC PAGE DOES. This component took
     neither prop, which is why a story block could never appear in an editable canvas — parity was
     unreachable by construction rather than by defect. `inlineEditProps` returns {} when `editable`
     is false, so the PUBLIC render is byte-identical and the DOM diff proves it. */
  editable?: boolean;
  blockIndex?: number;
}) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [mobile, setMobile] = useState(false);

  const phoneW = mobile ? PHONE_W.mobile : PHONE_W.desktop;
  const phoneH = (phoneW * BEZEL_H) / BEZEL_W;
  const edgeH = Math.round((phoneH * 24) / 462);
  const geos = useMemo(() => features.map((f) => unitGeo(phoneW, f.screen)), [features, phoneW]);

  const rootRef = useRef<HTMLDivElement>(null);
  const unitRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const titleInnerRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const geoRef = useRef(geos);
  geoRef.current = geos;

  const iRef = useRef(0);
  const prevRef = useRef(0);
  const elRef = useRef(0);
  const lastRef = useRef(0);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const inViewRef = useRef(false);
  const mRef = useRef(false);
  const manualRef = useRef<(dir: number) => void>(() => {});

  const n = features.length;

  useEffect(() => {
    const reduced = reduce === true;
    const isM = window.matchMedia("(max-width: 1023px)").matches;
    mRef.current = isM;
    setMobile(isM);

    const setLine = (el: HTMLElement | null, onset: number, clip: boolean, eP: number) => {
      if (!el) return;
      const lp = clamp((eP - onset) / 0.6);
      const te = eC(lp);
      if (clip) {
        el.style.transform = `translateY(${lerp(108, 0, te)}%)`;
        el.style.opacity = "1";
      } else {
        el.style.opacity = String(lp);
        el.style.transform = `translateY(${lerp(14, 0, te)}px)`;
      }
    };

    const paint = (i: number, eP: number, pP: number, sp: number) => {
      const prev = prevRef.current;
      const enter = eE(eP);
      const m = mRef.current;

      unitRefs.current.forEach((el, k) => {
        if (!el) return;
        if (k === i) {
          el.style.opacity = String(clamp(eP / 0.5));
          el.style.transform = `translateY(${lerp(m ? 28 : 46, 0, enter)}px) scale(${lerp(m ? 0.96 : 0.95, 1, enter)})`;
          el.style.filter = m ? "none" : `blur(${lerp(6, 0, clamp(eP / 0.65))}px)`;
          el.style.zIndex = "2";
          const c = contentRefs.current[k];
          const g = geoRef.current[k];
          if (c && g.scrollable) c.style.transform = `translateY(${-sp * g.scrollPct * 100}%)`;
        } else if (k === prev) {
          el.style.opacity = String(1 - clamp(eP / 0.4));
          el.style.transform = `translateY(${lerp(0, -26, enter)}px) scale(${lerp(1, 0.97, enter)})`;
          el.style.filter = "none";
          el.style.zIndex = "1";
        } else {
          el.style.opacity = "0";
          el.style.zIndex = "0";
        }
      });

      /* ⚠ THE `translateY(-50%)` IS GONE WITH THE ELEMENT THAT NEEDED IT. It compensated a `top: 50%`
         on the old 20rem ghost numeral; the stamp that replaced it is placed by its own corner, so
         carrying the translate forward would lift it half its height off the top edge. The fade and
         the scale are the entrance and they stay. A transform written against one element and applied
         to its replacement is the wrong-subject shape arriving in an imperative handler, where no
         gate reads it. */
      if (ghostRef.current) {
        ghostRef.current.style.opacity = String(clamp(eP / 0.6));
        ghostRef.current.style.transform = `scale(${lerp(0.92, 1, enter)})`;
      }

      setLine(numRef.current, 0, false, eP);
      setLine(catRef.current, 0.1, false, eP);
      setLine(titleInnerRef.current, 0.16, true, eP);
      setLine(descRef.current, 0.28, false, eP);

      fillRefs.current.forEach((fl, k) => {
        if (fl) fl.style.transform = `scaleX(${clamp(i + pP - k)})`;
      });
      dotRefs.current.forEach((d, k) => {
        if (d) d.style.color = k <= i ? "var(--color-accent)" : "var(--color-text-subtle)";
      });
    };

    const advance = (dir: number) => {
      prevRef.current = iRef.current;
      iRef.current = (iRef.current + dir + n) % n;
      elRef.current = 0;
      setCurrent(iRef.current);
    };

    const frame = (now: number) => {
      const dt = now - lastRef.current;
      lastRef.current = now;
      elRef.current += dt;
      const el = elRef.current;
      paint(iRef.current, clamp(el / ENT), clamp(el / CYCLE), eIO(clamp((el - ENT) / DWELL)));
      if (el >= CYCLE) advance(1);
      rafRef.current = requestAnimationFrame(frame);
    };

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(frame);
    };
    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };

    const manual = (dir: number) => {
      advance(dir);
      if (reduced) paint(iRef.current, 1, 0, 0); // instant under reduced motion
    };
    manualRef.current = manual;

    // initial: entrance-start (invisible) so the rise plays on scroll-in; reduced → resting at top
    paint(iRef.current, reduced ? 1 : 0, 0, 0);

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          if (!reduced) start();
        } else {
          stop();
        }
      },
      { threshold: 0.25 },
    );
    if (rootRef.current) io.observe(rootRef.current);

    const onKey = (e: KeyboardEvent) => {
      if (!inViewRef.current) return;
      if (e.key === "ArrowRight") manual(1);
      else if (e.key === "ArrowLeft") manual(-1);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("keydown", onKey);
    };
  }, [reduce, n]);

  const f = features[current];

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-[1000px]">
      {/* Stage */}
      <div className="relative flex flex-col items-center gap-8 lg:min-h-[470px] lg:flex-row lg:items-center lg:gap-9">
        {/* ⚠ THE 20rem GHOST NUMERAL BECOMES A STAMP, AND ITS ENTRANCE TRANSFORM HAD TO CHANGE WITH
            IT. The scroll handler wrote `translateY(-50%) scale(…)`, where the translate existed only
            because the old numeral was `top: 50%` and had to be pulled back by half its own height. A
            corner stamp is placed by its corner, so carrying that translate forward would have lifted
            it half its height off the top edge — a transform that was correct for the element it was
            written against and wrong for the one that replaced it. The scale and the fade stay; see
            the handler. */}
        <SheetStamp text={f.index} corner="tr" elementRef={ghostRef} />

        {/* copy */}
        <div className="relative z-[2] w-full max-w-[430px] lg:flex-1">
          {/* ⚠ A LABEL WEARING A HEADING'S CLOTHES. `Feature 01` is not a title — it names which of
              the five you are looking at, which is the mono label register's whole job. It was the
              display face at 19px in the accent, and a running index is none of the direction's four
              sanctioned accent uses. The `numRef` handle is untouched: GSAP animates this element
              by ref, so the class change cannot reach the animation. */}
          <div ref={numRef} className="sheet-mono-label">
            Feature {f.index}
          </div>
          <div
            ref={catRef}
            {...inlineEditProps(editable, blockIndex, `features.${current}.category`, "Edit category")}
            className={
              "text-eyebrow tracking-[0.18em] uppercase font-semibold text-accent mt-2" +
              (editable ? EDIT_AFFORD : "")
            }
          >
            {f.category}
          </div>
          <h3 className="overflow-hidden pt-1 mt-2">
            <span
              ref={titleInnerRef}
              {...inlineEditProps(editable, blockIndex, `features.${current}.title`, "Edit title")}
              className={
                "block font-display text-2xl text-text-primary leading-[1.07]" +
                (editable ? EDIT_AFFORD : "")
              }
            >
              {f.title}
            </span>
          </h3>
          <p
            ref={descRef}
            {...inlineEditProps(editable, blockIndex, `features.${current}.body`, "Edit feature body", true)}
            className={
              "text-[1rem] text-text-secondary leading-[1.62] mt-3.5" + (editable ? EDIT_AFFORD : "")
            }
          >
            {renderRich(f.body)}
          </p>
        </div>

        {/* phone — five stacked three-layer units; the bezel is the only device edge (no shadow) */}
        {/* ⚠ THIS COMPOSITE IS DELIBERATELY NOT PREVIEWABLE, and the reason is what it IS rather
            than an oversight. It is `aria-hidden`, five units stacked at `opacity: 0` with one
            revealed by scroll position, and each unit's "image" is a long strip that moves behind
            a bezel window. A click would have to guess which unit is live, and the file it opened
            would be a 3000px scroll strip the page never shows whole — a DIFFERENT image, not a
            larger one. `BeforeAfterStory`'s still `before` panel previews for the same reason
            inverted: it is one screenshot, shown entire.

            The line is: an inspectable STILL gets a preview; a depicted device in MOTION does
            not. If these screens are ever wanted at full size they want a still of their own,
            which is content rather than a flag. */}
        <div aria-hidden="true" className="relative z-[1] shrink-0" style={{ width: phoneW, height: phoneH }}>
          {features.map((feat, k) => {
            const g = geos[k];
            return (
              <div
                key={k}
                ref={(el) => {
                  unitRefs.current[k] = el;
                }}
                className="absolute inset-0"
                style={{ opacity: 0 }}
              >
                {feat.screen && "body" in feat.screen && g.scrollable ? (
                  <>
                    {/* .win — scrolling body + iOS scroll-edge blur */}
                    <div
                      style={{
                        position: "absolute",
                        left: g.win.left,
                        top: g.win.top,
                        width: g.win.width,
                        height: g.win.height,
                        overflow: "hidden",
                        background: SCREEN_BG,
                        zIndex: 1,
                      }}
                    >
                      <div
                        ref={(el) => {
                          contentRefs.current[k] = el;
                        }}
                        style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
                      >
                        <Image
                          src={feat.screen.body.src}
                          alt={feat.screen.body.alt}
                          width={feat.screen.body.intrinsicWidth}
                          height={feat.screen.body.intrinsicHeight}
                          sizes={`${Math.round(g.win.width)}px`}
                          className="block h-auto w-full"
                        />
                      </div>
                      <div style={EDGE("t", edgeH)} />
                      <div style={EDGE("b", edgeH)} />
                    </div>
                    {/* .footer — pinned bottom bar */}
                    <div
                      style={{
                        position: "absolute",
                        left: g.footer.left,
                        top: g.footer.top,
                        width: g.footer.width,
                        height: g.footer.height,
                        overflow: "hidden",
                        background: SCREEN_BG,
                        zIndex: 2,
                        borderRadius: `0 0 ${g.radius}px ${g.radius}px`,
                      }}
                    >
                      <Image
                        src={feat.screen.footer.src}
                        alt={feat.screen.footer.alt}
                        width={feat.screen.footer.intrinsicWidth}
                        height={feat.screen.footer.intrinsicHeight}
                        sizes={`${Math.round(g.footer.width)}px`}
                        className="absolute bottom-0 left-0 block h-auto w-full"
                      />
                    </div>
                    {/* .frame — bezel overlay (status bar, notch, curved edge) */}
                    <Image
                      src={bezel}
                      alt=""
                      sizes={`${phoneW}px`}
                      className="absolute inset-0 h-auto w-full"
                      style={{ zIndex: 3, pointerEvents: "none" }}
                    />
                  </>
                ) : feat.screen && "full" in feat.screen ? (
                  // onboarding — single static screen, no scroll
                  <Image
                    src={feat.screen.full.src}
                    alt={feat.screen.full.alt}
                    width={feat.screen.full.intrinsicWidth}
                    height={feat.screen.full.intrinsicHeight}
                    sizes={`${phoneW}px`}
                    className="absolute inset-0 h-auto w-full"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Journey rail. Cumulative progress (segments before `current` filled, dots lit
          up to `current`) is driven by React so it always shows; paint() only animates
          the active segment's countdown on top. */}
      <div aria-hidden="true" className="mt-8 flex items-center">
        {features.map((feat, k) => (
          <Fragment key={k}>
            {k > 0 && (
              <span className="relative h-0.5 flex-1 overflow-hidden" style={{ background: HAIRLINE }}>
                <span
                  ref={(el) => {
                    fillRefs.current[k - 1] = el;
                  }}
                  className="absolute inset-0 origin-left bg-accent"
                  style={{ transform: `scaleX(${k - 1 < current ? 1 : 0})` }}
                />
              </span>
            )}
            <span
              ref={(el) => {
                dotRefs.current[k] = el;
              }}
              /* ⚠ THIS ONE KEEPS ITS ACCENT AND THE OTHER FIVE DO NOT, WHICH IS THE BUDGET RATHER
                 THAN AN EXEMPTION. The inline colour is STATE — accent up to the current feature,
                 quiet beyond it — and "the current floor" is the first of the direction's four
                 sanctioned accent uses. #627 kept the stepper's active stage label on the same
                 argument.

                 ⚠ SO `sheet-mono-micro`'s OWN COLOUR NEVER APPLIES HERE, DELIBERATELY. An inline
                 style outranks the class, which makes one third of that class inert at this site —
                 overridden on purpose rather than dead by accident, and worth writing down because
                 the two are indistinguishable from a computed value. */
              className="w-[34px] text-center sheet-mono-micro"
              style={{ color: k <= current ? "var(--color-accent)" : "var(--color-text-subtle)" }}
            >
              {feat.index}
            </span>
          </Fragment>
        ))}
      </div>

      {/* Controls — centered, bracketing the status */}
      <div className="mt-4 flex items-center justify-center gap-3.5">
        <button
          type="button"
          aria-label="Previous feature"
          onClick={() => manualRef.current(-1)}
          className="inline-flex size-11 items-center justify-center rounded-full border bg-surface text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 lg:size-[38px]"
          style={{ borderColor: ARROW_BORDER }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span className="flex min-w-[230px] items-center justify-center gap-2 text-center text-[12px] tracking-[0.02em] text-text-subtle">
          <span
            className={`size-1.5 rounded-full bg-accent opacity-60 ${reduce ? "" : "animate-pulse"}`}
            aria-hidden="true"
          />
          {reduce ? "use the arrows to explore" : "auto-playing — tap the arrows to skip"}
        </span>

        <button
          type="button"
          aria-label="Next feature"
          onClick={() => manualRef.current(1)}
          className="inline-flex size-11 items-center justify-center rounded-full border bg-surface text-text-secondary transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 lg:size-[38px]"
          style={{ borderColor: ARROW_BORDER }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
