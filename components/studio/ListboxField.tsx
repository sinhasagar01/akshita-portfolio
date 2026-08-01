"use client";

// THE LISTBOX — the studio's ONE select. Every closed choice in /studio comes through here.
//
// ---- THE BY-ROLE SPLIT THIS FILE USED TO DESCRIBE IS DELETED (#251) -------------------------
//
// WHAT IT SAID, KEPT BECAUSE THE REASONING WAS SOUND AND ONLY THE CONDITION CHANGED: this
// listbox was for a field the author reasons ABOUT (the blog topic), and the native
// `SelectField` was for a config toggle inside a block shell (variant, layout, frame ×2). That
// was not taste — a native `<select>` is keyboard- and screen-reader-correct for free, cannot
// trap focus, and gets the platform picker on touch, which is strictly better for a toggle.
// Two select shapes coexisted ON PURPOSE, by ROLE.
//
// AND IT NAMED ITS OWN UNDOING: "migrate the four IF one needs this treatment, or IF they begin
// to look wrong beside it." The owner reported the second. **A recorded decision reversed by the
// condition it named**, which is the reversal this project wants — the rule did its job by
// telling us when it stopped applying, so this is not drift.
//
// SO `SelectField` IS GONE, not left unused. Zero consumers is the shape this project deletes:
// `FIT_THRESHOLD_PX` shipping with none, `--radius-2xl` below `--radius-xl`, the eleven ink-700
// sites, `.blog-editable.is-selected`. An unused component is the same defect in a friendlier
// costume.
//
// THE COST THAT WAS ACCEPTED, AND ITS TRIGGER. The one thing the native select gave that this
// cannot is the PLATFORM PICKER ON TOUCH, and /studio renders below `lg`. Five sites now lose it,
// the switcher most of all — it is chrome on every case-study page and the likeliest control to
// be reached on a phone.
// **IF THE SWITCHER IS WORSE ON A PHONE, THE REMEDY IS A RESTORE, NOT A REBUILD:**
//     git show 2ebe6b9:components/studio/blocks/fields.tsx
// `SelectField` is the ~50-line block above `CheckField` there. A trigger whose remedy is a
// rebuild is a trigger nobody acts on, so the sha is written down rather than described.
//
// WHAT THE NATIVE SELECT GAVE FREE AND THIS NOW WRITES: arrow/Home/End/Enter/Space/Escape, the
// aria roles and state, the active-descendant relationship, focus returning to the trigger on
// close, and — because the panel caps its height and scrolls — scrolling the active option into
// view. TYPE-AHEAD IS DROPPED, and the reason is a TRIGGER not a count: it is dropped while every
// option is visible without scrolling, and the moment the panel scrolls (which is also when
// scroll-into-view starts to matter) it should be reconsidered. One condition covers both.
//
// FOCUS STAYS ON THE TRIGGER (the select-only combobox pattern, like StudioSearch): options are
// non-focusable `role="option"` divs, the trigger is the only tab stop, arrows move
// `aria-activedescendant`. So "focus returns to the trigger on close" holds by construction —
// focus never left it.
//
// MOTION IS PURE CSS, covered by the global reduced-motion reset (globals.css). The panel stays
// mounted; a `data-open` toggle drives opacity + translate + the chevron rotate through CSS
// transitions, which the `prefers-reduced-motion` reset zeroes. Critically the ROTATION is a
// STATE class (open ? rotate-180 : ""), NOT gated on motion — only its TRANSITION is — so a
// reduced-motion reader keeps the open/closed affordance and loses only the animation. Gating the
// transform itself would be the #198 defect: an affordance lost to a motion setting.
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FIXED_KEY_CLS, KeyConnector } from "./blocks/fields";

// The box mirrors `inputCls` (blocks/fields.tsx:167) EXACTLY — control radius, /12 hairline,
// cream-50 well, 44px min-height, px-3, 14px ink — so a closed trigger is indistinguishable from
// the Dek/Date inputs beside it. It does NOT spread inputCls, because inputCls rings on `:focus`
// (which fires on a mouse click) and a button should ring only on a KEYBOARD open. Same accent
// ring, gated to `focus-visible` — consistent language, correct for a button, and the #209-safe
// path (a real Tab, not a programmatic focus, is what lights it).
const TRIGGER_CLS =
  "flex w-full min-h-11 items-center justify-between gap-2 rounded-[var(--studio-radius-control,4px)] " +
  "border border-ink-950/12 bg-cream-50 px-3 py-2 text-left text-[14px] text-ink-950 outline-none " +
  "transition-colors hover:bg-cream-100 " +
  "focus-visible:border-accent-500 focus-visible:ring-1 focus-visible:ring-accent-500/30";

// Panel geometry, used by the flip measurement. Must match the panel/option classes below:
// OPTION_H = h-10 (40px), PANEL_PAD = p-[5px], GAP = mt-1.5/mb-1.5 (6px), PANEL_MAX = max-h-[280px].
const OPTION_H = 40;
const PANEL_PAD = 5;
const GAP = 6;
const MARGIN = 8; // breathing room kept between the panel and the pane edge
const PANEL_MAX = 280;

export function ListboxField<T extends string>({
  label,
  value,
  options,
  onChange,
  onBlur,
  hint,
  optionLabel,
  labelHidden,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  onBlur?: () => void;
  hint?: string;
  /** Human label per option value — the empty option's "No topic yet" comes through here, the
   *  contract the deleted SelectField used, kept because five more consumers now rely on it —
   *  the switcher maps a slug to its title through here. Defaults to the value itself. */
  optionLabel?: (v: T) => string;
  /** Hide the label VISUALLY while keeping it as the trigger's accessible name. Added for
   *  `CaseStudySwitcher`, which is chrome in a header row rather than a field in a column — an
   *  eyebrow above it would be a form label floating in the topbar. `sr-only` rather than
   *  omitting the span, because `aria-labelledby` points at it: dropping the element would leave
   *  the trigger unnamed, which is the accessible-name defect this control was careful to avoid. */
  labelHidden?: boolean;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState(false); // true = open upward (no room below)
  const [maxH, setMaxH] = useState(PANEL_MAX); // capped to the room on the chosen side

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const labelOf = (v: T) => (optionLabel ? optionLabel(v) : v);
  const selectedIndex = Math.max(0, options.indexOf(value));

  // OPEN: seed the active option to the current value and decide direction. The clip fix — the
  // inspector is overflow-y-auto and an absolute panel would be cut at the pane edge. Measure the
  // room below the trigger within the nearest scroll container; if the panel does not fit below
  // but fits better above, flip. The panel also caps its height and scrolls, so neither side ever
  // clips outright. Measured in a layout effect so the DOM is placed before we read it.
  //
  // THE FLIP IS THE COMMON PATH NOW, NOT AN EDGE CASE (#251). It was built for the blog topic
  // field, which never flips. Measured across the case-study inspector's deep sites — a Frame
  // picker inside an expanded device row — it flipped up in NINE of twelve visible-trigger
  // positions in the aside, and nine of twenty below the fold. Do not treat this branch as rare.
  //
  // ROOM IS ONLY MEANINGFUL FOR A TRIGGER THAT IS ACTUALLY VISIBLE. `above`/`below` are computed
  // from the scroller's bounds without clamping, so a trigger scrolled out of the band reports
  // NEGATIVE room. That is noise rather than a case — a person can only open a trigger they can
  // see — but it is why any measurement of this must filter to visible triggers first.
  //
  // THREE SCROLLERS REACH THIS CODE, not the one it was written against: the 320px inspector
  // aside above #240's fold, `ThreePaneShell`'s canvas slot below it (a different box, different
  // height and width), and `BODY` for the case-study switcher in the editor's header row.
  function openNow() {
    setActive(selectedIndex);
    setOpen(true);
  }
  useLayoutEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    // nearest scrolling ancestor (the inspector); fall back to the viewport
    let node: HTMLElement | null = trigger.parentElement;
    let scroller: HTMLElement | null = null;
    while (node) {
      const oy = getComputedStyle(node).overflowY;
      if (oy === "auto" || oy === "scroll") { scroller = node; break; }
      node = node.parentElement;
    }
    const tr = trigger.getBoundingClientRect();
    const bounds = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const needed = options.length * OPTION_H + PANEL_PAD * 2;
    const below = bounds.bottom - tr.bottom;
    const above = tr.top - bounds.top;
    // Flip up only when there is not enough room below AND above is roomier. Then CAP the panel to
    // whichever side it opens toward, so it fits even when NEITHER side can hold it whole — that is
    // what makes the flip enough without a portal. `MARGIN` keeps it off the pane edge; the panel's
    // own overflow-y-auto scrolls the overflow.
    const up = below < needed + GAP && above > below;
    setFlip(up);
    setMaxH(Math.max(OPTION_H * 2, Math.min(PANEL_MAX, (up ? above : below) - GAP - MARGIN)));
  }, [open, options.length, selectedIndex]);

  // Keep the active option in view. `block: "nearest"` and no `behavior` means an INSTANT scroll,
  // so this never introduces script-driven motion the reduced-motion reset cannot reach (#197).
  useLayoutEffect(() => {
    if (open) optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // Close on a pointer outside the whole control. Options live inside `rootRef`, so an option
  // click never triggers this.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  // CLOSE FIRST, THEN COMMIT — AND THIS IS THE RIGHT ORDER GENERALLY, not a concession to one
  // consumer. A panel that stays open while the value changes underneath it is wrong in every
  // case; the four form fields merely HIDE it, because nothing moves when their value lands.
  // `CaseStudySwitcher`'s `onChange` is a `router.push`, which is simply the case where it
  // becomes visible — a listbox left hanging over a route transition.
  //
  // Focus is taken back to the trigger BEFORE the commit too, so the navigating consumer cannot
  // leave focus on a node its own re-render is about to detach.
  function commit(i: number) {
    setOpen(false);
    triggerRef.current?.focus();
    onChange(options[i]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const len = options.length;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openNow();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setActive((a) => (a + 1) % len); break;
      case "ArrowUp": e.preventDefault(); setActive((a) => (a - 1 + len) % len); break;
      case "Home": e.preventDefault(); setActive(0); break;
      case "End": e.preventDefault(); setActive(len - 1); break;
      case "Enter":
      case " ": e.preventDefault(); commit(active); break;
      case "Escape": e.preventDefault(); setOpen(false); triggerRef.current?.focus(); break;
      case "Tab": setOpen(false); break; // let focus leave naturally
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {/* A SPAN, not a <label> — a wrapping <label> names an <input> but not a <button>, so the
          trigger is named with aria-labelledby instead. */}
      {/* The pill's key row, unless the consumer hides the label (the case-study switcher, which
          is chrome in a header row). `id` stays on the span because `aria-labelledby` points at
          it — the trigger would be unnamed without it. */}
      {labelHidden ? (
        <span id={labelId} className="sr-only">{label}</span>
      ) : (
        <>
          <span id={labelId} className={FIXED_KEY_CLS}>{label}</span>
          <KeyConnector />
        </>
      )}

      <div ref={rootRef} className="relative" data-open={open}>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={labelId}
          aria-activedescendant={open ? optId(active) : undefined}
          onClick={() => (open ? setOpen(false) : openNow())}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          className={TRIGGER_CLS}
        >
          <span className={`truncate ${value === "" ? "text-text-subtle" : ""}`}>{labelOf(value)}</span>
          {/* The rotation is a STATE class (see header — the #198 guard); only the transition is
              motion, which the reduced-motion reset zeroes. */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-[15px] shrink-0 text-ink-600 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-expo)] ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* The panel is a FLOATING surface → CARD radius (#211), matching the modal, toolbar and
            popover; the /12 hairline and the dropdown shadow match StudioSearch's results panel.
            Always mounted so the open/close transition can run; aria-hidden + pointer-events-none
            when closed so its options are inert to AT and the mouse. Capped height + internal
            scroll so it fits even on a short pane, which is what makes the flip enough.

            `z-40` IS LOAD-BEARING AND ITS MARGIN IS THIN (#251). A flipped-up panel in the
            case-study inspector OVERLAPS that pane's `sticky top-0 z-10` section header. It is
            harmless only because 40 > 10 — move either number and the panel goes BEHIND the
            header, where the symptom reads as a clipping bug rather than a stacking one. Pinned
            in `studio-ink` rather than left to be rediscovered. */}
        <div
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          aria-hidden={!open}
          style={{ maxHeight: maxH }}
          className={
            "absolute inset-x-0 z-40 overflow-y-auto rounded-[var(--studio-radius-card,8px)] " +
            "border border-ink-950/12 bg-cream-50 p-[5px] shadow-[var(--studio-lift-popover,0_8px_30px_rgba(60,45,30,0.14))] " +
            "transition-[opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-expo)] " +
            (flip ? "bottom-full mb-1.5 origin-bottom " : "top-full mt-1.5 origin-top ") +
            (open
              ? "translate-y-0 opacity-100 "
              : `pointer-events-none opacity-0 ${flip ? "translate-y-1.5" : "-translate-y-1.5"}`)
          }
        >
          {options.map((opt, i) => {
            const selected = opt === value;
            const isActive = i === active;
            return (
              <div
                key={opt}
                ref={(el) => { optionRefs.current[i] = el; }}
                id={optId(i)}
                role="option"
                aria-selected={selected}
                data-active={isActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={
                  "flex h-10 cursor-pointer items-center justify-between gap-2 rounded-[var(--studio-radius-control,4px)] px-2.5 text-[13.5px] " +
                  (isActive || selected ? "bg-cream-100 text-ink-950 " : opt === "" ? "text-text-subtle " : "text-ink-800 ") +
                  (selected ? "font-medium" : "")
                }
              >
                <span className="truncate">{labelOf(opt)}</span>
                {/* The CHECK, not the 3px selection bar — the bar marks a persistent selection in
                    a list you navigate; a dropdown option is a transient choice in a list you
                    dismiss. The check reads as "this is the current value", which it is. */}
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`size-[15px] shrink-0 text-accent-500 ${selected ? "opacity-100" : "opacity-0"}`}
                >
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>

      {hint && <span className="text-[10px] text-text-subtle">{hint}</span>}
    </div>
  );
}
