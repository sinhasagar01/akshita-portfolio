"use client";

import { useCallback, useEffect, useState } from "react";
import { PREVIEW_COOKIE, decodePreview } from "@/lib/palettes/preview-cookie";

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

export default function PreviewIndicator() {
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const m = document.cookie.match(new RegExp(`(?:^|; )${PREVIEW_COOKIE}=([^;]*)`));
      setPreviewing(decodePreview(m ? decodeURIComponent(m[1]) : null, Date.now()));
    };
    read();
    /* The cookie can lapse while the page is open — the deadline is minutes, not a session — so the
       indicator re-reads rather than trusting its first answer. Cheap, and it means a preview that
       expires under the visitor removes its own banner instead of stranding one. */
    const id = setInterval(read, 15_000);
    /* Pressing "try" on `/palettes` sets the cookie in the same document, and a poll would leave the
       indicator up to fifteen seconds behind the thing it describes. */
    window.addEventListener("palette-preview-changed", read);
    return () => { clearInterval(id); window.removeEventListener("palette-preview-changed", read); };
  }, []);

  const exit = useCallback(() => {
    document.cookie = `${PREVIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    const published = publishedFromMarkup();
    const root = document.documentElement;
    if (published.theme) root.dataset.theme = published.theme;
    if (published.ground === "dark") root.dataset.ground = "dark";
    else delete root.dataset.ground;
    setPreviewing(null);
  }, []);

  if (!previewing) return null;

  return (
    <div
      role="status"
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
