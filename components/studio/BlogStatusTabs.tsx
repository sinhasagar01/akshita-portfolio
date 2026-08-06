"use client";

// The status filter — All / Published / Drafts.
//
// ---- ⚠ THIS TAKES THE UNDERLINE AND THE VIEW SWITCHER BESIDE IT TAKES THE FILL --------------
//
// Two controls, both "a row of buttons above a list", deliberately in two languages. The rule is
// `studio-ink` C4's, and it is BY FUNCTION rather than by role — #263 replaced the older
// role-based wording when the owner overruled correction 29, and C4 keeps both so a reversal is
// not read as drift:
//
//     a two-state MODE switch        -> the accent FILL   (SegmentedToggle, Board|Editor, view)
//     a switch between CONTENT SETS  -> the UNDERLINE     (the hero tabs)
//
// STATUS SWAPS WHICH POSTS ARE SHOWN. Each option has its own set, so it is a switch between
// content sets, so it is the UNDERLINE. The view switcher shows the SAME posts arranged
// differently, so it is a mode switch, so it is the fill. **Do not unify them for tidiness** —
// the two treatments are the rule being applied, not a lapse in it.
//
// ---- IT IS A REAL TABLIST, WHICH IS MORE THAN AN ATTRIBUTE ----------------------------------
//
// `role="tab"` without the rest is a lie an author cannot see. A tablist owes: `aria-selected`,
// `aria-controls` naming the panel, a ROVING `tabIndex` so the group is ONE tab stop, and Arrow
// keys to move within it. All four are here, mirroring `HeroEditPanel`'s tablist, which is the
// only other one that does it properly.
//
// THE TYPE VALUES ARE NOT COPIED FROM THE HERO TABS, AND THAT IS DELIBERATE. Those are uppercase
// 12px/500 with 0.10em tracking because they MIMIC the public hero's tablist and `studio-ink`
// Part J enforces the mimic. These mimic nothing, so they take the contract's own sentence-case
// 12.5px. What IS shared is the SELECTION LANGUAGE — the 2px accent underline, the ink-950
// selected label, the ink-600 rest — because that is the part the rule is about.
import type { KeyboardEvent } from "react";

export type StatusFilter = "all" | "published" | "draft";

export default function BlogStatusTabs({
  value,
  onChange,
  counts,
  panelId,
}: {
  value: StatusFilter;
  onChange: (next: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  /** The element these tabs control — a tablist that names no panel is decoration. */
  panelId: string;
}) {
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts" },
  ];

  // ARROW KEYS MOVE WITHIN THE GROUP, which is the half of a tablist that Tab cannot do: the
  // roving tabIndex makes the whole strip one stop, so without this the other two are unreachable
  // from the keyboard entirely.
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(i + step + tabs.length) % tabs.length];
    onChange(next.key);
    // Selection follows focus, so the newly selected tab must actually receive it.
    const strip = e.currentTarget.parentElement;
    const btn = strip?.querySelectorAll("button")[tabs.indexOf(next)];
    (btn as HTMLButtonElement | undefined)?.focus();
  }

  return (
    <div role="tablist" aria-label="Status" className="flex gap-5 border-b border-studio-ink-950/12">
      {tabs.map((t, i) => {
        const on = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 pt-2 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500 ${
              on
                ? "border-studio-accent-500 text-studio-ink-950"
                : "border-transparent text-studio-ink-600 hover:text-studio-ink-950"
            }`}
          >
            {t.label}
            {/* The count is the tab's own denominator. It is what makes "Drafts" worth pressing
                before you press it, and what makes an empty bucket visible without a click. */}
            {/* ⚠ ONE COLOUR, NOT TWO. The inactive count was `ink-400`, which measures 3.49 on
                cream-50 against a 4.5 floor — a live AA failure at every width, and the exact
                number `studio-ink-contrast` H4 already had on record for ink-400 on cream. There
                is no `ink-500` to retreat to (it is a phantom token that emits nothing, hazard
                23), so ink-600 is the only passing step below ink-800.
                THE COLOUR WAS DOING TWO JOBS AND ONE OF THEM COST AA. It marked selection AND kept
                the number quiet. Selection is already carried three other ways — the tab's
                `border-accent-500`, its label at ink-950 against the inactive ink-600, and
                `aria-selected` — so dropping the count's colour distinction removes a fourth
                signal from a control that has three. The count is data the author reads before
                deciding what to press; it should not be the dimmest thing on the row. */}
            <span className="text-studio-ink-600">{counts[t.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
