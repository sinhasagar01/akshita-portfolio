import { useRef, useState } from "react";
import { usePublishSignal } from "./PublishProvider";

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
  /** ⚠ WHAT THE SAVE TOAST CALLS THIS THING. Optional: a panel that passes nothing raises no toast,
   *  so adding the surface did not change every existing call site. The string is the panel's own
   *  ("Site settings", "Blog · a-slug") because only the caller knows what it is editing. */
  toastLabel?: string;
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
  toastLabel,
  saveExtras,
  buildBody,
}: UseDraftFormOptions<T>) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<T>(initial);
  // The last persisted (loaded or draft-saved) values. Local edits are measured
  // against this, so the "Unsaved changes" hint clears after a successful save.
  const [savedBaseline, setSavedBaseline] = useState<T>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // WHEN THE LAST SAVE LANDED, AND IT CANNOT BE DERIVED FROM `saveStatus`. That flips back to
  // "idle" 2500ms after "saved" (below), so by the time the bar wants to say "Saved 2 minutes
  // ago" the status has read "idle" for nearly two minutes. The timestamp is the only thing that
  // survives long enough to age.
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Synchronous in-flight guard: blur can fire twice before saveStatus updates
  // to "saving", so the state check alone lets a duplicate POST through. The ref
  // blocks the second call in the same tick (no commit spam).
  const { beginToast, resolveToast, dismissToast } = usePublishSignal();
  const savingRef = useRef(false);
  /** A save was requested while one was in flight, so one is OWED once it settles.
   *  This is the whole difference between coalescing and dropping — see saveDraft. */
  const saveOwedRef = useRef(false);

  // THE LATEST-REF PAIR, AND THEY ARE WHAT MAKE THE RETRY CORRECT RATHER THAN HARMFUL.
  //
  // `saveDraft` closes over `values` and `savedBaseline` from the render that created it. A
  // retry that re-invoked that same closure would re-post the PRE-EDIT snapshot — #174's
  // defect exactly, the one #187 built its `pendingSave` machinery to dodge. So the retry
  // must not read the closure; it reads these.
  //
  // ⚠ THE REF IS WRITTEN SYNCHRONOUSLY BY `applyValues` AND *ALSO* ON EVERY RENDER, AND THE
  // FIRST HALF IS NEW BECAUSE THE SECOND WAS NOT ENOUGH. This used to be the render assignment
  // alone, with a note that one line has no list of sites to keep in sync. The note's principle
  // was right and its consequence was wrong: an assignment that happens ON RENDER makes the ref
  // "the values as of the last render", while `saveDraft` reads it as "the latest values". Those
  // are the same thing only when nothing calls `saveDraft` before React re-renders.
  //
  // The blog status control did exactly that. It set a field and asked to save in the same tick,
  // the dirty check read the PRE-EDIT values, found them equal to the baseline, and RETURNED
  // WITHOUT SAVING — no request, no error, no indicator. An author could set a post to Published,
  // press Publish site, and get a draft, which is what happened.
  //
  // ⚠ AND THE ONE-SITE PRINCIPLE IS KEPT RATHER THAN ABANDONED. `applyValues` is the single
  // mutation path — setField, the syncValuesOnSave branch and cancel all go through it — so there
  // is still one line to keep in sync and still no site to miss. The render assignment stays as a
  // backstop for any future path that sets state directly.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  /** The ONE place values change. Writes the ref synchronously so a save requested in the same
   *  tick sees the edit, then schedules the render. */
  function applyValues(next: T) {
    valuesRef.current = next;
    setValues(next);
  }
  const baselineRef = useRef(savedBaseline);
  baselineRef.current = savedBaseline;

  const dirty = isDirty(values, savedBaseline);

  function setField<K extends keyof T>(key: K, value: T[K]) {
    applyValues({ ...valuesRef.current, [key]: value });
    if (saveStatus !== "saving") setSaveStatus("idle"); // clear a stale "Draft saved" while typing
  }

  // On-blur (and Save button) auto-save. Posts the committed patch; DB-1 commits
  // it on top of the existing draft, so a partial patch accumulates.
  //
  // AN OVERLAPPING SAVE IS COALESCED, NOT DROPPED. This used to read
  // `if (!dirty || savingRef.current) return;` — a save requested while another was in
  // flight returned and scheduled NOTHING. The author's second edit stayed in `values` and
  // `dirty` stayed true, so the state was honest, but the save simply never happened until
  // some later blur or the Save button. A save takes under two seconds against GitHub, so
  // the overlap window is routine rather than theoretical, and the loss was silent.
  //
  // DO NOT SIMPLIFY THE GUARD BACK TO A BARE `return`. It loses author data and nothing
  // else in the repo would catch it, which is why ralph asserts this shape.
  async function saveDraft() {
    if (savingRef.current) {
      saveOwedRef.current = true;
      return;
    }
    // Read through the ref, not the closure — see the latest-ref note above. A stale read
    // here would post the pre-edit snapshot and look like a working retry.
    if (!isDirty(valuesRef.current, baselineRef.current)) return;
    savingRef.current = true;
    setSaveStatus("saving");
    /* ⚠ ONE CARD PER SAVE OPERATION, NOT PER BLUR. Coalesced saves re-enter through the guard
       above, so this runs once per settle and the owed-save retry resolves the SAME id — a card
       per keystroke would flood a three-card stack in a second of typing. */
    const toastId = toastLabel ? beginToast("Saving draft…", toastLabel) : null;
    const committed = buildCommitted(valuesRef.current);
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
        /* fs mode wrote nothing to a draft branch — saying "saved" would name a thing that did not
           happen, so the card is withdrawn rather than resolved into a success. */
        if (toastId !== null) dismissToast(toastId);
        return;
      }
      if (res.ok && json.ok && json.saved) {
        if (syncValuesOnSave) applyValues(committed);
        // SYNCHRONOUS, AND BESIDE THE setState ON PURPOSE. `setSavedBaseline` lands on the
        // next render, but the owed-save retry fires in the `finally` below — before that
        // render. Without this the retry would re-check dirtiness against the OLD baseline,
        // decide the just-saved values still differ, and fire a redundant save.
        baselineRef.current = committed;
        setSavedBaseline(committed);
        onSaved?.(json);
        // THE TIMESTAMP IS RECORDED HERE, at the one moment a save is known to have landed.
        // `saveStatus` flips back to "idle" 2500ms below, so it cannot carry an age.
        if (toastId !== null) resolveToast(toastId, { kind: "ok", title: "Draft saved", message: toastLabel! });
        setSavedAt(Date.now());
        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2500);
        return;
      }
      setSaveStatus("error");
      /* ⚠ THE SERVER'S MESSAGE, UNMODIFIED — the same rule the publish refusals follow. It is the
         only text that knows WHICH field and WHICH rule; a local rewording would drift from it. */
      if (toastId !== null) {
        const m = (json as { error?: { message?: string } })?.error?.message;
        resolveToast(toastId, { kind: "refusal", title: "Couldn\u2019t save", message: m || `${toastLabel} — nothing was written.` });
      }
    } catch {
      setSaveStatus("error"); // the local edit is NOT lost — values remain
      if (toastId !== null) {
        resolveToast(toastId, { kind: "refusal", title: "Couldn\u2019t save", message: `${toastLabel} — the request did not complete. Your edit is still here.` });
      }
    } finally {
      savingRef.current = false;
      // FIRE THE OWED SAVE. At most one follow-up per settle: `saveOwedRef` is set only by a
      // real call landing mid-flight, so with no further edits this terminates immediately.
      // The recursion re-enters through the guard above and reads the refs, so it posts what
      // is on screen NOW rather than the snapshot this call was built from.
      if (saveOwedRef.current) {
        saveOwedRef.current = false;
        void saveDraft();
      }
    }
  }

  function cancel() {
    applyValues({ ...savedBaseline }); // discard unsaved local edits, keep what was saved
    setSaveStatus("idle");
    setExpanded(false);
  }

  return { expanded, setExpanded, values, setField, savedBaseline, dirty, saveStatus, savedAt, saveDraft, cancel };
}
