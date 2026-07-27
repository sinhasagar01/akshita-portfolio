"use client";

// StudioModal — the one scrim+panel modal for the studio's dialogs. Extracted from
// four hand-rolled copies in CaseStudyIndex and ExperienceListEditor (an add + a
// delete each) that had drifted: border ink-950/8 vs /10, p-4 vs p-5, shadow present
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
  "rounded-[var(--studio-radius-control,4px)] px-3 py-2 text-[13px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40";
export const modalAccentBtn =
  "rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40";
export const modalInkBtn =
  "rounded-[var(--studio-radius-control,4px)] bg-ink-950 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40";

export function StudioModal({
  role,
  title,
  describedById,
  onClose,
  busy = false,
  initialFocusRef,
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
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/30 p-4"
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
        className="w-full max-w-[440px] rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-50 p-[26px] shadow-[0_30px_60px_-24px_rgba(60,45,30,0.5)]"
      >
        <h2 id={titleId} className="font-display text-2xl text-ink-950">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
