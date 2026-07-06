"use client";

// About-A — About edit panel (Surface B), the second inline-editable settings
// group after Hero. Mirrors the Hero panel's proven save-draft pattern but
// carries only the save half: this panel has NO Publish. Publish is
// singleton-wide (it merges the whole settings draft into main) and lives on the
// Hero panel, which ships this panel's edits too via the DB-1 accumulating draft.
//
// The save posts a PARTIAL patch of only { aboutCopy, aboutNote } — DB-1 commits
// on top of the existing draft, so this never clobbers the Hero form's edits.
// (A shared useDraftForm hook is deferred to the third form — rule of three.)
import { useRef, useState } from "react";
import { IconUser } from "./icons";

type Props = {
  aboutCopy: string;
  aboutNote: string;
};

type AboutFields = { aboutCopy: string; aboutNote: string };
const ABOUT_FIELD_KEYS = ["aboutCopy", "aboutNote"] as const;

type SaveStatus = "idle" | "saving" | "saved" | "fs" | "error";

export default function AboutEditPanel({ aboutCopy, aboutNote }: Props) {
  const initial: AboutFields = { aboutCopy, aboutNote };
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<AboutFields>(initial);
  const [savedBaseline, setSavedBaseline] = useState<AboutFields>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // Synchronous in-flight guard: blur can fire twice before saveStatus updates,
  // letting a duplicate POST through. The ref blocks the second call same-tick.
  const savingRef = useRef(false);

  const dirty = ABOUT_FIELD_KEYS.some((k) => values[k] !== savedBaseline[k]);

  function edit(field: keyof AboutFields, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
    if (saveStatus !== "saving") setSaveStatus("idle"); // clear a stale "Draft saved" while typing
  }

  // On-blur (and Save button) auto-save. Posts ONLY the About fields; DB-1
  // accumulates them onto the existing draft without touching Hero's edits.
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
        className="group mt-3.5 block w-full overflow-hidden rounded-xl border border-ink-950/8 bg-cream-50 text-left transition-colors hover:border-accent-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
      >
        <div className="relative flex h-16 items-center justify-center bg-cream-200 text-accent-500">
          <span className="absolute left-3 top-2 font-display text-sm italic text-ink-400" aria-hidden>
            02
          </span>
          <span className="absolute right-2 top-2 rounded-full bg-accent-500/10 px-2 py-[3px] text-[9.5px] font-medium uppercase tracking-wide text-accent-600">
            Editable
          </span>
          <span className="[&>svg]:size-5" aria-hidden>
            <IconUser />
          </span>
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[15px] leading-snug text-ink-950">About</span>
            <span className="text-[11px] text-accent-500 opacity-0 transition-opacity group-hover:opacity-100">
              Edit →
            </span>
          </div>
          <p className="mt-1.5 truncate text-[12px] text-ink-600">{savedBaseline.aboutCopy || "No about copy"}</p>
          <p className="mt-0.5 truncate text-[11px] text-ink-400">{savedBaseline.aboutNote || "No note line"}</p>
        </div>
      </button>
    );
  }

  // ---- Expanded edit panel ----
  return (
    <section
      aria-label="Edit About"
      className="mt-3.5 overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconUser />
          </span>
          <span className="font-display text-base text-ink-950">About</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-500">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          // preventDefault on mousedown keeps focus on the edited field, so the
          // blur auto-save never fires for edits the click is about to discard
          // (H1.1). Keyboard Tab still blur-saves by design.
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">About bio</span>
          <textarea
            rows={7}
            value={values.aboutCopy}
            onChange={(e) => edit("aboutCopy", e.target.value)}
            onBlur={saveDraft}
            className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
          <span className="text-[10px] text-text-subtle">
            The first paragraph is the large lead. A blank line starts a new paragraph.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">About note</span>
          <input
            type="text"
            value={values.aboutNote}
            onChange={(e) => edit("aboutNote", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/8 bg-cream-100 px-4 py-3">
        <span className="text-[11px]" aria-live="polite">
          {saveStatus === "saving" ? (
            <span className="text-ink-500">Saving draft…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-accent-600">Draft saved</span>
          ) : saveStatus === "error" ? (
            <span className="text-accent-600">Save failed. Try again.</span>
          ) : saveStatus === "fs" ? (
            <span className="text-text-subtle">Draft save needs github mode (dev)</span>
          ) : (
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish from the Hero panel.</span>
          )}
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={!dirty || saveStatus === "saving"}
          className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
    </section>
  );
}
