"use client";

// The publish toaster — top right, newest on top, three visible.
//
// ⚠ IT IS NOT A RESTYLE OF PublishBar'S STATUS LINE. That line holds ONE string, is overwritten by
// the next status, and carries no action — so a refusal names the post that is wrong and offers no
// way to reach it. The toast adds three things the line cannot have: PERSISTENCE (a refusal stays
// until dismissed), AN ACTION (the author can open the post the validator named), and A STACK (a
// second result does not erase the first).
//
// ⚠ THE SPLIT WITH THE LINE IS STANDING STATE versus EVENT RESULT, and that is the whole rule.
// The line keeps what is TRUE NOW — "Unpublished changes", "All changes published", the
// draft-read fallback, and the discard flow, which is a different verb. The toaster owns what JUST
// HAPPENED — publishing, published, and every refusal or failure.
//
// ⚠ THE STUDIO CHROME HAS ONE GROUND, BY CONSTRUCTION. `--studio-*` tokens do not respond to
// `data-ground` and must not start: that is #323 and `studio-ink` C10 has caught it once. So there
// is no dark tier to derive here — `--studio-lift-floating` is used as it stands, and the success
// tint is `studio-success-700`, which was already declared. No new token, and no value copied from
// the spec's standalone approximations.
import { useEffect } from "react";

export type ToastKind = "pending" | "ok" | "refusal";

export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  /** The validator's own sentence, UNMODIFIED. `publishBlockers` is the one source; a client-side
   *  rewrite would be a second spelling of the same rule and would drift from it. */
  message: string;
  action?: { label: string; href: string };
};

/** Three visible; past the cap the OLDEST is dismissed rather than queued, so the newest result is
 *  always on screen. A queue would hide the thing the author just caused. */
export const TOAST_CAP = 3;
/** Only `ok` drains. A refusal or a failure is something the author must act on, so it waits. */
export const TOAST_DRAIN_MS = 6000;

export default function PublishToaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  /* Auto-dismiss is OWNED HERE rather than by the caller, so the timer and the drain bar that
     visualises it cannot disagree about how long is left. */
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.kind === "ok")
      .map((t) => setTimeout(() => onDismiss(t.id), TOAST_DRAIN_MS));
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    /* ⚠ THE STACKING LEVEL SITS ABOVE THE PUBLISH PILL AND BELOW THE MODALS, which is a deliberate
       departure from the spec's z-60. The publish flow runs THROUGH the preview dialog, and a toast
       floating over a blocking surface would cover the thing the author is answering.

       ⚠ AND IT DOES NOT COLLIDE WITH THE PILL, WHICH IS GEOMETRY RATHER THAN LUCK. The pill is
       bottom-centre (`inset-x-0 bottom-…` with `justify-center`); this is top-right. `top-[76px]`
       clears the sticky topbar, measured rather than guessed. */
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-[76px] z-[45] flex w-[330px] max-w-[calc(100vw-2rem)] flex-col gap-2.5"
    >
      {toasts.map((t, i) => (
        <div
          key={t.id}
          style={{ animationDelay: `${i * 50}ms` }}
          className="studio-toast pointer-events-auto grid grid-cols-[27px_1fr_20px] items-start gap-[11px] rounded-[var(--studio-radius-card,8px)] border border-studio-ink-950/12 bg-studio-cream-50 p-[13px_14px] shadow-[var(--studio-lift-floating,0_18px_40px_-20px_rgba(60,45,30,0.45))]"
        >
          <span
            aria-hidden="true"
            className={`studio-toast-chip grid size-[27px] place-items-center rounded-[var(--studio-radius-control,4px)] border text-[13px] font-bold leading-none${
              t.kind === "ok" ? " is-ok" : t.kind === "pending" ? " is-pending" : ""
            }`}
          >
            {t.kind === "ok" ? "✓" : t.kind === "pending" ? <span className="studio-toast-spin" /> : "!"}
          </span>

          <div className="min-w-0">
            <p className="m-0 text-[13.5px] font-medium leading-[1.35] text-studio-ink-950">{t.title}</p>
            <p className="m-0 mt-[5px] break-words text-[12.5px] leading-[1.5] text-studio-text-subtle">
              {t.message}
            </p>
            {t.action && (
              /* ⚠ THE COLOUR IS SET EXPLICITLY, NOT BY A UTILITY, AND THE MEASUREMENT IS WHY.
                 globals.css carries an UNLAYERED `a { color: inherit }` so links take their
                 context — and unlayered CSS outranks every `@layer utilities` declaration, so the
                 accent utility on an anchor draws NOTHING. Measured: the same class read 7.22 on a
                 span and 19.04 here, identical to the ink title beside it. The link would have
                 shipped looking like body text. This is #177's rule — set it explicitly rather than
                 relying on inheritance — and the anchor is kept because the action really is
                 navigation. */
              <a
                href={t.action.href}
                style={{ color: "var(--color-studio-accent-600)" }}
                className="mt-[9px] inline-block border-0 border-b border-current text-[11.5px] font-medium"
              >
                {t.action.label}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            /* ⚠ ink-600, NOT ink-400, AND THE GATE IS WHY. `studio-ink-contrast` H6 registers every
               ink-400 TEXT site because ink-400 is correct at the 3:1 ICON floor and fails AA for
               text — and this glyph is a text character however icon-like it looks. Raising it is
               cheaper and more honest than registering an exemption for a dismiss control the
               author has to find. */
            className="justify-self-end rounded-[3px] px-[3px] py-[2px] text-[15px] leading-none text-studio-ink-600 hover:text-studio-ink-950"
          >
            ×
          </button>

          {t.kind === "ok" && (
            <span aria-hidden="true" className="col-span-full mt-[11px] h-[2px] overflow-hidden rounded-[2px] bg-studio-ink-950/10">
              <i className="studio-toast-drain block h-full bg-studio-success-700" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
