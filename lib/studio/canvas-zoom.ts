// The canvas zoom — its levels, and the clamp that makes a stored value advisory.
//
// Third application of #237's shape: bounds, a clamp applied ON THE READ, a cookie per surface,
// and a custom property. Pure and dependency-free so `--experimental-strip-types` can load it and
// ralph can assert the levels directly.
//
// ---- ⚠ ABSOLUTE, WITH `fit` AS A LEVEL — NOT A MULTIPLIER ON TOP OF FIT ----------------------
//
// The owner's call, and it is the one that keeps the number honest. A multiplier would mean the
// readout says "1.2 times whatever currently fits", so 100% would not be 100% — the thing most
// likely to mislead later. An absolute level means 100% is the true render size on both surfaces,
// and `fit` is the state that says "the pane decides", which is exactly what shipped before this
// control existed.
//
// SO `fit` IS THE DEFAULT AND NOTHING MOVES FOR AN AUTHOR WHO NEVER TOUCHES IT. On the case study
// `fit` is `paneWidth / 1280` floored at `CS_MIN_SCALE`, which is today's behaviour unchanged. On
// blog `fit` is 1, because blog's canvas has never scaled and its measure is a locked number.
//
// ---- ⚠ AN EXPLICIT LEVEL BYPASSES THE FLOOR AND THE CEILING, DELIBERATELY -------------------
//
// `useFitToWidth` clamps to `CS_MIN_SCALE…1` because an AUTOMATIC scale that fell below half was
// illegible and one above 1 was pointless. A level the author typed is a different thing: asking
// for 150% is asking to see detail, and asking for 50% on a wide pane is asking to see the whole
// section. The pane already pans (`overflow-x-auto`) when the surface is wider than it is, which
// is the behaviour that makes an over-1 level usable rather than broken.

/** Which canvas. The two have different `fit` meanings, so they store separately. */
export type ZoomSurface = "cs" | "blog";

/** `fit` lets the pane decide; a number is a true render scale. */
export type ZoomLevel = "fit" | number;

/**
 * The levels the control steps through, ascending.
 *
 * THE SPAN IS 50% TO 150%, AND BOTH ENDS ARE DERIVED. 50% is the case study's existing legibility
 * floor (`CS_MIN_SCALE`), so the control cannot ask for less than the layout already guarantees.
 * 150% is the largest step that still shows a full column of a 1280px render inside a 794px pane
 * without panning becoming the primary interaction.
 *
 * ⚠ THE INCREMENT IS 10%, DOWN FROM 25%, AND THAT IS A FEEL DECISION RATHER THAN A DERIVED ONE.
 * At quarter-steps the jump from `fit` was violent — on a typical case-study pane `fit` lands
 * around 84%, so the first press threw the canvas to 100% and the second to 125%, and there was
 * no way to nudge. Ten gives eleven stops across the same span, so a press is an adjustment
 * rather than a decision. Recorded as the owner's call so nobody re-derives it from the geometry
 * and gets a different answer.
 */
export const ZOOM_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5] as const;

/** What an unset or unparseable cookie means, and what the control resets to. */
export const ZOOM_DEFAULT: ZoomLevel = "fit";

/** The property the level travels through, so the canvas can read it without a re-render. */
export const ZOOM_VAR = "--studio-canvas-zoom";

/** One cookie per surface — the two canvases are different sizes and different jobs. */
export const ZOOM_COOKIE: Record<ZoomSurface, string> = {
  cs: "studio-canvas-zoom-cs",
  blog: "studio-canvas-zoom-blog",
};

/**
 * Any stored or typed value → a level this build allows.
 *
 * Missing, unparseable and out-of-range all resolve rather than throw, because this runs during a
 * server render of the whole editor and a bad cookie must not be able to 500 it. An off-scale
 * NUMBER snaps to the nearest declared step rather than being kept: the steps are the design, and
 * a cookie written under a different set must not smuggle a level back in.
 */
export function clampZoom(raw: unknown): ZoomLevel {
  if (raw === "fit") return "fit";
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n)) return ZOOM_DEFAULT;
  let best: number = ZOOM_STEPS[0];
  for (const s of ZOOM_STEPS) if (Math.abs(s - n) < Math.abs(best - n)) best = s;
  return best;
}

/**
 * The level one step away, or `fit` unchanged at the ends.
 *
 * ⚠ IT STEPS FROM THE EFFECTIVE SCALE, NOT FROM THE LEVEL. Pressing `+` while on `fit` has to go
 * somewhere sensible, and "the first step above what I am actually looking at" is the only answer
 * that does not jump. So the caller passes what is on screen and this finds its neighbour.
 */
export function stepZoom(effective: number, direction: 1 | -1): ZoomLevel {
  const eps = 0.001;
  const next = direction === 1
    ? ZOOM_STEPS.find((s) => s > effective + eps)
    : [...ZOOM_STEPS].reverse().find((s) => s < effective - eps);
  return next ?? clampZoom(effective);
}

/** The readout. A percentage of true size, on both surfaces, whatever `fit` resolved to. */
export function zoomLabel(effective: number): string {
  return `${Math.round(effective * 100)}%`;
}
