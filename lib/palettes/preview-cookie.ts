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
