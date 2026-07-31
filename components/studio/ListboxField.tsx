"use client";

// THE LISTBOX — a custom select for CONTENT fields, where SelectField is for CONFIG toggles.
//
// THE SPLIT RULE, RECORDED SO THE NEXT SELECT IS PICKED BY RULE RATHER THAN COPY-PASTE. This
// listbox is for a field the author reasons ABOUT — the blog topic, its one consumer today. The
// native `SelectField` (blocks/fields.tsx) is for a config toggle inside a block shell — variant,
// layout, frame. That is not a stylistic preference: `CaseStudySwitcher`'s header already records
// that a native `<select>` is keyboard- and screen-reader-correct for free and strictly better
// for that second kind of control. So two select shapes coexist ON PURPOSE, by ROLE.
// THE MIGRATION TRIGGER, named so this does not become drift: migrate the four SelectField sites
// to this component IF one of them ever needs this treatment, or IF the four begin to look wrong
// beside it. Until then SelectField stays. The API mirrors SelectField's on purpose, so that
// migration is a wiring change rather than a second implementation.
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
import { labelCls } from "./blocks/fields";

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
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  onBlur?: () => void;
  hint?: string;
  /** Human label per option value — the empty option's "No topic yet" comes through here, the
   *  same contract SelectField uses. Defaults to the value itself. */
  optionLabel?: (v: T) => string;
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

  function commit(i: number) {
    onChange(options[i]);
    setOpen(false);
    triggerRef.current?.focus();
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
      <span id={labelId} className={labelCls}>{label}</span>

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
            scroll so it fits even on a short pane, which is what makes the flip enough. */}
        <div
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          aria-hidden={!open}
          style={{ maxHeight: maxH }}
          className={
            "absolute inset-x-0 z-40 overflow-y-auto rounded-[var(--studio-radius-card,8px)] " +
            "border border-ink-950/12 bg-cream-50 p-[5px] shadow-[0_8px_30px_rgba(60,45,30,0.14)] " +
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
