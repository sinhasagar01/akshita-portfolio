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
import { useState } from "react";
import { HERO_TAB_FALLBACK_NAMES } from "@/components/sections/HeroSection";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconSparkles } from "./icons";
import { inputClsMd } from "./blocks/fields";

type Props = {
  itemId: string;
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
// The pill fallback for a blank name comes from HERO_TAB_FALLBACK_NAMES, the
// same source the live hero falls back to, so the mimic cannot drift.
const TABS: { labelKey: keyof HeroFields; lineKey: keyof HeroFields; fallback: string }[] = [
  { labelKey: "tab1Label", lineKey: "tab1Line", fallback: HERO_TAB_FALLBACK_NAMES[0] },
  { labelKey: "tab2Label", lineKey: "tab2Line", fallback: HERO_TAB_FALLBACK_NAMES[1] },
  { labelKey: "tab3Label", lineKey: "tab3Line", fallback: HERO_TAB_FALLBACK_NAMES[2] },
  { labelKey: "tab4Label", lineKey: "tab4Line", fallback: HERO_TAB_FALLBACK_NAMES[3] },
];

export default function HeroEditPanel({
  itemId,
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
  const [activeTab, setActiveTab] = useState(0);
  // UX-1: the Unpublished (differs) signal and the Publish control now live at
  // page level (PublishBar). This panel just reports its save-response differs
  // and its pending state up to the shared signal — it no longer publishes.
  const { setUnpublished } = usePublishSignal();

  // Shared save/dirty/expand machine. Hero posts the FULL form patch (identity
  // buildCommitted), does NOT sync values on save (so mid-round-trip typing is
  // never clobbered), and reports the save response's differs to the page bar.
  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<HeroFields>({
    initial,
    buildCommitted: (v) => ({ ...v }),
    isDirty: (v, b) => HERO_FIELD_KEYS.some((k) => v[k] !== b[k]),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const edit = setField;

  return (
    <section
      aria-label="Edit Hero"
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/12 bg-cream-100 px-4 py-3">
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
            className={inputClsMd}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Tabs</span>
          {/* Mimics the real Hero tablist — pick a tab, edit its name and serif
              line below. Pill text is the LIVE edited name. */}
          <div
            role="tablist"
            aria-label="Hero tabs"
            className="flex flex-wrap gap-1.5"
            onKeyDown={(e) => {
              // Roving tabindex: the tablist is ONE tab stop and arrows move
              // between tabs, the pattern every other studio tablist already
              // follows. Wraps at both ends; Home/End jump to the edges.
              const n = TABS.length;
              const to =
                e.key === "ArrowRight"
                  ? (activeTab + 1) % n
                  : e.key === "ArrowLeft"
                    ? (activeTab - 1 + n) % n
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? n - 1
                        : -1;
              if (to === -1) return;
              e.preventDefault();
              setActiveTab(to);
              requestAnimationFrame(() => document.getElementById(`hero-tab-edit-${to}`)?.focus());
            }}
          >
            {TABS.map((t, i) => (
              <button
                key={t.labelKey}
                id={`hero-tab-edit-${i}`}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                aria-controls="hero-tab-edit-panel"
                tabIndex={i === activeTab ? 0 : -1}
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
          <div
            id="hero-tab-edit-panel"
            role="tabpanel"
            aria-labelledby={`hero-tab-edit-${activeTab}`}
            className="flex flex-col gap-1.5"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-eyebrow text-ink-400">
                Tab {activeTab + 1} name
              </span>
              <input
                type="text"
                value={values[TABS[activeTab].labelKey]}
                onChange={(e) => edit(TABS[activeTab].labelKey, e.target.value)}
                onBlur={saveDraft}
                placeholder={TABS[activeTab].fallback}
                className={inputClsMd}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-eyebrow text-ink-400">
                Tab {activeTab + 1} line
              </span>
              <textarea
                rows={3}
                value={values[TABS[activeTab].lineKey]}
                onChange={(e) => edit(TABS[activeTab].lineKey, e.target.value)}
                onBlur={saveDraft}
                className={`${inputClsMd} resize-y leading-relaxed`}
              />
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Role label</span>
          <input
            type="text"
            value={values.heroRoleLabel}
            onChange={(e) => edit("heroRoleLabel", e.target.value)}
            onBlur={saveDraft}
            className={inputClsMd}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Scroll cue</span>
          <input
            type="text"
            value={values.heroScrollCue}
            onChange={(e) => edit("heroScrollCue", e.target.value)}
            onBlur={saveDraft}
            className={inputClsMd}
          />
        </label>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/12 bg-cream-100 px-4 py-3">
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
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish from the bar below.</span>
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
