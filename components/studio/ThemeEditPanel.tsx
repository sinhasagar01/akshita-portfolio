"use client";

// The theme switcher. The first field on this site whose value changes how every other field
// LOOKS rather than what it says.
//
// ⚠ CHANGING THE THEME IS A PUBLISH, AND THE AUTHOR SHOULD BE TOLD SO HERE. Content lives in the
// repo, so the switch is a draft commit plus a whole-branch merge plus a Vercel rebuild. Every
// other panel is the same, but every other panel edits words — an author intuitively expects those
// to need publishing, and intuitively expects a colour picker to be live. It is not.
//
// ⚠ AND THE PUBLISH PREVIEW SHOWS WHAT CHANGED IN THE CONTENT, NOT WHAT THE SITE WILL LOOK LIKE.
// A theme is the one field where those differ completely: the diff is one line, and the result is
// every page. That is hazard 13's family — whole-branch publish shipping something nobody looked
// at — and it has already cost a half-finished sentence in a live post.
//
// THE RESOLUTION IS THE CANVAS, NOT A DIALOG. `getStudioData()` is draft-preferring, and the
// case-study and blog canvases carry `data-theme` from it, so a saved-but-unpublished theme is
// already rendering on real content one route away. The swatches below are a legend for that, not
// a substitute — a nine-square grid cannot tell you whether the hero band still works.
import { autosaveTitle } from "@/lib/studio/studio-copy";
import { useState } from "react";
import { useDraftForm } from "./useDraftForm";
import SaveBar from "./SaveBar";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconSparkles } from "./icons";
import { labelCls } from "./blocks/fields";
import { selectableThemes, DEFAULT_THEME } from "@/lib/theme";

type ThemeFields = { theme: string };

/** What each selectable theme is, in one line. Kept beside the switcher because a bare slug tells
 *  an author nothing about what they are about to ship to every page. */
const BLURB: Record<string, string> = {
  cream: "Warm paper. The palette the site launched on.",
  harbour: "Cool slate ground, teal accent. A 155-degree hue swing from cream.",
};

/* The swatch grid reads LIVE tokens under a scoped `data-theme`, so it cannot drift from the
 * stylesheet the way a hard-coded hex list would. Six rows, ground to accent. */
const SWATCHES = [
  { token: "--color-canvas", name: "canvas" },
  { token: "--color-cream-50", name: "card" },
  { token: "--color-cream-300", name: "hairline" },
  { token: "--color-ink-950", name: "ink" },
  { token: "--color-text-subtle", name: "muted" },
  { token: "--color-accent-500", name: "accent" },
];

export default function ThemeEditPanel({ itemId, theme }: { itemId: string; theme: string }) {
  const { setUnpublished } = usePublishSignal();
  const [choice, setChoice] = useState(theme || DEFAULT_THEME);

  const { values, setField, dirty, saveStatus, savedAt, saveDraft } =
    useDraftForm<ThemeFields>({
    toastLabel: "Site settings — Theme",
      initial: { theme: theme || DEFAULT_THEME },
      buildCommitted: (v) => ({ ...v }),
      isDirty: (v, b) => v.theme !== b.theme,
      onSaved: () => setUnpublished(true),
    });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null;

  const pick = (name: string) => {
    setChoice(name);
    setField("theme", name);
  };

  return (
    <section aria-label="Edit Theme" className="bg-studio-cream-100">
      <header className="flex items-center justify-between gap-3 border-b border-studio-ink-950/12 bg-studio-cream-200 px-4 py-[19px]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500/10 text-studio-accent-500 [&>svg]:size-3.5">
            <IconSparkles />
          </span>
          {/* A SPAN, NOT AN `h2`, AND EVERY OTHER PANEL AGREES. The unlayered heading reset owns
              `font-weight` and `font-family` on `h2`, so a `font-medium` utility there is inert —
              `studio-cascade` C1 caught exactly that on the first version of this file. */}
          <span className="font-display text-base text-studio-ink-950">Theme</span>
        </div>
      </header>

      <div className="px-4 py-5">
        <p className={labelCls}>Public palette</p>

        {/* ⚠ A RADIOGROUP, NOT A SELECT. Two options that must be COMPARED, not picked from a
            list — the swatches are the reason the control exists, and a native select hides them
            behind a click. `role="radio"` with `aria-checked` keeps arrow-key semantics that a
            div-with-onClick would silently drop. */}
        <div role="radiogroup" aria-label="Public palette" className="mt-2 grid gap-2">
          {selectableThemes().map((name) => {
            const on = values.theme === name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(name)}
                onBlur={saveDraft}
                className={`flex items-center gap-3 rounded-[var(--studio-radius-control,4px)] border px-3 py-2.5 text-left ${
                  on
                    ? "border-studio-accent-500 bg-studio-cream-50"
                    : "border-studio-ink-950/12 bg-studio-cream-50 hover:border-studio-ink-400"
                }`}
              >
                {/* The palette drawn from its own tokens. `data-theme` scoped to this row is the
                    same mechanism the public page uses at the root — one attribute, one cascade. */}
                <span data-theme={name} className="flex shrink-0 overflow-hidden rounded-[3px]">
                  {SWATCHES.map((s) => (
                    <span
                      key={s.token}
                      title={s.name}
                      className="size-5"
                      style={{ backgroundColor: `var(${s.token})` }}
                    />
                  ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-studio-ink-950">{name}</span>
                  <span className="block text-[11px] text-studio-ink-600">{BLURB[name] ?? ""}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* THE MEASURE AND THE LEADING SIT ON THE WRAPPER, NOT THE `p`. The studio reset declares
            both on `p` unlayered, so a `max-w-[52ch]` or `leading-relaxed` utility on the paragraph
            itself would draw nothing — the gate's own advice, applied rather than worked around. */}
        <div className="mt-4 max-w-[52ch] leading-relaxed">
          <p className="text-[11px] text-studio-ink-600">
            Changing the palette is a publish. It reaches the live site only after the rebuild, and
            the publish preview will show it as one changed line rather than as a picture. Open a
            case study or a post to see the saved palette on real content before you publish it.
          </p>
          {choice !== theme ? (
            <p className="mt-2 text-[11px] text-studio-accent-600">
              The canvas now renders {choice}. The live site is still on {theme || DEFAULT_THEME}.
            </p>
          ) : null}
        </div>
      </div>

      <SaveBar
        className="sticky bottom-0 z-10"
        status={saveStatus}
        dirty={dirty}
        savedAt={savedAt}
        title={autosaveTitle("Publish from the Hero panel.")}
        primary={{ label: "Save draft", onClick: saveDraft, disabled: !dirty || saveStatus === "saving" }}
      />
    </section>
  );
}
