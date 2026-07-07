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
import { useEffect, useRef, useState } from "react";
import { usePublishSignal } from "./PublishProvider";

type PublishStatus = "idle" | "publishing" | "published" | "error";
type DiscardStatus = "idle" | "discarding" | "error";

export default function PublishBar() {
  const { unpublished, setUnpublished, anyPending } = usePublishSignal();
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const publishingRef = useRef(false); // same double-submit guard as the hook's savingRef

  const [discardStatus, setDiscardStatus] = useState<DiscardStatus>("idle");
  const [discardMsg, setDiscardMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const discardingRef = useRef(false); // same double-submit guard as publishingRef
  const cancelRef = useRef<HTMLButtonElement>(null);

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
  const isTerminalMsg = publishStatus === "published" || publishStatus === "error";
  let statusText: string;
  let statusTone: string;
  if (discardMsg) {
    statusText = discardMsg;
    statusTone = discardStatus === "error" ? "text-accent-600" : "text-text-subtle";
  } else {
    statusTone = isTerminalMsg
      ? "text-accent-600"
      : publishStatus === "publishing"
        ? "text-ink-500"
        : "text-text-subtle";
    statusText =
      publishStatus === "publishing"
        ? "Publishing…"
        : publishMsg
          ? publishMsg
          : unpublished
            ? "Unpublished changes"
            : "All changes published";
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div
        className="pointer-events-auto flex max-w-[min(560px,100%)] items-center gap-4 rounded-xl border border-ink-950/10 bg-cream-50/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(60,45,30,0.16)] backdrop-blur"
        {...(confirmOpen
          ? {
              role: "alertdialog" as const,
              "aria-label": "Discard confirmation",
              "aria-describedby": "discard-confirm-msg",
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Escape") closeConfirm();
              },
            }
          : {})}
      >
        {confirmOpen ? (
          <>
            <span id="discard-confirm-msg" className="min-w-0 flex-1 text-[12px] text-ink-700">
              Discard all unpublished changes? This can&rsquo;t be undone.
            </span>
            <button
              ref={cancelRef}
              type="button"
              onClick={closeConfirm}
              className="shrink-0 rounded-md px-3 py-2 text-[13px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={discardStatus === "discarding"}
              className="shrink-0 rounded-md bg-ink-950 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {discardStatus === "discarding" ? "Discarding…" : "Discard"}
            </button>
          </>
        ) : (
          <>
            <span
              className={`min-w-0 flex-1 truncate text-[12px] ${statusTone}`}
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
                className="shrink-0 rounded-md border border-ink-950/15 px-3 py-2 text-[13px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={publish}
              disabled={!canPublish}
              aria-disabled={!canPublish}
              className="shrink-0 rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {publishStatus === "publishing" ? "Publishing…" : "Publish"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
