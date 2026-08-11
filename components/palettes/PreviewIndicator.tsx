"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PREVIEW_CHANGED_EVENT, livePreviewTheme, endPreview,
} from "@/lib/palettes/preview-cookie";
import { arrivalNote } from "@/lib/palettes/teaser";

/* ============================================================================================
   THE PREVIEW INDICATOR — PERSISTENT, GLOBAL, AND CARRYING THE WAY OUT.

   ⚠ A PREVIEW WITHOUT A VISIBLE EXIT IS A SITE THAT LOOKS BROKEN TO ITS OWNER. The palette follows
   the visitor across every public route, so the thing that tells them why must follow too — and it
   must carry the action, not merely describe the state. This sits in the portfolio layout beside
   the header and the footer, which is the only scope that covers every public page.

   ⚠ EXIT RETURNS TO THE PUBLISHED THEME, NOT TO A REMEMBERED ONE, AND THAT IS THE WHOLE REASON
   `/palettes` DEFAULTS TO PUBLISHED. There is exactly one true state to return to — what the owner
   published — and the server already baked it into `<html>` at build. So exit deletes the cookie
   and restores the attributes the document was SERVED with, rather than restoring whatever the
   visitor happened to be looking at before. A remembered theme would make exit return to another
   preview, which is not an exit.

   ⚠ AND IT READS THE SAME DECODER THE HEAD SCRIPT DOES. If this component decided the preview was
   live by a different rule, the indicator and the paint could disagree — a visitor seeing a themed
   site with no way out, or a banner over a site that had already reverted.
============================================================================================ */

/** What the document was SERVED with — the published theme, before any preview touched it. */
function publishedFromMarkup(): { theme: string | null; ground: string | null } {
  const el = document.getElementById("published-theme");
  return {
    theme: el?.getAttribute("data-published-theme") ?? null,
    ground: el?.getAttribute("data-published-ground") ?? null,
  };
}

/* ============================================================================================
   ⚠ TWO STRIPS, ONE EXIT, AND THE DISCRIMINATOR IS WHETHER A PREVIEW IS LIVE.

     preview live      "Previewing X across the site"        + EXIT
     no preview, and
     the published
     theme is not one
     of the teaser's   "Published: X — not one of these"     + ROUTE, NO EXIT
     four

   ⚠ THE ARRIVAL STRIP HAS NO EXIT AND MUST NEVER GAIN ONE. On arrival there is no preview — the
   published theme IS the site — so an exit would act on nothing. It would be a control that either
   does nothing or, worse, "exits" to the same state it is already in, which reads as broken. THE
   EXIT BELONGS TO THE LIVE-PREVIEW STRIP EXCLUSIVELY.

   "Add an exit for symmetry" is exactly what a later pass will try. It is not symmetry; the two
   strips describe different things — one a temporary state the visitor entered, one a permanent
   state they merely arrived in.

   ⚠ AND THEY ARE ONE COMPONENT WITH ONE RETURN PATH, WHICH IS WHY "NEVER BOTH" IS STRUCTURAL RATHER
   THAN COORDINATED. Two components could both render and nothing would notice; a single branch
   cannot. `palette-arrival` asserts the SHAPE — that the preview branch returns before the arrival
   branch is reached — rather than asserting each strip exists, because a presence row passes with
   both on screen.
============================================================================================ */
export default function PreviewIndicator({ publishedTheme }: { publishedTheme: string }) {
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      setPreviewing(livePreviewTheme(Date.now()));
    };
    read();
    /* The cookie can lapse while the page is open — the deadline is minutes, not a session — so the
       indicator re-reads rather than trusting its first answer. Cheap, and it means a preview that
       expires under the visitor removes its own banner instead of stranding one. */
    const id = setInterval(read, 15_000);
    /* Pressing "try" on `/palettes` sets the cookie in the same document, and a poll would leave the
       indicator up to fifteen seconds behind the thing it describes. */
    window.addEventListener(PREVIEW_CHANGED_EVENT, read);
    return () => { clearInterval(id); window.removeEventListener(PREVIEW_CHANGED_EVENT, read); };
  }, []);

  const exit = useCallback(() => {
    const published = publishedFromMarkup();
    endPreview(published.theme, published.ground === "dark");
    setPreviewing(null);
  }, []);

  /* ⚠ THE PREVIEW BRANCH RETURNS FIRST, and that ordering IS the exclusivity. Reaching the arrival
     strip requires `previewing` to be null, so the two can never be on screen together. */
  if (!previewing) {
    const note = arrivalNote(publishedTheme);
    if (!note) return null;
    return (
      <div
        role="status"
        className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-ink-950/8 bg-surface px-4 py-2 shadow-lg"
        data-arrival-strip
      >
        <span className="text-sm text-text-secondary">
          {note}
        </span>
        {/* ⚠ THE COLOUR SITS ON THE SPAN, NOT ON THE `<a>`, AND THE FIRST VERSION WAS INVISIBLE.
            `text-surface` on the anchor drew NOTHING: globals.css carries an unlayered
            `a { color: inherit }` so links take their context, and an unlayered element rule beats a
            utility in `@layer utilities`. The link inherited the strip's near-black and painted it
            on a near-black pill — measured 1.00, text and background the same token exactly.

            ⚠ THE SEVENTH `<a>` COLOUR SITE, AND THE RECORD ALREADY NAMED THE OTHER SIX. It reads as
            a working class in the markup, which is why nothing but a measurement finds it. A child
            span is not an `<a>`, so the utility lands there. */}
        <Link
          href="/palettes"
          className="rounded-full bg-text-primary px-3 py-1 text-sm font-medium"
        >
          <span className="text-surface">See all nine</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      role="status"
      data-preview-strip
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-ink-950/8 bg-surface px-4 py-2 shadow-lg"
    >
      <span className="text-sm text-text-secondary">
        Previewing <b className="font-medium text-accent-text">{previewing}</b> across the site
      </span>
      <button
        type="button"
        onClick={exit}
        className="rounded-full bg-text-primary px-3 py-1 text-sm font-medium text-surface"
      >
        Exit preview
      </button>
    </div>
  );
}
