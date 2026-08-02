"use client";

// The save bar — one shape for every surface that commits a draft.
//
// ---- ⚠ THE VALUES ARE MEASURED OFF THE LIVE BAR, NOT READ OFF THE CONTRACT -------------------
//
// The contract's table said cream-50 ground, ~13px Cancel, ~13px/600 primary, and "accent at low
// alpha with a lighter label" for disabled. It also said, in its own words, that the table was
// read off a screenshot rather than measured. It was wrong on all four:
//
//     ground     cream-200          not cream-50   — oklch(0.935 0.025 76), measured
//     Cancel     12px / 600         not ~13px
//     primary    14px / 500         not ~13px / 600
//     disabled   opacity-40 on the whole button, not a low-alpha accent with a lighter label
//
// ⚠ AND THE GROUND ERROR INVALIDATES EVERY CONTRAST FIGURE THE CONTRACT QUOTES, because a ratio
// belongs to the ground it was taken against. The five dot colours here were rasterised on
// cream-200.
//
// ---- THE ROWS ARE EXPLICIT GRID TRACKS, NOT NESTED FLEX --------------------------------------
//
// `1fr auto auto` — the actions row: `extra` takes the flexible track, Cancel and the primary
// take their own content widths. The case-studies index shipped the stretching defect twice by
// nesting flex, and a class-string check passed every broken version of it, so the tracks are
// stated.
//
// ---- ⚠ ONE ROW OR TWO IS A QUESTION ABOUT THE BOX, NOT ABOUT THE PAGE -------------------------
//
// The contract draws the state and the actions on ONE row. IN A 313px INSPECTOR THEY DO NOT FIT.
// Its own drawing puts the inspector track at 340px and its primary reads "Save draft" — 12
// characters. This studio's inspector is 320px, 313px inside the scrollbar, and #200 requires the
// case study's two saves to name their objects, so the primary reads "Save draft · Sections" and
// measures 167px. With a 56px Cancel and the padding, the state track was left 34px and rendered
// "Saved" as "S…". THE ONE THING THE STATE LINE EXISTS FOR WAS THE ONE THING TRUNCATED.
//
// IN A 1042px DETAIL COLUMN THE SAME BAR HAS 800px OF SLACK and stacking it wastes a row. So the
// bar asks its own box rather than being told which page it is on. `@container` with a 520px
// threshold, and the number is derived rather than picked:
//
//     one row, fully loaded  =  state 200 + Preview 61 + Cancel 56 + primary 182
//                               + three 12px gaps + 32px padding  =  567
//     the inspector          =  313  (ThreePaneShell's `w-[320px]`, less its scrollbar)
//     a settings column      =  1042 at a 1600px viewport, measured
//
// 520 sits 200px clear of the inspector and 500px clear of the detail column, so neither surface
// is anywhere near the boundary. ⚠ A THRESHOLD SET TOO LOW RE-CREATES THE "S…" DEFECT, which is
// why the margin is stated and why `studio-save-bar` pins the number against the pane widths
// rather than merely checking it exists.
//
// THIS IS WHY IT IS A CONTAINER QUERY AND NOT A PROP. A boolean would put the same decision at
// six call sites and encode WHICH PAGE rather than WHETHER IT FITS — which is precisely the
// mistake the contract's one-row drawing made.
//
// ---- ⚠ `extra` SITS ON THE STATE ROW, AND THAT PLACEMENT IS A MEASUREMENT ---------------------
//
// It was on the actions row first. `extra` occupies the `1fr` track there, so Preview's 61px held
// that track open and the `auto` track behind the primary was squeezed from its 182px max-content
// to 139 — MEASURED, AND THE PRIMARY WRAPPED ONTO TWO LINES inside its own button. The arithmetic
// leaves no way out: Preview 61 + Cancel 56 + primary 182 + two gaps is 323 in a 281px content
// box. Something had to leave that row, and the state row is the only one with slack.
// The row is a flex child of the grid rather than three more tracks, because its two items must
// size against each other and not against the actions above and below them — sharing tracks is
// exactly what broke the arrangement this replaces. Both items state their behaviour (`min-w-0`
// truncates, `flex-none` does not shrink) so neither can stretch, which is what the no-nested-flex
// rule is actually protecting against.
//
// A PLACEHOLDER KEEPS THE ACTIONS ROW AT THREE CHILDREN. `{extra}` rendering nothing when
// undefined put FOUR children against three tracks and the primary wrapped to an implicit fourth
// row — the same reason Cancel and the primary already had theirs.
import { useEffect, useState, type ReactNode } from "react";
import {
  deriveSaveState,
  formatSavedAge,
  saveStateLabel,
  type SaveStatusLike,
} from "@/lib/studio/save-state";

/* THE DOT CARRIES THE STATE AS COLOUR AND THE PHRASE CARRIES IT AS WORDS, so neither is doing it
   alone — the dot is not a lone non-text indicator and the line survives colour blindness. */
const DOT: Record<string, string> = {
  saved: "bg-ink-400",
  dirty: "bg-accent-500",
  saving: "bg-accent-500 motion-safe:animate-pulse",
  error: "bg-danger-600",
};
const PHRASE: Record<string, string> = {
  saved: "text-text-subtle",
  dirty: "text-ink-600",
  saving: "text-text-subtle",
  error: "text-danger-600",
};

export default function SaveBar({
  status,
  dirty,
  savedAt,
  title,
  onCancel,
  primary,
  extra,
  validation,
  className = "",
}: {
  status: SaveStatusLike;
  dirty: boolean;
  /** When the last successful save landed, or null. See `formatSavedAge` for why it is separate. */
  savedAt: number | null;
  /** The instruction that used to be the idle string. Desktop-only by nature — see below. */
  title: string;
  onCancel?: () => void;
  primary?: { label: string; onClick: () => void; disabled?: boolean; title?: string };
  /** A surface-specific control, e.g. the blog's Discard. */
  extra?: ReactNode;
  /** Positioning only — `sticky`, `flex-none` and the like. The bar's own look is not overridable
   *  from here, which is what keeps "one shape" true across nine surfaces. */
  className?: string;
  /** ⚠ NOT A SAVE STATE. See the note where it renders. */
  validation?: string | null;
}) {
  // THE CLOCK LIVES HERE SO NINE CONSUMERS DO NOT EACH NEED ONE. It ticks only while there is
  // something to age, and 30s is the coarsest interval that still turns "just now" into "1 minute
  // ago" without the line visibly lagging.
  // NO HYDRATION MISMATCH: `savedAt` is null until a save lands in this session, so the first
  // render is "Saved" on both sides and the age can only appear after an interaction.
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (savedAt === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [savedAt]);

  const state = deriveSaveState(status, dirty);
  const age = state === "saved" && now ? formatSavedAge(savedAt, now) : null;

  // ⚠ THE ROOT IS A `footer` ELEMENT AND THAT IS LOAD-BEARING, NOT SEMANTICS. ListDetailLayout
  // pins every panel's bar with `lg:[&>section>footer]:mt-auto`, which is what stops a bar
  // floating mid-air when its panel is shorter than the pane — measured at 61px of float at
  // 1440x820 and 295px at 1076x1054 before #246 fixed it. A `div` here matches nothing, so all
  // five settings bars would have started floating again while every class-string gate still
  // passed. THE SELECTOR IS THE CONSUMER OF THIS TAG NAME; do not change it to a div.
  return (
    <footer
      className={`@container grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 border-t border-ink-950/12 bg-cream-200 px-4 py-3 ${className}`}
    >
      {/* ⚠ THE VALIDATION MESSAGE IS ITS OWN BRANCH AND OUTRANKS THE SAVE STATE. It is not a save
          state at all — the sections bar uses it for "A video URL must be http:// or https://",
          which is a fact about the CONTENT rather than about the commit. The five-state line has
          no slot for it, and a design that swallowed it to fit the drawing would have deleted a
          real signal. It wins because it is the thing blocking the save. */}
      <div className="col-start-1 col-end-4 row-start-1 flex min-w-0 items-center justify-between gap-3 @[520px]:col-end-2">
        {validation ? (
          <span className="min-w-0 truncate text-[12px] text-danger-600" role="status" aria-live="polite">
            {validation}
          </span>
        ) : (
          /* THE INSTRUCTION SURVIVES AS THE `title`, discoverable without being narrated on every
             screen forever. ⚠ A title never shows on touch, so it is effectively desktop-only.
             Acceptable for a single-owner studio, and recorded here rather than discovered later.
             (The word for that state is one Tailwind emits a rule for, so this note works around
             it — see `css-comment-trap`, which caught exactly this sentence.) */
          <span
            title={title}
            className="flex min-w-0 cursor-help items-center gap-2 text-[12px]"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden className={`size-1.5 flex-none rounded-full ${DOT[state]}`} />
            <span className={`truncate ${PHRASE[state]}`}>{saveStateLabel(state, age)}</span>
          </span>
        )}
        {extra ? <span className="flex-none">{extra}</span> : null}
      </div>

      {/* EXPLICIT PLACEMENT RATHER THAN SOURCE ORDER, which is what lets one row and two rows be
          the SAME three tracks and the same DOM. Auto-placement needed a spacer child to hold the
          flexible track open on the actions row; a spacer cannot also be absent in the one-row
          arrangement, so the rows would have had to be two different trees. Stating the cell each
          control occupies removes the spacer and the branch together. */}
      {onCancel ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onCancel}
          className="col-start-2 row-start-2 rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-100 hover:text-ink-950 @[520px]:row-start-1"
        >
          Cancel
        </button>
      ) : null}

      {primary ? (
        <button
          type="button"
          onClick={primary.onClick}
          disabled={primary.disabled}
          // THE SCOPE FACT LIVES HERE, NOT IN THE LINE. "Saves every category together" is neither
          // instruction nor state — it is what ONE CLICK DOES — so it belongs on the control that
          // does it, in the accessible name as well as the tooltip. #255 shipped the opposite: a
          // suffix left a label, was aria-hidden, and a screen reader heard less than before.
          title={primary.title}
          aria-label={primary.title ? `${primary.label}. ${primary.title}` : undefined}
          className="col-start-3 row-start-2 rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[14px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40 @[520px]:row-start-1"
        >
          {status === "saving" ? "Saving…" : primary.label}
        </button>
      ) : null}
    </footer>
  );
}
