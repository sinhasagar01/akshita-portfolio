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
import type { HeroTab } from "@/lib/studio/site-settings-format";
import { useDraftForm } from "./useDraftForm";
import SaveBar from "./SaveBar";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconSparkles } from "./icons";
import { inputClsMd, labelCls, KeyRow, FIELD_MEASURE , FieldKey} from "./blocks/fields";

type Props = {
  itemId: string;
  heroCopy: string;
  heroTabs: HeroTab[];
  heroRoleLabel: string;
  heroScrollCue: string;
};

// The Hero form's editable fields. State keys match the settings field names so
// the save patch needs no key mapping.
type HeroFields = {
  heroCopy: string;
  heroTabs: HeroTab[];
  heroRoleLabel: string;
  heroScrollCue: string;
};

const HERO_FIELD_KEYS = [
  "heroCopy",
  "heroTabs",
  "heroRoleLabel",
  "heroScrollCue",
] as const;

// The tab editor mimics the real Hero tablist: one pill per tab (its text is
// the LIVE edited name), the active tab's name and serif line editable below.
// The pill fallback for a blank name comes from HERO_TAB_FALLBACK_NAMES, the
// same source the live hero falls back to, so the mimic cannot drift.
/* ⚠ AN INDEX NOW, NOT A PAIR OF FLAT KEYS. The four tabs live in one array, so the table carries
   the position and the fallback and nothing else. `HERO_TAB_FALLBACK_NAMES` is still the source of
   the blank-name fallback, which is what stops the mimic drifting from the live hero. */
const TABS: { fallback: string }[] = HERO_TAB_FALLBACK_NAMES.map((fallback) => ({ fallback }));

/** Read one tab's field through the array, tolerating a short or absent array. */
const tabAt = (tabs: HeroTab[], i: number): HeroTab =>
  tabs[i] ?? { label: "", headline: "", support: "", callouts: [], stats: [] };

export default function HeroEditPanel({
  itemId,
  heroCopy,
  heroTabs,
  heroRoleLabel,
  heroScrollCue,
}: Props) {
  const initial: HeroFields = {
    heroCopy,
    heroTabs,
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
    savedAt,
    saveDraft,
    cancel,
  } = useDraftForm<HeroFields>({
    initial,
    buildCommitted: (v) => ({ ...v }),
    isDirty: (v, b) => HERO_FIELD_KEYS.some((k) => v[k] !== b[k]),
    onSaved: () => setUnpublished(true),
    toastLabel: "Site settings — Hero",
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const edit = setField;

  /* ⚠ ONE FIELD OF ONE TAB, WRITTEN THROUGH THE WHOLE ARRAY, because `setField` takes a key and a
     value and the key is now `heroTabs`. The array is rebuilt rather than mutated so the form's
     dirty check — a JSON compare against the baseline — actually sees the change. */
  const editTab = <K extends keyof HeroTab>(i: number, key: K, value: HeroTab[K]) => {
    const next = [0, 1, 2, 3].map((n) => ({ ...tabAt(values.heroTabs, n) }));
    next[i] = { ...next[i], [key]: value };
    setField("heroTabs", next);
  };

  return (
    <section
      aria-label="Edit Hero"
      // NO FRAME — these pages are full-height shells since #242, so a panel frame here is a box
      // drawn around a box, and its `overflow-hidden` clipped the pane's own scrolling. The full
      // reasoning and the measurements are on `AboutEditPanel`'s copy of this line.
      className="bg-studio-cream-100"
    >
      <header className="flex items-center justify-between gap-3 border-b border-studio-ink-950/12 bg-studio-cream-200 px-4 py-[19px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500/10 text-studio-accent-500 [&>svg]:size-3.5">
            <IconSparkles />
          </span>
          <span className="font-display text-base text-studio-ink-950">Hero</span>
          {dirty && (
            <span className="rounded-full border border-studio-ink-950/15 px-2 py-0.5 text-[10px] text-studio-text-subtle">
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
          className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-studio-ink-600 transition-colors hover:bg-studio-cream-200 hover:text-studio-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <FieldKey>Hero copy</FieldKey>
          <input
            type="text"
            value={values.heroCopy}
            onChange={(e) => edit("heroCopy", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Tabs</span>
          {/* Mimics the real Hero tablist — pick a tab, edit its name and serif
              line below. Pill text is the LIVE edited name. */}
          <div
            role="tablist"
            aria-label="Hero tabs"
            // The rule the tabs underline against, same as Content|Style's. `flex-wrap` is kept
            // from before: four tab names are author-edited, so a long set can wrap, and the rule
            // then sits under the whole block rather than through it.
            className="flex flex-wrap gap-1 border-b border-studio-ink-950/12"
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
                key={i}
                id={`hero-tab-edit-${i}`}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                aria-controls="hero-tab-edit-panel"
                tabIndex={i === activeTab ? 0 : -1}
                onClick={() => setActiveTab(i)}
                // ---- THE UNDERLINE, WHICH IS APPLYING THE STUDIO'S RULE RATHER THAN CHANGING IT
                //
                // The rule is already in source, split by ROLE:
                //   role="group" + aria-pressed   -> the accent FILL
                //                                    (SegmentedToggle, Board|Editor, Canvas|Inspector)
                //   role="tablist" + aria-selected -> the UNDERLINE  (Content|Style)
                //
                // These are a real tablist — aria-selected, aria-controls, roving tabindex and
                // Arrow handling, driving a real tabpanel — and they were the only one wearing a
                // third treatment, an accent tint. The contract asked them to adopt the FILL,
                // which would give TABLISTS TWO LANGUAGES in order to make one control match a
                // control of a different role. And swapping in SegmentedToggle outright, as the
                // contract's wording suggests, would drop the Arrow keys, aria-selected and the
                // tabpanel association — a regression wearing consistency's clothes.
                //
                // The SELECTION values are read off Content|Style rather than invented: the same
                // border weight, the same selected and rest colours, the same focus ring.
                //
                // ---- THE TYPE VALUES COME FROM THE PUBLIC HERO, NOT FROM THE CONTRACT (C-27)
                //
                // This panel says twice, above, that it mimics the real Hero tablist so the mimic
                // cannot drift — and nothing enforced that until `studio-ink` Part J, which reads
                // BOTH class strings and asserts the shared axes are equal.
                //
                // The contract's `.seg` specifies sentence case, 12.5px and weight 600. The public
                // hero (`HeroSection.tsx`) renders these same author-edited labels UPPERCASE at
                // 12px / 500, so all three would have moved this control AWAY from the thing it
                // exists to mirror. The contract is not wrong about the current state, and not
                // wrong about the design — it is wrong about WHAT THIS ELEMENT IS FOR.
                //
                // So the three values that moved were taken off the public render:
                //   weight    400 rest -> 500 for BOTH, because the hero is 500 throughout and
                //             carries selection by colour, not by weight
                //   tracking  0.06em (`tracking-wide`) -> 0.10em, spelled the same way the hero
                //             spells it so a grep finds both
                //   padding   6px 12px -> 10px 16px, the hero's exact padding
                //
                // HEIGHT LANDS AT 40, NOT THE HERO'S 38, AND THAT IS THE UNDERLINE. Both compute
                // an 18px line box; the hero pill has no border, this has `border-b-2`. Forcing 38
                // would need a 9px padding that appears in neither reference, so the padding is
                // matched and the 2px difference is the selection language doing its job.
                className={[
                  "-mb-px border-b-2 px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.10em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500",
                  i === activeTab
                    ? "border-studio-accent-500 text-studio-ink-950"
                    : "border-transparent text-studio-ink-600 hover:text-studio-ink-950",
                ].join(" ")}
              >
                {tabAt(values.heroTabs, i).label.trim() || t.fallback}
              </button>
            ))}
          </div>
          <div
            id="hero-tab-edit-panel"
            role="tabpanel"
            aria-labelledby={`hero-tab-edit-${activeTab}`}
            className="flex flex-col gap-1.5"
          >
            {/* THE TAB NAME IS AN AUTHOR-TYPED KEY and the serif line is what it names, so this
                is a key row rather than two stacked fields. The pill IS the key, which is why
                the "Tab N name" caption is gone — a caption above a pill would name the name.
                The accessible name moves to `aria-label`, so nothing is lost to a screen reader.
                The line keeps its own caption: that one is a schema label, not a typed key. */}
            <KeyRow
              label={`Tab ${activeTab + 1} name`}
              value={tabAt(values.heroTabs, activeTab).label}
              onChange={(v) => editTab(activeTab, "label", v)}
              onBlur={saveDraft}
              placeholder={TABS[activeTab].fallback}
            >
              <label className="flex flex-col gap-1.5">
                <FieldKey>
                  Tab {activeTab + 1} line
                </FieldKey>
                <textarea
                  rows={3}
                  value={tabAt(values.heroTabs, activeTab).headline}
                  onChange={(e) => editTab(activeTab, "headline", e.target.value)}
                  onBlur={saveDraft}
                  className={`${inputClsMd} min-h-24 field-sizing-content resize-none max-h-[500px] overflow-y-auto py-3 pb-[18px] leading-[1.55]`}
                />
              </label>
            </KeyRow>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <FieldKey>Role label</FieldKey>
          <input
            type="text"
            value={values.heroRoleLabel}
            onChange={(e) => edit("heroRoleLabel", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <FieldKey>Scroll cue</FieldKey>
          <input
            type="text"
            value={values.heroScrollCue}
            onChange={(e) => edit("heroScrollCue", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} ${FIELD_MEASURE}`}
          />
        </label>
      </div>

      {/* ONE SHAPE — see SaveBar. The instruction that used to be the idle string is now its
          `title`, and the line reports state. `sticky` is preserved: this bar rides the bottom of a
          scrolling panel and always did. */}
      <SaveBar
        className="sticky bottom-0 z-10"
        status={saveStatus}
        dirty={dirty}
        savedAt={savedAt}
        title="Auto-saves to draft on blur. Publish from the bar below."
        primary={{ label: "Save draft", onClick: saveDraft, disabled: !dirty || saveStatus === "saving" }}
      />
    </section>
  );
}
