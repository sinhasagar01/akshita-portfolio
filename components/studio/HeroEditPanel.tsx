"use client";

// GH-5a/5b/5c — Hero edit panel (Surface B).
//
// GH-5a: collapsed card -> expand-to-panel, local-state fields.
// GH-5b: on-blur (and the Save button) auto-save the FULL form patch to the
// draft branch via the gated /api/studio/save-draft endpoint (the client never
// holds the token). Shows saving / saved / error states, a local "Unsaved
// changes" hint, and the server "Unpublished changes" (differs) badge.
// GH-5c: the Publish button calls the gated /api/studio/publish endpoint, which
// merges the draft into main via the proven publishSiteSettings (GH-4). It shows
// a Publishing then a rebuilding state (the live site updates only after the
// Vercel rebuild), maps typed publish errors, and clears the badge on success.
// The client never holds the token; only publish writes main, and only on a
// deliberate owner click when there is a differing draft.
import { useRef, useState } from "react";
import { IconSparkles } from "./icons";

type Props = {
  heroCopy: string;
  tab1Label: string;
  tab1Line: string;
  tab2Label: string;
  tab2Line: string;
  tab3Label: string;
  tab3Line: string;
  tab4Label: string;
  tab4Line: string;
  heroRoleLabel: string;
  heroScrollCue: string;
  photo: string | null;
  differs?: boolean;
};

// The Hero form's editable fields. State keys match the settings field names so
// the save patch needs no key mapping.
type HeroFields = {
  heroCopy: string;
  tab1Label: string;
  tab1Line: string;
  tab2Label: string;
  tab2Line: string;
  tab3Label: string;
  tab3Line: string;
  tab4Label: string;
  tab4Line: string;
  heroRoleLabel: string;
  heroScrollCue: string;
};

const HERO_FIELD_KEYS = [
  "heroCopy",
  "tab1Label",
  "tab1Line",
  "tab2Label",
  "tab2Line",
  "tab3Label",
  "tab3Line",
  "tab4Label",
  "tab4Line",
  "heroRoleLabel",
  "heroScrollCue",
] as const;

// The tab editor mimics the real Hero tablist: one pill per tab (its text is
// the LIVE edited name), the active tab's name and serif line editable below.
// The fallback shows in the pill when the name field is blank.
const TABS: { labelKey: keyof HeroFields; lineKey: keyof HeroFields; fallback: string }[] = [
  { labelKey: "tab1Label", lineKey: "tab1Line", fallback: "Who I am" },
  { labelKey: "tab2Label", lineKey: "tab2Line", fallback: "What I do" },
  { labelKey: "tab3Label", lineKey: "tab3Line", fallback: "How I work" },
  { labelKey: "tab4Label", lineKey: "tab4Line", fallback: "What I'm up to" },
];

type SaveStatus = "idle" | "saving" | "saved" | "fs" | "error";
type PublishStatus = "idle" | "publishing" | "published" | "error";

export default function HeroEditPanel({
  heroCopy,
  tab1Label,
  tab1Line,
  tab2Label,
  tab2Line,
  tab3Label,
  tab3Line,
  tab4Label,
  tab4Line,
  heroRoleLabel,
  heroScrollCue,
  photo,
  differs,
}: Props) {
  const initial: HeroFields = {
    heroCopy,
    tab1Label,
    tab1Line,
    tab2Label,
    tab2Line,
    tab3Label,
    tab3Line,
    tab4Label,
    tab4Line,
    heroRoleLabel,
    heroScrollCue,
  };
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [values, setValues] = useState<HeroFields>(initial);
  // The last persisted (loaded or draft-saved) values. Local edits are measured
  // against this, so after a successful draft save the "Unsaved changes" hint clears.
  const [savedBaseline, setSavedBaseline] = useState<HeroFields>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [unpublished, setUnpublished] = useState(Boolean(differs));
  // Synchronous in-flight guard: blur can fire twice before React re-renders
  // saveStatus to "saving", so the state check alone lets a duplicate POST
  // through. The ref blocks the second call in the same tick (no commit spam).
  const savingRef = useRef(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const publishingRef = useRef(false); // same double-submit guard as savingRef

  const dirty = HERO_FIELD_KEYS.some((k) => values[k] !== savedBaseline[k]);

  function edit(field: keyof HeroFields, v: string) {
    setValues((prev) => ({ ...prev, [field]: v }));
    if (saveStatus !== "saving") setSaveStatus("idle"); // clear a stale "Draft saved" while typing
    if (publishStatus !== "publishing") {
      setPublishStatus("idle"); // a new edit dismisses a stale "Published" or error message
      setPublishMsg("");
    }
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

  // Publish only when there IS something to publish (a draft that differs) AND
  // the local edits are already saved to that draft. Gating on differs alone
  // would let a click publish a stale draft that omits unsaved keystrokes, and
  // would race the click-triggered blur-save.
  const canPublish =
    unpublished && !dirty && saveStatus !== "saving" && publishStatus !== "publishing";

  async function publish() {
    if (!canPublish || publishingRef.current) return;
    publishingRef.current = true;
    setPublishStatus("publishing");
    setPublishMsg("");
    try {
      const res = await fetch("/api/studio/publish", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.merged) {
        // GH-4 merged the draft into main and deleted it, so differs is now
        // false: clear the badge and re-disable Publish (self-healing).
        setUnpublished(false);
        setPublishStatus("published");
        setPublishMsg("Published. Your site is rebuilding and goes live in about 2 minutes.");
        return;
      }
      if (res.ok && json.ok && !json.merged) {
        if (json.reason === "not_applicable") {
          setPublishStatus("idle");
          setPublishMsg("Publish needs github mode (dev).");
        } else {
          // no_draft or no_changes — nothing to publish, self-heal the badge.
          setUnpublished(false);
          setPublishStatus("idle");
          setPublishMsg("Nothing to publish.");
        }
        return;
      }
      // Typed error. The draft branch is preserved (GH-4) and local values are
      // untouched, so the user loses nothing.
      const code = json?.error?.code;
      if (code === "invalid_url") {
        const field = json.error?.field || "a link";
        setPublishMsg(
          `Cannot publish. The ${field} link is not a valid URL. Fix it in Keystatic, then publish.`
        );
      } else if (code === "merge_conflict") {
        setPublishMsg("Could not publish. The site changed since your draft. Refresh and try again.");
      } else {
        setPublishMsg("Could not publish. Something went wrong. Try again.");
      }
      setPublishStatus("error");
    } catch {
      setPublishStatus("error"); // draft + local values intact
      setPublishMsg("Could not publish. Something went wrong. Try again.");
    } finally {
      publishingRef.current = false;
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
            {savedBaseline.tab1Line || "No tab lines yet"}
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
          // preventDefault on mousedown keeps focus on the edited field, so the
          // blur auto-save never fires for edits the click is about to discard
          // (review finding 3). Keyboard Tab still blur-saves by design.
          onMouseDown={(e) => e.preventDefault()}
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

        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Tabs</span>
          {/* Mimics the real Hero tablist — pick a tab, edit its name and serif
              line below. Pill text is the LIVE edited name. */}
          <div role="tablist" aria-label="Hero tabs" className="flex flex-wrap gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t.labelKey}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                onClick={() => setActiveTab(i)}
                className={[
                  "rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide transition-colors",
                  i === activeTab
                    ? "border border-accent-500/35 bg-accent-500/10 text-accent-600"
                    : "border border-transparent text-ink-400 hover:text-ink-600",
                ].join(" ")}
              >
                {values[t.labelKey].trim() || t.fallback}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-eyebrow text-ink-400">Tab name</span>
            <input
              type="text"
              value={values[TABS[activeTab].labelKey]}
              onChange={(e) => edit(TABS[activeTab].labelKey, e.target.value)}
              onBlur={saveDraft}
              placeholder={TABS[activeTab].fallback}
              className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-eyebrow text-ink-400">Tab line</span>
            <textarea
              rows={3}
              value={values[TABS[activeTab].lineKey]}
              onChange={(e) => edit(TABS[activeTab].lineKey, e.target.value)}
              onBlur={saveDraft}
              className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Role label</span>
          <input
            type="text"
            value={values.heroRoleLabel}
            onChange={(e) => edit("heroRoleLabel", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Scroll cue</span>
          <input
            type="text"
            value={values.heroScrollCue}
            onChange={(e) => edit("heroScrollCue", e.target.value)}
            onBlur={saveDraft}
            className="w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
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
          {/* Publish state takes precedence over the save status when active. */}
          {publishStatus === "publishing" ? (
            <span className="text-ink-500">Publishing…</span>
          ) : publishStatus === "published" ? (
            <span className="text-accent-600">{publishMsg}</span>
          ) : publishStatus === "error" ? (
            <span className="text-accent-600">{publishMsg}</span>
          ) : publishMsg ? (
            <span className="text-text-subtle">{publishMsg}</span>
          ) : saveStatus === "saving" ? (
            <span className="text-ink-500">Saving draft…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-accent-600">Draft saved</span>
          ) : saveStatus === "error" ? (
            <span className="text-accent-600">Save failed. Try again.</span>
          ) : saveStatus === "fs" ? (
            <span className="text-text-subtle">Draft save needs github mode (dev)</span>
          ) : (
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish when ready.</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={publish}
            disabled={!canPublish}
            aria-disabled={!canPublish}
            className="rounded-md border border-accent-500/30 px-4 py-2 text-[13px] text-accent-500 transition-colors enabled:hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {publishStatus === "publishing" ? "Publishing…" : "Publish"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!dirty || saveStatus === "saving" || publishStatus === "publishing"}
            className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saveStatus === "saving" ? "Saving…" : "Save draft"}
          </button>
        </div>
      </footer>
    </section>
  );
}
