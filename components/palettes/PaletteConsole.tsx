"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaletteCompatibility } from "@/lib/palettes/compatibility";
import { render, formatRatio, FORMATS, type CopyFormat } from "@/lib/palettes/formats";
import {
  PREVIEW_COOKIE, PREVIEW_MAX_AGE_SECONDS, encodePreview, decodePreview,
} from "@/lib/palettes/preview-cookie";
import StatCard from "@/components/case-study/StatCard";
import PrincipleCard from "@/components/case-study/PrincipleCard";
import PullQuote from "@/components/case-study/blocks/PullQuote";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionLabel from "@/components/ui/SectionLabel";

/* ============================================================================================
   THE CONSOLE. Sticky preview left, panel right, OKLCH band and licence below.

   ⚠ THE WHOLE PAGE THEMES, NOT A PREVIEW BOX, AND THAT IS THE ARGUMENT RATHER THAN A FLOURISH.
   Pressing a palette writes `data-theme` and `data-ground` on `<html>`, so the nav above, the
   footer below and this panel all move together. A palette that only recoloured a card would prove
   nothing about the system.

   ⚠ AND CONTAINER SCOPING WAS MEASURED AND REFUSED — THE REASON IS INVISIBLE FROM THE MARKUP, SO
   IT IS WRITTEN HERE. Scoping the palette to a `<div>` looks obviously right and does not work.
   A `[data-theme]` block declares 35 tokens and every one is a RUNG; the 11 ROLES are declared
   once in `@theme` as `var()` aliases, and a `var()` inside a custom property is substituted ON
   THE ELEMENT THE DECLARATION APPLIES TO, which is `:root`. So a container that redeclares
   `--color-cream-50` never moves `--color-surface` — the role was already resolved against the
   published palette before the container existed.

   Measured in a browser: a scoped harbour got 11 of 33 sampled tokens right, a scoped sapphire 5
   of 33. The failures split exactly in half — 11 role aliases and 11 derived helpers declared at
   `:root` (`--glass-fill`, `--glow-on-tan`, the vessel tints). And `:root[data-ground="dark"]`
   declares 43 more properties at 0-2-0 specificity, which no container can match at all.

   ⚠ THE FAILURE IS SUBSTITUTION TIMING, NOT SELECTORS, WHICH IS WHY A COMPONENT SWEEP WOULD COME
   BACK CLEAN. Nothing here targets `:root`; the values simply resolved there. The next person to
   reach for container scoping will find no offending rule and conclude it is safe.

   ---- ⚠ WHY THE PREVIEW IS NOT `ProjectCard`, WHICH READS LIKE A VIOLATION AND IS NOT ------------

   The rule is REAL COMPONENTS, NO FACSIMILES, and every component below is imported and real. The
   first build of this preview used `ProjectCard`, the most obvious real component on the site, and
   it was replaced — so the reason belongs here before someone restores it on principle.

   ⚠ THE NO-FACSIMILE RULE IS ABOUT DRIFT, NOT ABOUT PHOTOGRAPHS. It exists so this page cannot show
   a system that is not the shipped one. `ProjectCard`'s dominant element is a RASTER, and measured
   across three palette presses the largest thing in the preview did not move at all. A card whose
   biggest element is inert under a palette change demonstrates nothing about tokens — so replacing
   it SERVES the rule rather than bending it.

   What replaced it is still real and still imported: `SectionHeading`, `PrincipleCard`, `StatCard`
   and `PullQuote`, chosen because they are drawn almost entirely from tokens.

   ⚠ AND THE ONE THING THIS PREVIEW THEREFORE CANNOT SHOW, RECORDED RATHER THAN HIDDEN: a themed
   page containing PHOTOGRAPHY. That is a real property of the site — the work cards and the about
   portrait sit on themed grounds — and nothing here demonstrates how a palette sits around an image
   it cannot recolour. A visitor judging "will my photos look right on cerise" gets no answer from
   this page.

   ---- ⚠ AND THE SITE'S OWN NAV IS THE FIFTH REAL COMPONENT, BY NOT BEING HERE -------------------

   `SiteHeader` is `fixed inset-x-0` with document-level listeners and its own `data-nav-tone`
   computation, so a second instance inside this panel would overlay the viewport and double every
   listener. It is NOT rebuilt as a facsimile and NOT imported: the page's own nav sits above the
   console and IS the demonstration. A copy would drift, which is the thing the rule forbids.
============================================================================================ */

type Props = {
  palettes: PaletteCompatibility[];
  initialSlug: string;
  /** True on `/palettes/<slug>`, where an inline script already set the root before paint. */
  ownsRootTheme: boolean;
};

/** The line the preview opens with. A constant, not state — see the note at its render. */
const HEADLINE = "Turning rough ideas into products people use";

/** The five rungs the token grid shows, by the job each one does rather than by its rung name. */
const SHOWN = [
  ["canvas", "page"],
  ["surface", "surface"],
  ["accent", "accent"],
  ["on-accent", "on-accent"],
  ["text-primary", "text-lead"],
] as const;

export default function PaletteConsole({ palettes, initialSlug, ownsRootTheme }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const active = palettes.find((p) => p.name === slug) ?? palettes[0];
  /* The theme the visitor arrived on, so leaving the page restores it rather than stranding them
     on whatever they last pressed. Captured once, before any press. */
  const arrivedOn = useRef<{ theme: string; ground: string | null } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!arrivedOn.current) {
      arrivedOn.current = { theme: root.dataset.theme ?? "", ground: root.dataset.ground ?? null };
    }
    return () => {
      /* ⚠ RESTORED ON UNMOUNT ONLY WHEN NO PREVIEW WAS REQUESTED, AND THE UNCONDITIONAL VERSION WAS
         THE DEFECT IN `Try across portfolio`.

         The restore exists so that BROWSING palettes does not leak: pressing dots to look at cerise
         and then navigating to /blog must not carry cerise, because the visitor never asked for it
         and there would be no indicator offering a way back.

         ⚠ BUT PRESSING `Try across portfolio` IS EXACTLY THAT REQUEST, AND THE OLD CLEANUP COULD NOT
         TELL THE TWO APART. It restored whatever the visitor arrived on, so leaving this page put
         the published theme back while the cookie stayed live — a cream page under a banner
         insisting "Previewing nocturne", with an Exit button. The DOM was wrong and the strip was
         the only thing telling the truth.

         ⚠ THE DISCRIMINATOR ALREADY EXISTED AND IS NOT A NEW MECHANISM: the cookie. If one is live,
         the visitor asked for the palette to travel, so the DOM is left alone. If none is, this was
         browsing and the arrival state is restored. Same cookie, same decoder, same single source of
         truth `/palettes`, the teaser and both strips already share.

         ⚠ AND IT IS READ HERE RATHER THAN FROM STATE, because the cookie is what every OTHER surface
         reads. A local flag would be a second answer to "is a preview live" and the two would
         eventually disagree — which is the failure this whole layer is built to avoid. */
      const raw = document.cookie.match(new RegExp(`(?:^|; )${PREVIEW_COOKIE}=([^;]*)`));
      const livePreview = decodePreview(raw ? decodeURIComponent(raw[1]) : null, Date.now());
      if (livePreview) return;

      const seen = arrivedOn.current;
      if (!seen) return;
      if (seen.theme) root.dataset.theme = seen.theme;
      if (seen.ground) root.dataset.ground = seen.ground; else delete root.dataset.ground;
    };
  }, []);

  const press = useCallback((next: PaletteCompatibility) => {
    const root = document.documentElement;
    root.dataset.theme = next.name;
    if (next.groundClass === "dark") root.dataset.ground = "dark";
    else delete root.dataset.ground;
    setSlug(next.name);
  }, []);

  /* On the slug route the script already set the root, so the first paint is correct and this only
     keeps the two in step after a press. */
  useEffect(() => {
    if (!ownsRootTheme) return;
    const root = document.documentElement;
    if (root.dataset.theme !== slug) press(active);
  }, [ownsRootTheme, slug, active, press]);

  const failing = active.rows.filter((r) => r.got < r.min);
  const [fmt, setFmt] = useState<CopyFormat>("css");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  /* ⚠ THE BLOCK IS RENDERED FROM THE SAME REPORT THE ROWS ABOVE ARE, through `render`. No figure on
     this page is computed twice — `palette-formats` B1 asserts that as an identity rather than
     leaving it to this comment, because a comment saying two things agree cannot fail. */
  const block = render(active, fmt);

  const copy = useCallback(async (text: string, msg: string) => {
    try { await navigator.clipboard.writeText(text); say(msg); }
    catch { say("Copy failed — your browser blocked it"); }
  }, [say]);

  /* ⚠ A DOWNLOAD IS A BLOB, NEVER A ROUTE. The file must be the bytes the visitor is looking at, so
     it is built from the SAME `render` call rather than fetched from an endpoint that would compute
     it again — the second-spelling risk, in a place where the output leaves the site entirely. */
  const download = useCallback((format: CopyFormat) => {
    const meta = FORMATS.find((f) => f.id === format);
    if (!meta) return;
    const text = render(active, format);
    const url = URL.createObjectURL(new Blob([text], { type: meta.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name}.${meta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    say(`Downloading ${active.name}.${meta.ext}`);
  }, [active, say]);

  return (
    <main className="pt-32 pb-24">
      {/* `aria-live` so a copy is announced rather than only shown — the action has no other
          feedback, and a silent success is indistinguishable from a silent failure. */}
      <div
        aria-live="polite"
        className={`fixed right-6 top-24 z-50 rounded-full bg-text-primary px-4 py-2 text-sm text-surface transition-opacity ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </div>
      {/* ⚠ NO `font-display` ON ANY HEADING HERE, AND ITS ABSENCE IS DELIBERATE. The unlayered
          `h1,h2` and `h3..h6` element resets in globals.css already set the display face, and they
          BEAT a utility in `@layer utilities` — so the class asks for a face the element already
          has and draws nothing. `cascade-public` counts that as inert on h1/h2 (asked and drew the
          same value) and as a COLLISION on h3 (the reset's value wins over a different one), which
          is why the same mistake shows up in two censuses. Identical to the home h1's inert
          `font-script`, removed in #349. Adding it back is a class that renders nothing. */}
      <div className="mx-auto w-full max-w-[1180px] px-6">
        <SectionLabel>Playground · 01 — Palettes</SectionLabel>
        <h1 className="mt-4 text-6xl leading-[0.96] tracking-tight text-text-primary">
          Press one. Watch what <em className="italic text-accent-text">doesn&rsquo;t</em> change.
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-text-secondary">
          Nine curated palettes as role tokens. The preview stays put while you work; the panel
          tells you what each one clears.
        </p>
      </div>

      <div className="mx-auto mt-12 grid w-full max-w-[1180px] grid-cols-1 gap-0 border-t border-ink-950/8 px-6 lg:grid-cols-[1fr_372px]">
        {/* ---- the sticky preview, built from the site's own components ---- */}
        <div className="border-ink-950/8 py-8 lg:border-r lg:pr-8">
          <div className="lg:sticky lg:top-28">
            <div className="rounded-xl border border-ink-950/8 bg-surface-well p-6">
              {/* ⚠ THE HEADLINE IS THE VISITOR'S, AND THAT IS THE POINT OF THE WHOLE PREVIEW.
                  Everything else here shows the palette holding SOMEBODY ELSE'S words. Typing your
                  own is what turns a demonstration into a test of the thing you actually care
                  about — whether the palette carries YOUR sentence at YOUR length.

                  ⚠ AND THE `contentEditable` TRAP THIS REPO ALREADY PAID FOR DOES NOT APPLY HERE,
                  which is worth saying rather than leaving a reader to wonder. The blog canvas
                  found that a blur can capture a mid-edit state and commit it — a real defect when
                  the edit PERSISTS. Nothing here persists: there is no save, no draft branch and no
                  commit path, the text lives in component state for the length of the visit, and a
                  reload restores the original. There is nothing for a blur to capture wrongly.

                  ⚠ AND THERE IS NO STATE BEHIND IT, WHICH IS THE WHOLE REASON THE CARET IS SAFE.
                  The first version held the text in `useState` and passed it back as `title`, so
                  every keystroke re-rendered the node React was reading from — the classic
                  `contentEditable` caret jump, avoided only by React's diff happening to skip an
                  unchanged string. Nothing needs the edited text: the copy block does not carry it
                  and no gate reads it. So the element is genuinely UNCONTROLLED, React renders the
                  initial string once and never touches it again, and the risk is removed rather
                  than mitigated. */}
              <SectionHeading
                index="01"
                title={HEADLINE}
                subtext="Six years across enterprise data tools and one consumer turnaround."
                reveal={false}
                titleProps={{
                  contentEditable: true,
                  suppressContentEditableWarning: true,
                  spellCheck: false,
                  role: "textbox",
                  "aria-label": "Preview headline — type your own",
                  tabIndex: 0,
                  className: "rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent",
                }}
              />
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                  stat={{
                    value: "2.3 → 4.0",
                    tag: "store rating",
                    body: "What the boAt Crest redesign moved, drawn in whichever palette is pressed.",
                  }}
                />
                <PrincipleCard
                  principle={{
                    index: "02",
                    title: "One surface, three personas",
                    body: "Analysts, leads and admins reading the same data at different depths.",
                  }}
                />
              </div>
              <div className="mt-3">
                <PullQuote text="A palette that only recolours a card proves nothing about the system." />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {active.rows.slice(0, 4).map((r) => (
                <div key={r.key} className="rounded-lg border border-ink-950/8 bg-surface p-3">
                  <b className="block font-mono text-lg text-text-primary">{r.got.toFixed(2)}</b>
                  <span className="mt-1 block text-eyebrow tracking-eyebrow uppercase text-text-subtle">
                    {r.key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- the panel ---- */}
        <aside className="bg-surface-well py-8 lg:pl-6">
          <h2 className="text-xl text-text-primary">Nine palettes</h2>
          <p className="mt-1 text-sm leading-relaxed text-text-subtle">
            Authored, not generated. Every one clears every pair the site draws.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {palettes.map((p) => (
              <button
                key={p.name}
                type="button"
                aria-pressed={p.name === slug}
                onClick={() => press(p)}
                className={`relative aspect-[1.35] overflow-hidden rounded-lg border-2 ${
                  p.name === slug ? "border-accent" : "border-transparent"
                }`}
                title={p.name}
              >
                <span
                  className="absolute inset-0"
                  style={{ background: p.tokens[p.groundClass === "dark" ? "band-dark" : "canvas"] }}
                />
                <span
                  className="absolute inset-y-0 right-0 left-1/2"
                  style={{ background: p.tokens["accent-500"] }}
                />
                <span
                  className="absolute inset-x-0 bottom-0 p-1 text-center font-mono text-[8px] uppercase tracking-widest"
                  style={{ color: p.tokens["text-subtle"] }}
                >
                  {p.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-ink-950/8 pt-4">
            <h3 className="text-lg text-text-primary">{active.name}</h3>
            <p className="mt-1 text-sm text-text-subtle">
              {failing.length === 0
                ? "Clears every pair the site draws."
                : `${failing.length} pair(s) below floor.`}{" "}
              Its counterpart is{" "}
              <b className="font-medium text-accent-text">{active.counterpart}</b>.
            </p>

            <div className="mt-3">
              {active.rows.map((r) => (
                <div
                  key={r.key}
                  className="grid grid-cols-[1fr_auto_auto] items-baseline gap-2 border-b border-ink-950/8 py-1.5 text-sm"
                >
                  <span className="text-text-subtle">{r.key}</span>
                  <b className="font-mono text-sm text-text-primary">{formatRatio(r.got)}</b>
                  <u className="font-mono text-[8px] uppercase tracking-widest no-underline text-text-subtle">
                    {r.got >= r.min ? "pass" : "fail"}
                  </u>
                </div>
              ))}
            </div>
          </div>

          {/* ⚠ THE TRY ACTION WRITES A COOKIE AND NOTHING ELSE. It does not call an API, it does not
              touch `content/site-settings.yaml`, and nothing in this feature imports the write
              layer — asserted as an absence in `palette-preview` section D, with the importer count
              pinned so the claim can fail. A preview is a thing the visitor is doing; a publish is
              a thing the owner did. */}
          <div className="mt-5 border-t border-ink-950/8 pt-4">
            <h3 className="text-lg text-text-primary">Try it across the site</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-subtle">
              Applies {active.name} to every page for {PREVIEW_MAX_AGE_SECONDS / 60} minutes. It
              expires on its own, and an exit control follows you until it does. Nothing is
              published.
            </p>
            <button
              type="button"
              onClick={() => {
                document.cookie =
                  `${PREVIEW_COOKIE}=${encodeURIComponent(encodePreview(active.name, Date.now()))}`
                  + `; Path=/; Max-Age=${PREVIEW_MAX_AGE_SECONDS}; SameSite=Lax`;
                say(`${active.name} applied across the site`);
                /* The attributes are already correct — pressing set them — so this only makes the
                   indicator notice without waiting for its poll. */
                window.dispatchEvent(new Event("palette-preview-changed"));
              }}
              className="mt-3 w-full rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-on-accent"
            >
              Try {active.name} across the portfolio
            </button>
          </div>

          <div className="mt-5 border-t border-ink-950/8 pt-4">
            <h3 className="text-lg text-text-primary">Take it</h3>
            <div className="mt-3 flex w-max gap-0.5 rounded-full border border-ink-950/8 bg-surface p-1">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={f.id === fmt}
                  onClick={() => setFmt(f.id)}
                  className={`rounded-full px-3 py-1.5 text-eyebrow tracking-eyebrow uppercase ${
                    f.id === fmt ? "bg-accent text-on-accent" : "text-text-subtle"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* ⚠ JSON HAS NO COMMENT SYNTAX, SO ITS REPORT IS DATA — AND THE VISITOR IS TOLD, rather
                than left to notice that one of three formats carries less. It carries MORE: every
                row keeps its floor and the kind of floor, machine-readable. */}
            <p className="mt-2 text-sm leading-relaxed text-text-subtle">
              {fmt === "json"
                ? "JSON has no comments, so the contrast report is data here — every pair with its ratio, its floor and whether that floor is WCAG or ours."
                : "The contrast report rides inside the block as a comment, so the figures travel with the tokens."}
            </p>
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-ink-950/8 bg-surface p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
              {block}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(block, `${active.name} copied as ${fmt}`)}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-on-accent"
              >
                Copy
              </button>
              <button type="button" onClick={() => download("css")} className="rounded-full border border-ink-950/8 px-4 py-2 text-sm text-text-secondary">
                .css
              </button>
              <button type="button" onClick={() => download("json")} className="rounded-full border border-ink-950/8 px-4 py-2 text-sm text-text-secondary">
                .json
              </button>
              <button
                type="button"
                onClick={() => copy(`${window.location.origin}/palettes/${active.name}`, "Link copied")}
                className="rounded-full border border-ink-950/8 px-4 py-2 text-sm text-text-secondary"
              >
                Link
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-ink-950/8 pt-4">
            <h3 className="text-lg text-text-primary">Tokens</h3>
            <p className="mt-1 text-sm text-text-subtle">Click one to copy its value.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {SHOWN.map(([token, label]) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => copy(active.tokens[token], `Copied --color-${token}`)}
                  className="overflow-hidden rounded-lg border border-ink-950/8 bg-surface text-left"
                >
                  <i className="block h-12" style={{ background: active.tokens[token] }} />
                  <div className="p-2">
                    <b className="block text-xs font-medium text-text-primary">{label}</b>
                    <code className="mt-0.5 block font-mono text-[10px] text-text-subtle">
                      {active.tokens[token]}
                    </code>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ---- the OKLCH band and the licence ---- */}
      <div className="mx-auto w-full max-w-[1180px] border-t border-ink-950/8 px-6 py-12">
        <div className="flex items-baseline gap-4">
          <h2 className="text-2xl tracking-tight text-text-primary">Why these behave</h2>
          <span className="text-eyebrow tracking-eyebrow uppercase text-text-subtle">
            oklch · three controls
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { t: "Lightness", d: "Carries hierarchy. Held constant, structure survives any hue.", s: [95, 84, 72, 60, 48, 36, 26, 18].map((l) => `oklch(${l}% .04 60)`) },
            { t: "Chroma", d: "Energy. A narrow band, so no palette shouts louder than another.", s: [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28].map((c) => `oklch(62% ${c} 60)`) },
            { t: "Hue", d: "Identity, and the only thing that differs across the nine.", s: [20, 60, 110, 150, 200, 250, 290, 330].map((h) => `oklch(62% .16 ${h})`) },
          ].map((ax) => (
            <article key={ax.t} className="overflow-hidden rounded-lg border border-ink-950/8 bg-surface">
              <div className="flex h-10">
                {ax.s.map((c) => <i key={c} className="flex-1" style={{ background: c }} />)}
              </div>
              <div className="p-3">
                <h3 className="text-base text-text-primary">{ax.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-text-subtle">{ax.d}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-text-subtle">
          <b className="font-medium text-text-primary">Free to use.</b> No attribution needed.
        </p>
      </div>
    </main>
  );
}
