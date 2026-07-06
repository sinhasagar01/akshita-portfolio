"use client";

// UX-1 — page-level Publish bar. The Publish control lifted OUT of the Hero panel
// so any settings section's edits can be published without scrolling to Hero.
// The publish state machine (PublishStatus, publish(), the states and microcopy)
// is copied VERBATIM from HeroEditPanel (GH-5c) — no publish-logic change.
// Publish is singleton-wide (one draft branch, one merge), so this one control
// ships every panel's accumulated edits. It reads the shared unpublished
// (settings differs) and anyPending signals from PublishProvider.
import { useEffect, useRef, useState } from "react";
import { usePublishSignal } from "./PublishProvider";

type PublishStatus = "idle" | "publishing" | "published" | "error";

export default function PublishBar() {
  const { unpublished, setUnpublished, anyPending } = usePublishSignal();
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [publishMsg, setPublishMsg] = useState("");
  const publishingRef = useRef(false); // same double-submit guard as the hook's savingRef

  // A fresh edit (unpublished flips true) dismisses a stale terminal message —
  // the page-level equivalent of Hero's old edit()-time reset.
  useEffect(() => {
    if (unpublished) {
      setPublishStatus((s) => (s === "published" || s === "error" ? "idle" : s));
      setPublishMsg("");
    }
  }, [unpublished]);

  // Publish only when there IS something to publish (a draft that differs) AND
  // the local edits are already saved to that draft. Gating on differs alone
  // would let a click publish a stale draft that omits unsaved keystrokes, and
  // would race the click-triggered blur-save. anyPending covers EVERY panel.
  const canPublish = unpublished && !anyPending && publishStatus !== "publishing";

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

  const isTerminalMsg = publishStatus === "published" || publishStatus === "error";
  const statusTone = isTerminalMsg
    ? "text-accent-600"
    : publishStatus === "publishing"
      ? "text-ink-500"
      : "text-text-subtle";
  const statusText =
    publishStatus === "publishing"
      ? "Publishing…"
      : publishMsg
        ? publishMsg
        : unpublished
          ? "Unpublished changes"
          : "All changes published";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-[min(560px,100%)] items-center gap-4 rounded-xl border border-ink-950/10 bg-cream-50/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(60,45,30,0.16)] backdrop-blur">
        <span
          className={`min-w-0 flex-1 truncate text-[12px] ${statusTone}`}
          aria-live="polite"
        >
          {statusText}
        </span>
        <button
          type="button"
          onClick={publish}
          disabled={!canPublish}
          aria-disabled={!canPublish}
          className="shrink-0 rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publishStatus === "publishing" ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
