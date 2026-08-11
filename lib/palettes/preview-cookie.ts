/* ============================================================================================
   THE PREVIEW COOKIE. `Try across portfolio` — TEMPORARY, ESCAPABLE, AND NEVER A PUBLISH.

   ⚠ IT MUST NEVER OVERWRITE THE PUBLISHED THEME, AND THAT IS ASSERTED AS AN ABSENCE RATHER THAN
   PROMISED HERE. `ralph/tests/palette-preview.mjs` section D asserts that nothing under this
   feature imports the site-settings write layer, and pins the number of files that DO — so the
   claim can fail if a future edit reaches for it. A count is what makes an absence checkable; "we
   do not call it" is a sentence that cannot.

   The published theme lives in `content/site-settings.yaml` and is written only through the
   owner-gated studio publish path. This cookie is read at paint time and changes nothing on disk.

   ---- ⚠ WHY A HEAD SCRIPT AND NOT A SERVER READ -----------------------------------------------

   Reading `cookies()` in the root layout would make EVERY public route dynamic. Measured: `/` and
   `/blog` are static, `/blog/[slug]`, `/projects/[slug]` and both `og` routes are SSG — the whole
   public surface, converted for a feature a visitor uses once.

   So the cookie is read by an inline script in `<head>`, which runs during parse and before body
   paint. The site already does exactly this for `history.scrollRestoration`, so the pattern, the
   timing and the departure from "no client script" are all established rather than new. There is
   no window in which the wrong ground is visible, on first load or on a later navigation.

   ---- ⚠ THE DEADLINE IS IN THE VALUE, NOT ONLY IN `Max-Age` ------------------------------------

   `Max-Age` is enforced by the browser and cannot be exercised in a test without waiting for it —
   which means the expiry would ship as a configured number nobody had ever seen work. A preview
   that outlives its welcome is a visitor seeing a palette the owner never published, on a site
   whose whole claim is the opposite.

   So the value carries its own deadline and the reader REFUSES a stale one. Both halves are real:
   `Max-Age` stops the cookie being sent at all, and the deadline stops a cookie that survives
   anyway — a clock change, a restored session, a browser that rounds. And it makes the expiry
   DRIVABLE: write a cookie with a past deadline and the site must render the published theme.
============================================================================================ */

/** The cookie name. One place, so the script, the writer and the gate cannot disagree. */
export const PREVIEW_COOKIE = "palette-preview";

/** ⚠ SHORT ON PURPOSE. Long enough to browse the site with a palette on, short enough that a
 *  forgotten preview expires on its own rather than becoming the visitor's silent normal. */
export const PREVIEW_MAX_AGE_SECONDS = 60 * 30;

/** `<theme>.<epochMillisDeadline>` — the palette and when it stops being honoured. */
export function encodePreview(theme: string, nowMs: number): string {
  return `${theme}.${nowMs + PREVIEW_MAX_AGE_SECONDS * 1000}`;
}

/** The theme a cookie value asks for, or null when it is absent, malformed or PAST ITS DEADLINE. */
export function decodePreview(raw: string | null | undefined, nowMs: number): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const theme = raw.slice(0, dot);
  const deadline = Number(raw.slice(dot + 1));
  if (!Number.isFinite(deadline) || deadline <= nowMs) return null;
  if (!/^[a-z-]+$/.test(theme)) return null;
  return theme;
}

/**
 * The event every surface listens on so an indicator notices without waiting for its poll.
 *
 * ⚠ A STRING LITERAL IN THREE FILES IS THREE SPELLINGS OF ONE DECISION, and a typo in any of them
 * is a door that silently stops raising the indicator. Nothing would fail; the strip would simply
 * take up to a poll interval to appear, which reads as slowness rather than as a defect.
 */
export const PREVIEW_CHANGED_EVENT = "palette-preview-changed";

/** Set the root's palette attributes. BOTH, always — the role layer remaps on `data-ground`, so a
 *  dark palette without it gives dark rungs under the light vocabulary. */
export function applyThemeAttributes(theme: string, isDark: boolean): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (isDark) root.dataset.ground = "dark";
  else delete root.dataset.ground;
}

/**
 * Start a preview. THE ONE WRITER — cookie, attributes and notification in a single call.
 *
 * ⚠ THERE WERE TWO SPELLINGS OF THIS BEFORE THE SWITCHER, AND THE SWITCHER WOULD HAVE MADE THREE.
 * `PaletteConsole`'s try button and `HomePaletteTeaser` each assembled the cookie string, set the
 * two attributes and dispatched the event, independently. They agreed. Nothing compared them, and
 * "one mechanism, three doors" is a claim about the mechanism rather than about the doors — so the
 * mechanism has to be one function or the sentence is aspirational.
 *
 * ⚠ AND `Date.now()` IS TAKEN BY THE CALLER RATHER THAN HERE, because `encodePreview` above is pure
 * and testable precisely because it takes its clock. A writer that reaches for the wall clock makes
 * the deadline untestable one layer up, which is how the expiry became a configured number nobody
 * had seen work in the first place.
 */
export function startPreview(theme: string, isDark: boolean, nowMs: number): void {
  document.cookie =
    `${PREVIEW_COOKIE}=${encodeURIComponent(encodePreview(theme, nowMs))}`
    + `; Path=/; Max-Age=${PREVIEW_MAX_AGE_SECONDS}; SameSite=Lax`;
  applyThemeAttributes(theme, isDark);
  window.dispatchEvent(new Event(PREVIEW_CHANGED_EVENT));
}

/** The live preview's theme, read from the document, or null when none is. The discriminator every
 *  surface uses for "did the visitor ask for this palette to travel". */
export function livePreviewTheme(nowMs: number): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${PREVIEW_COOKIE}=([^;]*)`));
  return decodePreview(m ? decodeURIComponent(m[1]) : null, nowMs);
}

/**
 * End a preview. THE ONE EXIT, and a different operation from starting one.
 *
 * ⚠ IT DOES NOT SET THE ATTRIBUTES, WHICH IS THE ASYMMETRY AND IT IS DELIBERATE. Starting a preview
 * knows the palette it wants. Ending one has to restore THE PUBLISHED theme, and the only surface
 * that knows what that is reads it from the markup the server rendered. Folding that read in here
 * would make this module depend on a DOM convention it does not own, so the caller passes what to
 * restore and this owns the cookie alone.
 *
 * ⚠ AND IT DISPATCHES THE SAME EVENT AS `startPreview`. Any surface tracking preview state has to
 * hear about the end as well as the start, and an exit that stayed silent would leave a second
 * indicator on a page that had returned to the published palette.
 */
export function endPreview(publishedTheme: string | null, publishedIsDark: boolean): void {
  document.cookie = `${PREVIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (publishedTheme) applyThemeAttributes(publishedTheme, publishedIsDark);
  window.dispatchEvent(new Event(PREVIEW_CHANGED_EVENT));
}

/**
 * The inline `<head>` script, as source.
 *
 * ⚠ THE `/studio` GATE IS IN HERE AND IT IS ASSERTED, NOT COMMENTED. The root layout wraps the
 * editor as well as the public site, so without this test a preview would repaint the canvas — and
 * the canvas renders public components deliberately. An author would see sapphire, have no reason
 * to doubt they had published sapphire, and publish something they never saw. The studio CHROME is
 * safe by construction (the frozen `--color-studio-*` palette is asserted independent of the public
 * one), so the canvas is the whole exposure and the pathname test is the whole fix.
 *
 * ⚠ AND IT WRITES BOTH ATTRIBUTES. The role layer remaps on `data-ground`, not on `data-theme`, so
 * setting the palette without the ground gives a dark palette's rungs under the light vocabulary.
 *
 * It is generated from the constants above rather than hand-written, so the cookie name and the
 * deadline rule cannot drift between the reader and the writer.
 */
export function previewHeadScript(darkThemes: readonly string[]): string {
  const dark = JSON.stringify(darkThemes);
  return [
    "(function(){try{",
    "if(location.pathname===\"/studio\"||location.pathname.indexOf(\"/studio/\")===0)return;",
    `var m=document.cookie.match(/(?:^|; )${PREVIEW_COOKIE}=([^;]*)/);`,
    "if(!m)return;",
    "var v=decodeURIComponent(m[1]),i=v.lastIndexOf(\".\");",
    "if(i<1)return;",
    "var t=v.slice(0,i),d=Number(v.slice(i+1));",
    "if(!isFinite(d)||d<=Date.now())return;",
    "if(!/^[a-z-]+$/.test(t))return;",
    "var r=document.documentElement;r.dataset.theme=t;",
    `if(${dark}.indexOf(t)>-1){r.dataset.ground="dark";}else{delete r.dataset.ground;}`,
    "}catch(e){}})();",
  ].join("");
}
