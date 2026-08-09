"use client";

// UX-1 — page-level Publish bar. The Publish control lifted OUT of the Hero panel
// so any settings section's edits can be published without scrolling to Hero.
// The publish state machine (PublishStatus, publish(), the states and microcopy)
// is copied VERBATIM from HeroEditPanel (GH-5c) — no publish-logic change.
// Publish is singleton-wide (one draft branch, one merge), so this one control
// ships every panel's accumulated edits. It reads the shared unpublished
// (settings differs) and anyPending signals from PublishProvider.
//
// Discard (discard-all) is the inverse and lives here too, since both are
// branch-wide: Publish MERGES the draft into main, Discard DELETES it. Discard
// is secondary/ghost, gated on the SAME unpublished signal, requires a mandatory
// confirm, and on success reloads so panels + bar re-seed from live.
//
// ⚠ AND PUBLISH NOW OPENS A PREVIEW FIRST — hazard 13. A publish shipped a half-finished sentence
// once, and the mitigation on record was a habit (read the diff before publishing) rather than a
// mechanism. This bar had the asymmetry backwards: Discard, which only destroys DRAFTS, required a
// confirm, while Publish, which changes the LIVE SITE, was one click. The preview is now that
// confirm, so looking is structural. The merge body below is unchanged — only its trigger moved.
import { useEffect, useRef, useState } from "react";
import { usePublishSignal } from "./PublishProvider";
import PublishPreviewDialog, { type PreviewState } from "./PublishPreviewDialog";

type PublishStatus = "idle" | "publishing" | "published" | "error";
type DiscardStatus = "idle" | "discarding" | "error";

export default function PublishBar() {
  const { anyOccluding, unpublished, setUnpublished, draftReadError, anyPending } = usePublishSignal();
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const publishingRef = useRef(false); // same double-submit guard as the hook's savingRef

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({ kind: "loading" });

  const [discardStatus, setDiscardStatus] = useState<DiscardStatus>("idle");
  const [discardMsg, setDiscardMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const discardingRef = useRef(false); // same double-submit guard as publishingRef
  const cancelRef = useRef<HTMLButtonElement>(null);
  const discardRef = useRef<HTMLButtonElement>(null);

  // A fresh edit (unpublished flips true) dismisses a stale terminal message —
  // the page-level equivalent of Hero's old edit()-time reset. Covers both the
  // publish and discard terminal states.
  useEffect(() => {
    if (unpublished) {
      setPublishStatus((s) => (s === "published" || s === "error" ? "idle" : s));
      setPublishMsg("");
      setDiscardStatus((s) => (s === "error" ? "idle" : s));
      setDiscardMsg("");
    }
  }, [unpublished]);

  // Move focus to Cancel (the safe default) whenever the confirm opens.
  useEffect(() => {
    if (confirmOpen) cancelRef.current?.focus();
  }, [confirmOpen]);

  // Publish only when there IS something to publish (a draft that differs) AND
  // the local edits are already saved to that draft. Gating on differs alone
  // would let a click publish a stale draft that omits unsaved keystrokes, and
  // would race the click-triggered blur-save. anyPending covers EVERY panel.
  const canPublish = unpublished && !anyPending && publishStatus !== "publishing";
  // Discard is gated the same way: only when there's a draft to throw away, and
  // never while a panel save is in flight (which could re-create the branch just
  // after the delete).
  const canDiscard = unpublished && !anyPending && discardStatus !== "discarding";

  /** Open the preview and fetch it. THE GATE IS THE SAME `canPublish` the merge uses, so the
   *  dialog cannot open on a state the merge would refuse — one condition, not two that can drift. */
  async function openPreview() {
    if (!canPublish || publishingRef.current) return;
    setPublishStatus("idle");
    setPublishMsg("");
    setPreviewState({ kind: "loading" });
    setPreviewOpen(true);
    try {
      const res = await fetch("/api/studio/publish-preview");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.preview) {
        setPreviewState({ kind: "ready", preview: json.preview });
        return;
      }
      if (res.ok && json.ok && json.reason === "not_applicable") {
        setPreviewState({
          kind: "unavailable",
          reason: "Previewing changes needs github mode, so there is nothing to show here in dev.",
        });
        return;
      }
      // ⚠ FAILS OPEN, DELIBERATELY. Publish stays enabled below and the author is told what they
      // are not getting. Failing closed would let one read error make the site unpublishable.
      setPreviewState({
        kind: "unavailable",
        reason:
          "Couldn't load a preview of your changes. You can still publish, but you will be doing it unseen.",
      });
    } catch {
      setPreviewState({
        kind: "unavailable",
        reason:
          "Couldn't load a preview of your changes. You can still publish, but you will be doing it unseen.",
      });
    }
  }

  function closePreview() {
    if (publishingRef.current) return; // never dismiss a merge in flight
    setPreviewOpen(false);
  }

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
          `Cannot publish. The ${field} link is not a valid URL. Fix it in Settings, then publish.`
        );
      } else if (code === "merge_conflict") {
        setPublishMsg("Could not publish. The site changed since your draft. Refresh and try again.");
      } else if (code === "invalid_blocks") {
        /* ⚠ A REFUSAL IS NOT A FAILURE, AND THIS BRANCH IS THE DIFFERENCE. `invalid_blocks` means the
           draft was READ, the merge was possible, and publishing was DECLINED because a post would
           not render — a blank title, an unlabelled image, a draft marker still in the body. It fell
           through to "something went wrong", which reads as a network error and is unactionable.
           An author could not know a marker was the cause, could not find which post, and could not
           tell a refusal from a failure.

           ⚠ THE SERVER'S MESSAGE IS USED RATHER THAN A HAND-WRITTEN ONE, because it is the only text
           that knows WHICH post and WHICH rule. `validateBlogPost` prefixes the slug, so the author
           gets the post and the reason in one line. The two branches above keep their own wording
           because their causes are single and known; this one has many and the server names them.

           ⚠ AND IT IS #282's ARGUMENT, WHICH ALREADY EXISTS AND WHICH PUBLISH DID NOT USE. A
           validation state outranks the save state because it is a fact about the CONTENT, and
           swallowing it deletes the only signal saying why. That was recorded for a bad video URL on
           the save path; the same claim was true here and the branch was never added. */
        setPublishMsg(
          json?.error?.message
            ? `Cannot publish. ${json.error.message}`
            : "Cannot publish. A post would not render. Fix it, then publish."
        );
      } else {
        setPublishMsg("Could not publish. Something went wrong. Try again.");
      }
      setPublishStatus("error");
    } catch {
      setPublishStatus("error"); // draft + local values intact
      setPublishMsg("Could not publish. Something went wrong. Try again.");
    } finally {
      publishingRef.current = false;
      // ⚠ CLOSED ON EVERY TERMINAL PATH, INCLUDING FAILURE — the same shape `discard` uses. Every
      // outcome above already writes the bar's status line, which is the one place this component
      // reports state; leaving the dialog up would put the same sentence in two places and let them
      // disagree. `finally` covers the early `return`s too, so no path can leave it stranded open.
      setPreviewOpen(false);
    }
  }

  function openConfirm() {
    if (!canDiscard) return;
    setDiscardStatus("idle");
    setDiscardMsg("");
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
  }

  async function discard() {
    if (discardingRef.current) return;
    discardingRef.current = true;
    setDiscardStatus("discarding");
    setDiscardMsg("");
    try {
      const res = await fetch("/api/studio/discard", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.discarded) {
        // The draft branch is deleted. Reload so the whole /studio re-seeds from
        // live: the server render (cache already invalidated) finds no draft, so
        // the bar goes dark AND every panel re-seeds its useDraftForm state from
        // live props (a soft refresh would leave panels showing the discarded
        // draft, since they seed from props only once). Keep the ref locked
        // through the reload so nothing else can fire.
        window.location.reload();
        return;
      }
      if (res.ok && json.ok && !json.discarded) {
        setConfirmOpen(false);
        if (json.reason === "not_applicable") {
          setDiscardStatus("idle");
          setDiscardMsg("Discard needs github mode (dev).");
        } else {
          // no_draft — nothing to discard; self-heal the badge to live.
          setUnpublished(false);
          setDiscardStatus("idle");
          setDiscardMsg("Nothing to discard.");
        }
        return;
      }
      // Error — the delete did NOT happen, so the draft branch is intact. Do NOT
      // reload and do NOT clear unpublished: never show a false "discarded" state.
      setConfirmOpen(false);
      setDiscardStatus("error");
      setDiscardMsg("Could not discard. Something went wrong. Your draft is safe. Try again.");
    } catch {
      setConfirmOpen(false);
      setDiscardStatus("error");
      setDiscardMsg("Could not discard. Something went wrong. Your draft is safe. Try again.");
    } finally {
      discardingRef.current = false;
    }
  }

  // Status line — discard messages take precedence when active, else the publish
  // state machine drives it exactly as before.
  //
  // Tone split (Task 4): a FAILURE is danger-600, a SUCCESS is accent-600. Published
  // and error used to share accent-600 — the one place a failure read the same as a
  // success, told apart only by the message text. Only the emitted class changes; the
  // conditions and every other attribute are untouched.
  let statusText: string;
  let statusTone: string;
  if (discardMsg) {
    statusText = discardMsg;
    statusTone = discardStatus === "error" ? "text-studio-danger-600" : "text-studio-text-subtle";
  } else {
    statusTone =
      publishStatus === "error"
        ? "text-studio-danger-600"
        : publishStatus === "published"
          ? "text-studio-accent-600"
          : publishStatus === "publishing"
            ? "text-studio-text-subtle"
            : "text-studio-text-subtle";
    statusText =
      publishStatus === "publishing"
        ? "Publishing…"
        : publishMsg
          ? publishMsg
          : draftReadError
            ? // The draft could not be read, so studio fell back to live. Saying
              // "All changes published" here would be a confident lie about state
              // we do not actually have.
              "Couldn't load your draft. Showing published content. Reload to try again."
            : unpublished
              ? "Unpublished changes"
              : "All changes published";
    if (draftReadError && !publishMsg && publishStatus !== "publishing") {
      statusTone = "text-studio-accent-600";
    }
  }

  /* ⚠ YIELD THE CORNER WHILE SOMETHING TRANSIENT IS USING IT. `anyOccluding` is reported by the
     Selected rail; see `useReportOccluding` for why hiding beats clearing for that one.
     RETURNED NULL RATHER THAN HIDDEN WITH A CLASS, because a `pointer-events-auto` pill under a
     zero-opacity wrapper is still clickable — a Publish button you cannot see but can press is
     the worst version of this. Unmounting also drops it from the tab order, which merely painting
     it out would not. */
  /* ⚠ AND THE PREVIEW DIALOG NEEDS NO EXEMPTION HERE, WHICH WAS WORTH CHECKING RATHER THAN
     ASSUMING. `&& !previewOpen` was written here first, to stop the rail unmounting an open
     dialog mid-publish. It guards a transition that cannot occur: `anyOccluding` is reported only
     by the Selected rail, which opens when a canvas field is CLICKED, and the dialog traps focus
     behind a scrim — and if the rail were already up, this line would have returned null and there
     would be no Publish button to press. `studio-resize` I2 pins this condition verbatim and
     failed on the widened copy, which is the assertion doing exactly its job. */
  if (anyOccluding) return null;

  /* ⚠ AND THE PILL SITS AT THE OVERLAY LAYER, NOT THE MODAL ONE. It held z-50 — the value
     globals.css names `--z-modal` — and so did `StudioModal`'s scrim, so a modal and a floating
     action bar were claiming ONE layer, with the winner decided by DOM order. The layout renders
     `{children}` before this bar, so the bar won against every modal in the studio.
     MEASURED, ON THE PREVIEW DIALOG: the pill was the element `elementFromPoint` returned at the
     dialog's own Publish button centre, so the dialog's primary action was unclickable.
     THE THREE EXISTING CONFIRMS NEVER HIT IT, which is why nobody saw it. They are short, so their
     footers sit near the middle of the viewport and never reach the band at the foot where this
     pill floats — latent rather than live, the same shape as the save bar that could not spill
     until a pane could narrow. The preview is the first modal tall enough to reach down there.
     THE PILL MOVED RATHER THAN THE MODAL, because the scale already says which is which: a floating
     bar is `--z-overlay`, and taking the modal above 50 would mean borrowing the toast slot for
     something that is not a toast. Dropping to 40 changes nothing about this pill versus the
     listbox panels that also sit at 40 — it is still later in the DOM, so it still paints over them
     exactly as it did at 50. */
  // Task 1 full-bleed offset: lg:left-[var(--studio-sidebar-w)] shifts the fixed bar past the
  // sidebar so it centres over the WORK AREA, not the whole viewport. HAZARD:
  // THIS IS NO LONGER HAND-COUPLED. It used to be a hardcoded 236px left offset at lg, matching
  // StudioSidebar's own 236px width by comment and by a ralph assertion that the two literals
  // were equal. They
  // are now the SAME custom property, so the coupling is structural rather than vigilant —
  // hazard 1's display half, closed. The note below is kept for its reasoning. If the
  // sidebar width changes, change this too, or the bar drifts off-centre.
  //
  // THE THREE-PANE EDITOR MAKES THE BAR OFF-CENTRE AND THAT IS ACCEPTED. On
  // /studio/blog/<slug> the work area is list + canvas + inspector, so the
  // canvas is not centred within it: the bar sits 13px off the canvas centre
  // with the list open and 131px off with it collapsed. Centring over the
  // CANVAS instead would mean this rule knowing the list and inspector widths
  // too — a third and fourth hand-coupled literal, on a component shared by
  // ten pages, to recover at most 131px on one of them. That is the wrong
  // trade, and the alternative that avoids the literals (measuring the canvas
  // at runtime) puts a layout read in a fixed-position bar that renders on
  // every page. Left deliberately. Logged as deferred, not forgotten.
  //
  // The three-pane widths themselves are NOT hand-coupled — they live once in
  // lib/studio/three-pane.ts and ralph asserts no second literal exists. That
  // is the pattern this 236px should follow whenever it is next touched.
  //
  // ⚠ AND IT RISES ABOVE THE SAVE BAR RATHER THAN LANDING ON IT. A flat 20px offset put the pill
  // inside the band every `sticky bottom-0` save bar occupies — 124 × 40px of overlap on Site
  // settings, Experience and Skills, where the bar is the whole 1042px detail column and this
  // pill is centred inside it, and again on the case study below its fold. HORIZONTAL WAS NOT
  // AVAILABLE: clearing that bar sideways means moving left of the detail column, over the list
  // rail, and centring over the work area is the decision argued above.
  // THE CLEARANCE IS MEASURED BY THE BARS THEMSELVES, with a 0px fallback so the index pages —
  // which have no bar — keep a plain 2rem. A fixed offset would have to clear the
  // tallest bar (117px) and would then float this 117px up on every page that has none.
  // (Both the offset utility and the transition utility are names Tailwind emits rules for, so
  // they are described rather than written — `css-comment-trap` has now caught this one comment
  // twice, its seventh and eighth catches on my prose.)
  //
  // ⚠ AND THERE IS NO TRANSITION ON IT, WHICH IS A CORRECTION RATHER THAN AN OMISSION. #284
  // shipped a 200ms transition on the offset here to soften the move. A transition over a
  // `calc()` that reads an UNREGISTERED custom property cannot interpolate — and it does not
  // merely fail to animate, IT SWALLOWS THE UPDATE. Measured: the property read 117px while
  // computed `bottom` stayed at 20px, and became correct the instant the transition was
  // removed. So the clearance took its value on first paint and then FROZE, which is why
  // opening the Selected rail moved nothing and the rail rendered behind this pill.
  // THIS FILE ALREADY KNEW THE RULE, one section over: the `--gl` / `--op` note in globals.css
  // records the same thing from the other direction, that a `color-mix` whose alpha comes from
  // an unregistered var cannot interpolate. Registering this one as a `<length>` was tried and
  // did not rescue the transition, so the transition goes rather than the mechanism.
  // NO MOTION IS LOST THAT MATTERS: the rail it makes way for runs its own 340ms open, and a
  // pill that arrives immediately is never briefly in the way.
  return (
    <>
      {previewOpen && (
        <PublishPreviewDialog
          state={previewState}
          onCancel={closePreview}
          onPublish={publish}
          publishing={publishStatus === "publishing"}
        />
      )}
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--studio-bar-clearance,0px)+2rem)] z-40 flex justify-center px-4 lg:left-[var(--studio-sidebar-w)]">
      <div
        className="pointer-events-auto flex max-w-[min(560px,100%)] items-center gap-3.5 rounded-full border border-studio-ink-950/12 bg-studio-cream-50/95 py-[9px] pl-[18px] pr-[9px] shadow-[var(--studio-lift-floating,0_18px_40px_-20px_rgba(60,45,30,0.45))] backdrop-blur"
        {...(confirmOpen
          ? {
              role: "alertdialog" as const,
              "aria-label": "Discard confirmation",
              "aria-describedby": "discard-confirm-msg",
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Escape") {
                  closeConfirm();
                  return;
                }
                // role="alertdialog" promises modal semantics, so Tab must not
                // wander out into the page behind it. The dialog is exactly two
                // buttons (Cancel and Discard), so the trap is a wrap between
                // them rather than a general focus-scope walk.
                if (e.key !== "Tab") return;
                const stops = [cancelRef.current, discardRef.current].filter(
                  (el): el is HTMLButtonElement => el !== null && !el.disabled
                );
                if (stops.length === 0) return;
                const first = stops[0];
                const last = stops[stops.length - 1];
                const active = document.activeElement;
                if (e.shiftKey && active === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && active === last) {
                  e.preventDefault();
                  first.focus();
                }
              },
            }
          : {})}
      >
        {confirmOpen ? (
          <>
            <span id="discard-confirm-msg" className="min-w-0 flex-1 text-[12.5px]">
              Discard all unpublished changes? This can&rsquo;t be undone.
            </span>
            <button
              ref={cancelRef}
              type="button"
              onClick={closeConfirm}
              className="shrink-0 rounded-full px-2 py-[11px] text-[12.5px] text-studio-ink-600 transition-colors hover:text-studio-accent-500"
            >
              Cancel
            </button>
            <button
              ref={discardRef}
              type="button"
              onClick={discard}
              disabled={discardStatus === "discarding"}
              className="shrink-0 rounded-full bg-studio-ink-950 px-[19px] py-[11px] text-[12px] font-medium text-studio-cream-50 transition-colors hover:bg-studio-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {discardStatus === "discarding" ? "Discarding…" : "Discard"}
            </button>
          </>
        ) : (
          <>
            <span
              className={`min-w-0 flex-1 truncate text-[12.5px] ${statusTone}`}
              aria-live="polite"
            >
              {statusText}
            </span>
            {unpublished && (
              <button
                type="button"
                onClick={openConfirm}
                disabled={!canDiscard}
                aria-disabled={!canDiscard}
                className="shrink-0 rounded-full px-2 py-[11px] text-[12.5px] text-studio-ink-600 transition-colors hover:text-studio-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={openPreview}
              disabled={!canPublish}
              aria-disabled={!canPublish}
              className="shrink-0 rounded-full bg-studio-accent-500 px-[19px] py-[11px] text-[12px] font-medium uppercase tracking-[0.08em] text-studio-cream-50 transition-colors hover:bg-studio-accent-600 disabled:cursor-not-allowed disabled:bg-studio-accent-500/45"
            >
              {/* "PUBLISH SITE", NOT "PUBLISH", BECAUSE THIS DEPLOYS EVERYTHING.
                  An author set a post's status to Published, pressed this, and the post did
                  not appear on /blog. Nothing was broken: this merges the draft branch to
                  main and rebuilds the whole site, while a post's own `status` decides
                  whether it renders. Both are right alone and ambiguous together at the one
                  moment an author decides they are done.
                  THE REST OF THIS BAR ALREADY KNEW. The success message says "Your site is
                  rebuilding", and the status line describes CHANGES rather than an entry. The
                  button was the only string that did not name its object, so it is the only
                  one that changed.
                  `Publishing…` IS DELIBERATELY UNCHANGED. The ambiguity is in the RESTING
                  label, which is what gets read while deciding; the progress label appears
                  only after the choice is made. Keeping it short also stops this `shrink-0`
                  pill changing width mid-action. */}
              {publishStatus === "publishing" ? "Publishing…" : "Publish site"}
            </button>
          </>
        )}
      </div>
    </div>
    </>
  );
}
