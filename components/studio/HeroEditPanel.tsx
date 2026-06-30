"use client";

// GH-5a/5b — Hero edit panel (Surface B).
//
// GH-5a: collapsed card -> expand-to-panel, local-state fields.
// GH-5b: on-blur (and the Save button) auto-save the FULL form patch to the
// draft branch via the gated /api/studio/save-draft endpoint (the client never
// holds the token). Shows saving / saved / error states, a local "Unsaved
// changes" hint, and the server "Unpublished changes" (differs) badge.
// Publish stays stubbed (GH-5c). Writes the draft branch only, never main.
import { useRef, useState } from "react";
import { IconSparkles } from "./icons";

type Props = {
  heroCopy: string;
  positioningLine: string;
  photo: string | null;
  differs?: boolean;
};

type SaveStatus = "idle" | "saving" | "saved" | "fs" | "error";

export default function HeroEditPanel({ heroCopy, positioningLine, photo, differs }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState({ heroCopy, positioningLine });
  // The last persisted (loaded or draft-saved) values. Local edits are measured
  // against this, so after a successful draft save the "Unsaved changes" hint clears.
  const [savedBaseline, setSavedBaseline] = useState({ heroCopy, positioningLine });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [unpublished, setUnpublished] = useState(Boolean(differs));
  // Synchronous in-flight guard: blur can fire twice before React re-renders
  // saveStatus to "saving", so the state check alone lets a duplicate POST
  // through. The ref blocks the second call in the same tick (no commit spam).
  const savingRef = useRef(false);

  const dirty =
    values.heroCopy !== savedBaseline.heroCopy ||
    values.positioningLine !== savedBaseline.positioningLine;

  function edit(field: "heroCopy" | "positioningLine", v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
    if (saveStatus !== "saving") setSaveStatus("idle"); // clear a stale "Draft saved" while typing
  }

  // On-blur (and Save button) auto-save: posts the FULL form patch so the draft,
  // which is recreated from main on each commit, reproduces the complete state.
  async function saveDraft() {
    if (!dirty || savingRef.current) return;
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/studio/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: { ...values } }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setSaveStatus("fs");
        return;
      }
      if (res.ok && json.ok && json.saved) {
        setSavedBaseline({ ...values });
        setUnpublished(Boolean(json.differs));
        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2500);
        return;
      }
      setSaveStatus("error");
    } catch {
      setSaveStatus("error"); // the local edit is NOT lost — values remain
    } finally {
      savingRef.current = false;
    }
  }

  function cancel() {
    setValues({ ...savedBaseline }); // discard unsaved local edits, keep what was saved
    setSaveStatus("idle");
    setExpanded(false);
  }

  // ---- Collapsed card ----
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
          <span className="absolute right-2 top-2 flex items-center gap-1.5">
            {unpublished && (
              <span className="rounded-full bg-accent-500/10 px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide text-accent-600">
                Unpublished
              </span>
            )}
            <span className="rounded-full bg-accent-500/10 px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide text-accent-600">
              Editable
            </span>
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
          <p className="mt-1.5 truncate text-[12px] text-ink-600">{savedBaseline.heroCopy || "No hero copy"}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-400">
            {savedBaseline.positioningLine || "No positioning line"}
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
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconSparkles />
          </span>
          <span className="font-display text-base text-ink-950">Hero</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-500">
              Unsaved changes
            </span>
          )}
          {unpublished && (
            <span className="rounded-full border border-accent-500/35 px-2 py-0.5 text-[10px] text-accent-500">
              Unpublished changes
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
            onChange={(e) => edit("heroCopy", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Positioning line</span>
          <textarea
            rows={3}
            value={values.positioningLine}
            onChange={(e) => edit("positioningLine", e.target.value)}
            onBlur={saveDraft}
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
        <span className="text-[11px]" aria-live="polite">
          {saveStatus === "saving" && <span className="text-ink-500">Saving draft…</span>}
          {saveStatus === "saved" && <span className="text-accent-600">Draft saved</span>}
          {saveStatus === "error" && <span className="text-accent-600">Save failed — try again</span>}
          {saveStatus === "fs" && <span className="text-text-subtle">Draft save needs github mode (dev)</span>}
          {saveStatus === "idle" && (
            <span className="text-text-subtle">Auto-saves to draft on blur · Publish wired in GH-5c</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-disabled
            title="Not yet wired (GH-5c)"
            className="cursor-not-allowed rounded-md border border-accent-500/30 px-4 py-2 text-[13px] text-accent-500 opacity-40"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || saveStatus === "saving"}
            className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus === "saving" ? "Saving…" : "Save draft"}
          </button>
        </div>
      </footer>
    </section>
  );
}
