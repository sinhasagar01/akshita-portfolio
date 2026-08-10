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
import { useEffect, useRef } from "react";

/* ⚠ THE TYPE AND THE RULES LIVE IN `lib/studio/toast-machine.ts`, NOT HERE. This file paints; the
   machine decides. Two declarations of one shape is the second-spelling defect this repo deletes,
   and it would have drifted the moment `action` gained a retry form. */
import { type Toast, TOAST_DRAIN_MS, drains } from "@/lib/studio/toast-machine";
export type { Toast };

export default function PublishToaster({
  toasts,
  onDismiss,
  onRetry,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
  /** Keyed by id, because the callback belongs to the OPERATION rather than to the component —
   *  two operations can be pending at once and each has its own thing to retry. */
  onRetry?: (id: number) => void;
}) {
  /* Auto-dismiss is OWNED HERE rather than by the caller, so the timer and the drain bar that
     visualises it cannot disagree about how long is left.

     ⚠ ONE TIMER PER CARD, ARMED ONCE — bug C. The first version rebuilt every timer on each
     `toasts` change, so a success card that had been up five seconds got a fresh six the moment any
     other toast appeared, while its CSS bar — which runs once from mount — had already emptied. The
     bar and the dismissal then described different amounts of time, which is precisely what this
     comment claimed could not happen. Keyed by id, a card's countdown starts when the card does. */
  const drainTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const live = drainTimers.current;
    for (const t of toasts) {
      if (!drains(t) || live.has(t.id)) continue;
      live.set(t.id, setTimeout(() => { live.delete(t.id); onDismiss(t.id); }, TOAST_DRAIN_MS));
    }
    /* A card that stopped draining — a success still waiting on its deploy — gives its timer back. */
    for (const [id, h] of live) {
      const t = toasts.find((x) => x.id === id);
      if (!t || !drains(t)) { clearTimeout(h); live.delete(id); }
    }
  }, [toasts, onDismiss]);
  useEffect(() => {
    const live = drainTimers.current;
    return () => { live.forEach(clearTimeout); live.clear(); };
  }, []);

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
              /* ⚠ A RETRY IS A BUTTON AND A DESTINATION IS A LINK, and they are not interchangeable.
                 The colour is set explicitly on both because globals.css carries an unlayered
                 `a { color: inherit }` that outranks every utility — measured at 19.04 against
                 7.22 before it was set here. */
              t.action.retry ? (
                <button
                  type="button"
                  onClick={() => onRetry?.(t.id)}
                  style={{ color: "var(--color-studio-accent-600)" }}
                  className="mt-[9px] inline-block border-0 border-b border-current bg-transparent p-0 text-[11.5px] font-medium"
                >
                  {t.action.label}
                </button>
              ) : t.action.href ? (
                <a
                  href={t.action.href}
                  target={t.action.href.startsWith("http") ? "_blank" : undefined}
                  rel={t.action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={{ color: "var(--color-studio-accent-600)" }}
                  className="mt-[9px] inline-block border-0 border-b border-current text-[11.5px] font-medium"
                >
                  {t.action.label}
                </a>
              ) : null
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
