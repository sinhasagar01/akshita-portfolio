"use client";

// The presentational half of the studio's two-state MODE switch — role="group", per-button
// aria-pressed, and the accent FILL on the pressed one.
//
// ---- WHY THIS EXISTS, AND WHY IT IS NOT `SegmentedToggle` ------------------------------------
//
// The rule is already written down, at `HeroEditPanel.tsx` and in `studio-ink` Part C:
//
//     role="group" + aria-pressed    -> the accent FILL
//     role="tablist" + aria-selected -> the UNDERLINE
//
// and the FILL side already had THREE consumers before this one — `SegmentedToggle` (Template,
// Category), Board|Editor, and Canvas|Inspector. Only the first is a component; the other two
// are hand-copied markup inside `SectionsEditPanel`. The view switcher would have been the
// FOURTH copy, which is the drift this project has deleted three times.
//
// `SegmentedToggle` COULD NOT BE REUSED, and not for a reason a prop would fix. Its options are
// hardcoded `["mobile","web"]` with a "web else mobile" normalisation, and it does not merely
// render a switch — it POSTs a draft patch, so it requires a `slug`, a `patchKey` and an
// `onSaved`. The view switcher has no slug and writes no draft. Making it fit would mean adding
// the `options` prop its own comment refuses ("would advertise a flexibility that does not
// exist") AND making the network call optional, which is two components wearing one name.
//
// SO THIS TAKES THE SHELL AND NOTHING ELSE. It renders; it does not persist. Every class string
// here is READ OFF `SegmentedToggle`'s existing markup rather than re-derived, so the two agree
// by construction and `studio-ink` C4 can compare them.
//
// ⚠ THE OTHER THREE ARE DELIBERATELY NOT MIGRATED IN THE PR THAT ADDS THIS. `SegmentedToggle` is
// pinned by `studio-ink` C4 and `studio-labels` E3 and has two live call sites that post drafts;
// converting it alongside a new index would put a shared control's regression and a new screen's
// bugs in one diff. They are named here as the consumers to migrate NEXT, which is the honest
// version of "extract at the second consumer" when the second consumer is already load-bearing.
//
// NO fs-noop QUIRK HERE. #164's asymmetry — `onChange` firing on the revert but not on the
// network-failure revert — is a property of `SegmentedToggle`'s SAVE path. This has no save
// path, so the quirk has nothing to apply to.
import type { ReactNode } from "react";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Rendered before the label. Decorative — the label is the accessible name. */
  icon?: ReactNode;
};

export default function SegmentedGroup<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Accessible name for the group, e.g. "View". */
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-50 p-0.5"
    >
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={on}
            className={[
              "inline-flex items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] font-semibold transition-colors [&>svg]:size-3.5",
              on ? "bg-studio-accent-500 text-studio-cream-50" : "text-studio-ink-600 hover:text-studio-ink-950",
            ].join(" ")}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
