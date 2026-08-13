"use client";

// A two-option presentational switch, for the fold.
//
// ---- ⚠ WHY IT LEFT `BlogBlocksEditPanel` -----------------------------------------------------
//
// It was local to that panel and gallery is its SECOND consumer, which is this repository's
// threshold for lifting something into the seam. Blog imports it from here now; nothing about its
// behaviour changed.
//
// ---- ⚠ WHY `SegmentedToggle` IS STILL NOT REUSED ---------------------------------------------
//
// The original comment is kept because the trap it names is live and the two names read alike.
// Despite its name, `SegmentedToggle` is a PROJECTS-SPECIFIC CONTROL that POSTS a template or
// category patch on change — it takes `{ slug, patchKey, onSaved }` and writes. This one is a
// switch and writes nothing. Reaching for the wrong one would turn a view change into a save.
//
// ---- ⚠ WHAT IT IS FOR, WHICH IS THE PART A THIRD CONSUMER SHOULD READ ------------------------
//
// Below `INSPECTOR_FOLD_PX` the inspector pane is gone, so the canvas swaps between the preview and
// the fields and this is how an author moves between them. A panel that folds the inspector away
// WITHOUT one leaves the author looking at a preview and no form — which is exactly what gallery
// shipped, and it read from the outside as "the editor does not save".

export default function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-[var(--studio-radius-control,4px)] bg-studio-cream-200 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] font-semibold capitalize transition-colors ${
            value === o
              ? "bg-studio-cream-50 text-studio-ink-950 shadow-sm"
              : "text-studio-ink-600 hover:text-studio-ink-950"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
