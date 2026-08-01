"use client";

// The inline formatting toolbar for a focused RICH field — bold, italic, link.
//
// EXTRACTED FROM SectionsEditPanel, byte-identical, so the case-study canvas and the blog
// canvas run ONE implementation. It was module-private and entirely generic: its props are
// a fixed-position point and an onCommand callback, and its wiring keys off the
// `data-edit-rich` / `data-rich-toolbar` attribute contract that `inlineEditProps` already
// emits for both collections. Nothing in it knows what a section is.
//
// SELF-CONTAINED STYLING. Every class here is a Tailwind utility declared in this file —
// there is no global rule to duplicate, which is why blog needed none. Contrast
// `.blog-editable`, where the affordance IS a global rule and the duplicate was deliberate.
//
// THREE MARKS ONLY, and the absences are deliberate. Bold, italic and link are what
// `RichRun` can express; there is no underline, size, colour or list because the parser
// cannot round-trip them. A greyed button advertises a capability that does not exist —
// docs/studio/richtext-roadmap.md carries that reasoning instead.
//
// execCommand is DEPRECATED and is still the only cross-browser way to toggle a mark inside
// contentEditable without shipping an editor library. It produces <b>/<strong> and <i>/<em>
// depending on engine, and richToMarkers maps all four. Its cost is that the DOM it leaves
// behind is no longer React's, which is why `onCommand` exists: the host marks the tree
// untrusted and rebuilds it on the way out.
import { useEffect, useRef, useState } from "react";
import { isSafeHref } from "@/lib/case-studies/adapter";

/**
 * Inline formatting for the focused Rich field: bold, italic, link.
 *
 * THREE marks, and only three. The model is a plain string that `parseRich` reads for
 * `**bold**`, `*italic*` and `[text](url)` — there is no underline, size, colour or list
 * in `RichRun`, and those are deliberately absent rather than shown disabled. A greyed
 * button advertises a capability that does not exist; docs/studio/richtext-roadmap.md
 * carries that reasoning instead.
 *
 * execCommand is deprecated but is still the only cross-browser way to toggle a mark
 * inside contentEditable without shipping an editor library. It produces <b>/<strong>
 * and <i>/<em> depending on engine, and richToMarkers maps all four.
 *
 * THE LINK POPOVER REPLACES window.prompt(). A native prompt is modal, unstyled, cannot
 * show why a URL was refused, and on some platforms is suppressed entirely — so the one
 * control that needs to explain itself was the one that could not. The popover is
 * `docs/studio/link-popover.html` built with the real tokens.
 */
export default function BoldToolbar({
  at,
  onCommand,
}: {
  at: { top: number; left: number } | null;
  /** Fired after a command ran, so the panel knows the DOM has diverged from React. */
  onCommand?: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  /** Set when the selection sits inside an existing <a>, which is what shows Remove. */
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * The selection AT THE MOMENT the popover opened, plus the field it lived in.
   *
   * Focus moves to the URL input, which collapses the selection the link is supposed to
   * wrap — so it is captured on the way in and restored immediately before the command.
   * Without this, Apply links nothing at all.
   */
  const saved = useRef<{ range: Range; field: HTMLElement } | null>(null);
  /** Set when a close should hand focus back to the field the popover came from. */
  const wantsRefocus = useRef(false);

  // A new field took focus (or the toolbar hid) — an open popover belongs to the old
  // selection, so it must not survive into the new one.
  useEffect(() => {
    setLinkOpen(false);
  }, [at?.top, at?.left]);

  useEffect(() => {
    if (linkOpen) {
      inputRef.current?.focus();
      return;
    }
    if (!wantsRefocus.current) return;
    wantsRefocus.current = false;
    restoreSelection();
  }, [linkOpen]);

  if (!at) return null;

  const trimmed = url.trim();
  // Empty is ALLOWED and means "no link" (Apply removes it); only a non-empty unsafe
  // value is a rejection. Same allowlist as the parser and the renderer.
  const rejected = trimmed !== "" && !isSafeHref(trimmed);

  const restoreSelection = () => {
    const s = saved.current;
    if (!s) return false;
    s.field.focus();
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(s.range);
    return true;
  };

  const closePopover = () => {
    // The focus restore is an EFFECT, not a call here. Restoring while the input is
    // still mounted loses the race — React removes the focused node a moment later and
    // the browser falls back to <body>, which leaves the toolbar floating over a field
    // nobody is editing, with no further focusout to hide it. The effect below runs
    // after the DOM update, which is the only point the field is focusable again.
    wantsRefocus.current = true;
    setLinkOpen(false);
  };

  const apply = () => {
    if (rejected) return;
    if (!restoreSelection()) return;
    // Empty clears the link rather than writing an empty href, so Apply on a blank field
    // is the same gesture as Remove.
    if (trimmed === "") document.execCommand("unlink");
    else document.execCommand("createLink", false, trimmed);
    setLinkOpen(false);
    onCommand?.();
  };

  const remove = () => {
    if (!restoreSelection()) return;
    document.execCommand("unlink");
    setLinkOpen(false);
    onCommand?.();
  };

  const btn =
    "grid size-[30px] place-items-center rounded-[var(--studio-radius-control,4px)] text-[15px] text-ink-950 transition-colors hover:bg-cream-200";
  // Layout only. Colour is per-button, because a shared `bg-white` here and a
  // `bg-accent-500` on the primary are the same Tailwind property — the generated sheet
  // decides which wins, not the order they appear in the string, and the primary loses.
  const action =
    "h-[30px] rounded-[var(--studio-radius-control,4px)] border border-[0.5px] px-[13px] text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
  const actionQuiet = `${action} border-ink-950/16 bg-white text-ink-950 hover:bg-cream-100`;
  const actionPrimary = `${action} border-accent-500 bg-accent-500 text-white hover:bg-accent-600`;

  return (
    <div
      // Marks the whole toolbar as part of the edit surface. The canvas hides the
      // toolbar when focus leaves for anything that is not a rich field, and the URL
      // input is not one — without this, opening the popover would close the toolbar
      // that contains it.
      data-rich-toolbar
      style={{ position: "fixed", top: at.top, left: at.left, zIndex: 60 }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && linkOpen) {
          e.preventDefault();
          closePopover();
        }
      }}
    >
      {/* PULLED ONTO THE FLOATING STEP, AND THIS ONE IS A REAL CHANGE RATHER THAN A RENAME.
          It carried `0 6px 20px -8px rgba(60,50,38,0.4)` — the only box-shadow in the studio using
          60,50,38 where every other used 60,45,30, and a reach of 12 where the tier it belongs to
          is 20. Both were drift rather than design: nothing else sits at either value and no
          comment ever claimed they were deliberate. Measured, the darkening moves 2.189 -> 2.530
          and the ink joins the other six. Declared here rather than folded into a rename, because
          five of the seven sites changed nothing and this one did. */}
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="inline-flex items-center gap-0.5 rounded-[var(--studio-radius-card,8px)] border border-[0.5px] border-ink-950/16 bg-cream-50 p-1 shadow-[var(--studio-lift-floating,0_18px_40px_-20px_rgba(60,45,30,0.45))]"
      >
        <button
          type="button"
          // mousedown, not click: the default would blur the field and end the selection
          // before the command could apply to it. Every button here does the same.
          onMouseDown={(e) => {
            e.preventDefault();
            document.execCommand("bold");
            onCommand?.();
          }}
          aria-label="Bold"
          title="Bold"
          className={`${btn} font-display font-bold`}
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            document.execCommand("italic");
            onCommand?.();
          }}
          aria-label="Italic"
          title="Italic"
          className={`${btn} font-display italic`}
        >
          I
        </button>
        <span aria-hidden className="mx-[3px] h-[18px] w-px bg-ink-950/16" />
        <button
          type="button"
          aria-label="Link"
          title="Link"
          aria-expanded={linkOpen}
          onMouseDown={(e) => {
            // preventDefault BEFORE reading the selection: the default mousedown would
            // collapse it, and the selection is the link text.
            e.preventDefault();
            if (linkOpen) {
              closePopover();
              return;
            }
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const node = range.startContainer;
            const el = (node.nodeType === 1 ? node : node.parentNode) as HTMLElement | null;
            const field = el?.closest?.("[data-edit-rich]") as HTMLElement | null;
            if (!field) return;
            const anchor = el?.closest?.("a") as HTMLAnchorElement | null;
            // Editing an existing link works from a caret INSIDE it; creating a new one
            // needs words to wrap.
            if (!anchor && sel.isCollapsed) return;
            saved.current = {
              range: anchor ? selectWholeAnchor(anchor) : range.cloneRange(),
              field,
            };
            setEditing(Boolean(anchor));
            setUrl(anchor?.getAttribute("href") ?? "");
            setLinkOpen(true);
          }}
          className={`${btn} underline ${linkOpen ? "bg-accent-500 text-white hover:bg-accent-500" : ""}`}
        >
          &#128279;
        </button>
      </div>

      {linkOpen && (
        /* ALSO PULLED ONTO THE FLOATING STEP. It carried `-18px / 0.4` where the tier is
           `-20px / 0.45` — near enough that nobody would have called it a different weight, far
           enough that it was a seventh value. Darkening 2.231 -> 2.530. */
        <div
          className="mt-1.5 w-[280px] rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-50 p-2.5 shadow-[var(--studio-lift-floating,0_18px_40px_-20px_rgba(60,45,30,0.45))]"
          role="dialog"
          aria-label="Link URL"
        >
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}
            aria-label="Link URL"
            aria-invalid={rejected}
            placeholder="https://, mailto: or /path"
            className={`h-[34px] w-full rounded-[var(--studio-radius-control,4px)] border border-[0.5px] bg-white px-2.5 text-[14px] text-ink-950 outline-none ${
              rejected
                ? "border-danger-600 ring-2 ring-danger-600/12"
                : "border-ink-950/16 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/15"
            }`}
          />
          <div className="mt-[9px] flex items-center justify-end gap-2">
            {rejected && (
              <span role="alert" className="mr-auto text-[12px] text-danger-600">
                Only http, https, mailto, or relative links
              </span>
            )}
            {editing && !rejected && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={remove} className={actionQuiet}>
                Remove
              </button>
            )}
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closePopover} className={actionQuiet}>
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={apply}
              disabled={rejected}
              className={`${actionPrimary} disabled:hover:bg-accent-500`}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** A range covering an entire anchor, so editing an existing link replaces all of it
 *  rather than the few characters the caret happened to sit in. */
function selectWholeAnchor(anchor: HTMLAnchorElement): Range {
  const r = document.createRange();
  r.selectNodeContents(anchor);
  return r;
}
