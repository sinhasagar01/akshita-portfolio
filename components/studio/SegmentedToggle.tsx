"use client";

// Shared two-option segmented control for the projects panel header. Extracted
// verbatim from the copy-paste twins TemplateToggle (CS-6a) and CategoryToggle
// (PR #159), which the code itself described as "a near-exact mirror". One owner
// now holds the markup, the ARIA (role="group" + per-button aria-pressed), the
// optimistic-save-with-revert, and the useReportPending wiring — parameterised
// only by what the two call sites actually differ on: the draft patch key, the
// label and its aria-label, and the template caller's optional onChange (the
// category caller passes none).
//
// The options are hardcoded ["mobile","web"]: both callers use exactly this set
// and its "web else mobile" normalization, so an `options` prop would advertise
// a flexibility that does not exist.
//
// DELIBERATELY preserved asymmetry (carried over from TemplateToggle as-is):
// onChange fires on the optimistic set and on the fs-noop revert, but NOT on the
// network-failure else/catch revert, where only local state rolls back. On a
// network failure the parent's mirrored value therefore stays at `next` while
// this control reverts. If that is ever changed it should be a decision, not a
// cleanup.
import { useRef, useState } from "react";
import { useReportPending } from "./PublishProvider";

type Choice = "mobile" | "web";

export default function SegmentedToggle({
  slug,
  initial,
  patchKey,
  label,
  ariaLabel,
  onSaved,
  onChange,
}: {
  slug: string;
  initial: string;
  /** The projects-collection field this control writes to the draft. */
  patchKey: "template" | "category";
  /** Visible eyebrow label, e.g. "Template". */
  label: string;
  /** Accessible name for the button group, e.g. "Case study template". */
  ariaLabel: string;
  onSaved: () => void;
  /** Report the current value up, so a mirror (e.g. the canvas) recomposes as
   *  soon as it flips. Only the template caller supplies it. */
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const busyRef = useRef(false);
  useReportPending(busy);

  // "web" -> Web; anything else ("" / "mobile" / absent) -> Mobile.
  const selected: Choice = value === "web" ? "web" : "mobile";

  async function choose(next: Choice) {
    if (busyRef.current || next === selected) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    const prev = value;
    setValue(next); // optimistic
    onChange?.(next);
    try {
      const res = await fetch("/api/studio/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: "projects", slug, patch: { [patchKey]: next } }),
      });
      const json = await res.json();
      if (res.ok && json.saved) {
        onSaved();
      } else if (res.ok && json.mode === "fs") {
        setNote("needs github mode (dev)");
        setValue(prev); // fs no-op — nothing was saved
        onChange?.(prev);
      } else {
        setValue(prev);
        setNote("Save failed");
      }
    } catch {
      setValue(prev);
      setNote("Save failed");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">{label}</span>
      <div
        role="group"
        aria-label={ariaLabel}
        className="inline-flex rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 p-0.5"
      >
        {(["mobile", "web"] as const).map((opt) => {
          const on = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              disabled={busy}
              aria-pressed={on}
              className={[
                "rounded-[var(--studio-radius-control,4px)] px-2.5 py-1 text-[12px] font-medium capitalize transition-colors disabled:opacity-50",
                on ? "bg-accent-500 text-cream-50" : "text-ink-600 hover:text-ink-950",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {note && <span className="text-[10px] text-text-subtle">{note}</span>}
    </div>
  );
}
