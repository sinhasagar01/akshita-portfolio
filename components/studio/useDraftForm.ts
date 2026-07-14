import { useRef, useState } from "react";

// PL-1 — the shared save/dirty/expand state machine behind the Surface-B studio
// panels (Hero, About, and future field groups). Behavior-identical to the two
// copies it replaces (GH-5b Hero, About-A/B/C About); the panel-specific parts
// ride on isDirty, buildCommitted, syncValuesOnSave, and onSaved.

export type SaveStatus = "idle" | "saving" | "saved" | "fs" | "error";

type SaveResponse = Record<string, unknown>;

type UseDraftFormOptions<T extends object> = {
  /** Seeded field values, read once from props (same "seeded once" behavior). */
  initial: T;
  /**
   * The object to POST and to become the new baseline, built from the current
   * values. Hero uses an identity copy so the posted patch is byte-identical to
   * the old { ...values }. About returns a copy with the chips trimmed.
   */
  buildCommitted: (values: T) => T;
  /** Whether the form differs from the saved baseline. Panel-specific — About's
   *  is array-aware over the chips. */
  isDirty: (values: T, baseline: T) => boolean;
  /**
   * When true, a successful save replaces the form values with the committed
   * object (About, to drop empty chip rows). When false (default), values are
   * left untouched on save (Hero), so mid-round-trip typing is never clobbered.
   */
  syncValuesOnSave?: boolean;
  /** Called on a successful (github-mode) save with the response JSON. Hero uses
   *  it to update its Unpublished (differs) badge; About omits it. */
  onSaved?: (json: SaveResponse) => void;
  /**
   * Extra fields merged into the POST body alongside `patch`. Default (omitted)
   * posts `{ patch }` — the singleton panels are unchanged. Collection panels
   * (CE-1) pass `{ collection, slug }` so the route can route the save to the
   * right entry file.
   */
  saveExtras?: Record<string, unknown>;
  /**
   * P4 4(b)-i — override the POST body shape. DEFAULT (omitted) posts
   * `{ ...saveExtras, patch: { ...committed } }`, byte-identical to before, so
   * every existing panel is untouched. The sections panel overrides it because
   * `sections` is its own top-level key, not a `patch` field — that is what keeps
   * the route's one-writer dispatch unambiguous (the text patch sanitizer still
   * rejects `sections`).
   */
  buildBody?: (committed: T, saveExtras: Record<string, unknown> | undefined) => unknown;
};

export function useDraftForm<T extends object>({
  initial,
  buildCommitted,
  isDirty,
  syncValuesOnSave = false,
  onSaved,
  saveExtras,
  buildBody,
}: UseDraftFormOptions<T>) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<T>(initial);
  // The last persisted (loaded or draft-saved) values. Local edits are measured
  // against this, so the "Unsaved changes" hint clears after a successful save.
  const [savedBaseline, setSavedBaseline] = useState<T>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // Synchronous in-flight guard: blur can fire twice before saveStatus updates
  // to "saving", so the state check alone lets a duplicate POST through. The ref
  // blocks the second call in the same tick (no commit spam).
  const savingRef = useRef(false);

  const dirty = isDirty(values, savedBaseline);

  function setField<K extends keyof T>(key: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (saveStatus !== "saving") setSaveStatus("idle"); // clear a stale "Draft saved" while typing
  }

  // On-blur (and Save button) auto-save. Posts the committed patch; DB-1 commits
  // it on top of the existing draft, so a partial patch accumulates.
  async function saveDraft() {
    if (!dirty || savingRef.current) return;
    savingRef.current = true;
    setSaveStatus("saving");
    const committed = buildCommitted(values);
    try {
      const res = await fetch("/api/studio/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildBody ? buildBody(committed, saveExtras) : { ...saveExtras, patch: { ...committed } }
        ),
      });
      const json = (await res.json().catch(() => ({}))) as SaveResponse;
      if (res.ok && json.ok && json.mode === "fs") {
        setSaveStatus("fs");
        return;
      }
      if (res.ok && json.ok && json.saved) {
        if (syncValuesOnSave) setValues(committed);
        setSavedBaseline(committed);
        onSaved?.(json);
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

  return { expanded, setExpanded, values, setField, savedBaseline, dirty, saveStatus, saveDraft, cancel };
}
