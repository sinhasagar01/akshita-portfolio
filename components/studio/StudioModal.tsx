"use client";

// StudioModal — the one scrim+panel modal for the studio's dialogs. Extracted from
// four hand-rolled copies in CaseStudyIndex and ExperienceListEditor (an add + a
// delete each) that had drifted: border ink-950/8 vs /10, p-4 vs p-5, box-shadow present
// vs absent, focus-trap present vs absent, aria-modal present vs absent. One
// component now owns the shell, the a11y contract, the focus trap + restoration, and
// the close policy.
//
// It does NOT render the footer buttons. The caller keeps them in `children` so
// ExperienceListEditor's <form onSubmit> Enter-to-submit survives and each caller
// owns its initial-focus ref. The footer button STYLING is shared through the
// exported class constants below, so the markup stays in the caller while the class
// strings cannot re-drift (the way inputCls did across eight files).
//
// HAZARD — no portal. The scrim is `fixed inset-0`, which resolves to the viewport
// ONLY because no /studio ancestor carries `transform`, `filter`, or `contain`
// (#165 deleting the outer card made this more true). If anyone later adds one of
// those to a studio wrapper, all four modals break at once and the cause will not be
// obvious. Same class of coupling as PublishBar's hand-kept 236px sidebar offset.
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { useFocusTrap } from "./useFocusTrap";

// Shared modal-footer button classes — ONE source, consumed by all four footers in
// the callers. The markup stays in `children`; only the class string is shared.
export const modalGhostBtn =
  "rounded-[var(--studio-radius-control,4px)] px-3 py-2 text-[14px] text-studio-ink-600 transition-colors hover:bg-studio-cream-200 hover:text-studio-ink-950 disabled:cursor-not-allowed disabled:opacity-40";
export const modalAccentBtn =
  "rounded-[var(--studio-radius-control,4px)] bg-studio-accent-500 px-4 py-2 text-[14px] font-medium text-studio-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40";
export const modalInkBtn =
  "rounded-[var(--studio-radius-control,4px)] bg-studio-ink-950 px-4 py-2 text-[14px] font-medium text-studio-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40";

export function StudioModal({
  role,
  title,
  describedById,
  onClose,
  busy = false,
  initialFocusRef,
  width = "narrow",
  children,
}: {
  role: "dialog" | "alertdialog";
  /** Rendered as the <h2> heading and wired to aria-labelledby. Keep it GENERIC
   *  (e.g. "Remove case study"): the specific target belongs in the described-by
   *  body, so a screen reader does not announce the name twice. */
  title: string;
  /** id of the body element that describes the modal (aria-describedby). */
  describedById?: string;
  /** Escape always closes (when not busy). A scrim click closes only role="dialog"
   *  (when not busy); role="alertdialog" never closes on a scrim click — a
   *  destructive confirm must not be dismissed by a stray click. */
  onClose: () => void;
  /** While an action is in flight, Escape and scrim-close are suppressed. */
  busy?: boolean;
  /** Focused on open. The component owns initial focus through this ONE ref-based
   *  mechanism (callers pass their input for add, their Cancel for delete); it is
   *  explicit and testable, and autoFocus is deliberately not used. */
  initialFocusRef: RefObject<HTMLElement | null>;
  /** ⚠ A NAMED PAIR, NOT A NUMBER. The three existing consumers are confirms — a sentence and two
   *  buttons — and `narrow` is their current 440 unchanged, so this prop cannot move them. `wide`
   *  exists for the publish preview, which lists changed entries and their text and is unreadable
   *  at 440. Taking a px number instead would put a fourth geometry literal in a caller, which is
   *  the drift this component was extracted to stop (border /8 vs /10, p-4 vs p-5, and so on). */
  width?: "narrow" | "wide";
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Trap Tab + restore focus to the trigger on close. Declared before the initial-
  // focus effect so it captures the trigger as `previouslyFocused` before focus moves.
  useFocusTrap(panelRef, true);
  useEffect(() => {
    initialFocusRef.current?.focus();
  }, [initialFocusRef]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-studio-ink-950/30 p-4"
      onClick={() => {
        if (role === "dialog" && !busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) onClose();
        }}
        // THE PANEL IS THE FIELD SURFACE (cream-100), NOT THE WELL STEP. Measured, this panel
        // was cream-50 and the inputs its consumers put inside it are `inputCls`, also cream-50
        // — a 1.00 ratio, so the well did not read against the box holding it. The ladder is
        // relational (blocks/fields.tsx:151-166): a well reads because it is one step LIGHTER
        // than its surface, and cream-50 is the BOTTOM step, so the surface had to move rather
        // than the input. All three consumers (the projects index, the blog index and
        // experience) are fixed by this one line.
        // ⚠ BOTH VARIANTS ARE WRITTEN OUT WHOLE. Tailwind's scanner reads source as plain text, so
        // a class assembled at runtime (`max-w-[${n}px]`) emits no rule and fails silently — the
        // hazard where a class looks right and generates nothing. `narrow` is byte-for-byte the
        // string that shipped, so the three confirms cannot move.
        //
        // ⚠ AND ONLY `wide` GETS THE HEIGHT CAP AND THE COLUMN. A confirm is a sentence and two
        // buttons and can never outgrow the viewport; the preview lists every changed entry and
        // its text, so it must cap and hand its body a scroll region. Making the panel a flex
        // column unconditionally would change the block layout the three confirms already lay out
        // under, for no gain to any of them.
        className={
          width === "wide"
            ? "flex max-h-full w-full max-w-[640px] flex-col rounded-[var(--studio-radius-card,8px)] border border-studio-ink-950/12 bg-studio-cream-100 p-[26px] shadow-[var(--studio-lift-modal,0_30px_60px_-24px_rgba(60,45,30,0.5))]"
            : "w-full max-w-[440px] rounded-[var(--studio-radius-card,8px)] border border-studio-ink-950/12 bg-studio-cream-100 p-[26px] shadow-[var(--studio-lift-modal,0_30px_60px_-24px_rgba(60,45,30,0.5))]"
        }
      >
        <h2 id={titleId} className="font-display text-2xl text-studio-ink-950">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
