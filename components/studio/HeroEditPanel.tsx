"use client";

// GH-5a — Hero edit panel (Surface B). PURE UI, writes NOTHING.
//
// Collapsed: a card showing the current Hero values. Activating it expands to an
// edit panel with local-state fields. Save and Publish are stubbed (disabled) and
// the onBlur hook is a deliberate no-op — GH-5b wires the draft auto-save, GH-5c
// wires publish. No commitSiteSettings, no publishSiteSettings, no API calls.
import { useState } from "react";
import { IconSparkles } from "./icons";

type Props = {
  heroCopy: string;
  positioningLine: string;
  photo: string | null;
};

export default function HeroEditPanel({ heroCopy, positioningLine, photo }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState({ heroCopy, positioningLine });

  const dirty =
    values.heroCopy !== heroCopy || values.positioningLine !== positioningLine;

  function handleBlur() {
    // GH-5b: draft auto-save will call the draft-write (commit to the draft
    // branch) here. Intentionally a no-op in GH-5a — nothing is written.
  }

  function cancel() {
    setValues({ heroCopy, positioningLine }); // discard local edits
    setExpanded(false);
  }

  // ---- Collapsed card (mirrors the ContentCard look) ----
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
        className="group block w-full overflow-hidden rounded-xl border border-ink-950/8 bg-cream-50 text-left transition-colors hover:border-accent-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
      >
        <div className="relative flex h-16 items-center justify-center bg-cream-200 text-accent-500">
          <span className="absolute left-3 top-2 font-display text-sm italic text-ink-400" aria-hidden>
            01
          </span>
          <span className="absolute right-2 top-2 rounded-full bg-accent-500/10 px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide text-accent-600">
            Editable
          </span>
          <span className="[&>svg]:size-5" aria-hidden>
            <IconSparkles />
          </span>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[15px] leading-snug text-ink-950">Hero</span>
            <span className="text-[11px] text-accent-500 opacity-0 transition-opacity group-hover:opacity-100">
              Edit →
            </span>
          </div>
          <p className="mt-1.5 truncate text-[12px] text-ink-600">{heroCopy || "No hero copy"}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-400">
            {positioningLine || "No positioning line"}
          </p>
        </div>
      </button>
    );
  }

  // ---- Expanded edit panel ----
  return (
    <section
      aria-label="Edit Hero"
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconSparkles />
          </span>
          <span className="font-display text-base text-ink-950">Hero</span>
          {dirty && (
            <span className="rounded-full border border-accent-500/35 px-2 py-0.5 text-[10px] text-accent-500">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Hero copy</span>
          <input
            type="text"
            value={values.heroCopy}
            onChange={(e) => setValues((v) => ({ ...v, heroCopy: e.target.value }))}
            onBlur={handleBlur}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Positioning line</span>
          <textarea
            rows={3}
            value={values.positioningLine}
            onChange={(e) => setValues((v) => ({ ...v, positioningLine: e.target.value }))}
            onBlur={handleBlur}
            className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Photo</span>
          <div className="flex items-center gap-3 rounded-md border border-dashed border-ink-950/12 bg-cream-100 px-3 py-2">
            <span className="text-[12px] text-ink-600">{photo || "No photo"}</span>
            <span className="ml-auto text-[10px] text-text-subtle">read-only, managed in Keystatic</span>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/8 bg-cream-100 px-4 py-3">
        <span className="text-[10px] text-text-subtle">Save and Publish are wired in GH-5b / GH-5c</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-disabled
            title="Not yet wired (GH-5b)"
            className="cursor-not-allowed rounded-md border border-accent-500/30 px-4 py-2 text-[13px] text-accent-500 opacity-40"
          >
            Publish
          </button>
          <button
            type="button"
            disabled
            aria-disabled
            title="Not yet wired (GH-5b)"
            className="cursor-not-allowed rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 opacity-40"
          >
            Save draft
          </button>
        </div>
      </footer>
    </section>
  );
}
