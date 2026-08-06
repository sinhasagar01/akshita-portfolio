"use client";

// What a publish would change, shown before it changes it — hazard 13's answer.
//
// ---- ⚠ THIS IS THE CONFIRM, NOT A SIDE DOOR --------------------------------------------------
//
// A publish shipped a half-finished sentence once. The mitigation on record was a HABIT — read the
// content diff before each publish — and a habit is what failed. An optional "Review changes" link
// is the same habit with better paint: it only helps the author who already chose to look, which is
// not the author the incident was about. So `Publish site` opens this, and this dialog's primary
// button is the merge.
//
// The asymmetry it corrects: Discard already had a mandatory confirm and Publish had none, so the
// action that only destroys DRAFTS was gated and the action that changes the LIVE SITE was one
// click.
//
// ---- ⚠ AND A FAILED PREVIEW MUST NOT LOCK THE OWNER OUT --------------------------------------
//
// If the preview cannot be built, this says so and KEEPS PUBLISH ENABLED. The preview is advisory;
// the publish route runs its own validation and keeps its own fail-closed posture on a truncated
// compare. Failing closed here would mean one GitHub hiccup makes the site unpublishable, which
// trades a rare bad publish for a total outage of the owner's only write path.
import { useRef } from "react";
import { StudioModal, modalGhostBtn, modalAccentBtn } from "./StudioModal";
import type { PreviewResult, ChangedLine } from "@/lib/studio/publish-preview";

export type PreviewState =
  | { kind: "loading" }
  | { kind: "ready"; preview: PreviewResult }
  | { kind: "unavailable"; reason: string };

/** One changed line. The sign is a GLYPH as well as a colour — colour alone is not a carrier, and
 *  at a glance the marker is what separates an addition from a removal for everyone. */
function DiffLine({ line }: { line: ChangedLine }) {
  const added = line.sign === "+";
  return (
    <div className="flex gap-2 py-px">
      <span
        aria-hidden="true"
        className={`shrink-0 select-none font-medium ${added ? "text-studio-success-700" : "text-studio-danger-600"}`}
      >
        {added ? "+" : "−"}
      </span>
      <span className="min-w-0 break-words text-studio-ink-800">{line.text || " "}</span>
      {/* The screen-reader name for the sign. The glyph above is decorative because "+" and the
          minus sign announce inconsistently across readers, and "added"/"removed" is the fact. */}
      <span className="sr-only">{added ? "added" : "removed"}</span>
    </div>
  );
}

export default function PublishPreviewDialog({
  state,
  onCancel,
  onPublish,
  publishing,
}: {
  state: PreviewState;
  onCancel: () => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  // Cancel takes initial focus — the same safe default the discard confirm uses. The primary
  // action here changes the live site, so it is never what the keyboard lands on.
  const cancelRef = useRef<HTMLButtonElement>(null);

  const ready = state.kind === "ready" ? state.preview : null;
  const nothing = ready !== null && ready.fileCount === 0;

  return (
    <StudioModal
      role="dialog"
      width="wide"
      title="Review before publishing"
      describedById="publish-preview-body"
      onClose={onCancel}
      busy={publishing}
      initialFocusRef={cancelRef}
    >
      <div id="publish-preview-body" className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {state.kind === "loading" && (
          <p className="text-[14px] text-studio-text-subtle">Loading what will change…</p>
        )}

        {state.kind === "unavailable" && (
          // ⚠ NOT STYLED AS AN ERROR THAT BLOCKS. It reads as a caveat, because Publish below is
          // still live and the author is being told what they will not get, not that they failed.
          <p className="text-[14px] text-studio-ink-800">{state.reason}</p>
        )}

        {nothing && (
          <p className="text-[14px] text-studio-text-subtle">
            Nothing to publish. Your draft matches the live site.
          </p>
        )}

        {ready && ready.fileCount > 0 && (
          <>
            <p className="text-[14px] text-studio-ink-950">
              {ready.fileCount === 1 ? "1 file will go live." : `${ready.fileCount} files will go live.`}
            </p>

            {ready.truncated && (
              // ⚠ TRUNCATION IS LOUD. `compareBranches` surfaces the cap precisely because its
              // callers need opposite postures; the preview's is that an incomplete list must never
              // read as a complete one. A preview that silently under-reports is worse than none.
              <p className="mt-2 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-200 px-3 py-2 text-[13px] text-studio-ink-800">
                This is the first 300 files. There are more than that in this publish, and they are
                not listed here.
              </p>
            )}

            <ul className="mt-4 flex flex-col gap-3">
              {ready.entries.map((entry, i) => (
                <li
                  key={`${entry.group}-${entry.title}-${i}`}
                  className="rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-50 p-3"
                >
                  <p className="text-[14px] font-medium text-studio-ink-950">{entry.title}</p>
                  <p className="mt-px text-[12.5px] text-studio-text-subtle">
                    {entry.kind} · {entry.change}
                    {entry.imageCount > 0 &&
                      ` · ${entry.imageCount === 1 ? "1 image" : `${entry.imageCount} images`}`}
                  </p>

                  {entry.unavailable && (
                    <p className="mt-2 text-[13px] text-studio-text-subtle">
                      Too large to preview here.
                    </p>
                  )}

                  {entry.lines.length > 0 && (
                    <div className="mt-2 text-[12.5px] leading-[1.5] [font-family:var(--font-mono)]">
                      {entry.lines.map((line, j) => (
                        <DiffLine key={j} line={line} />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

      </div>

      <div className="mt-5 flex shrink-0 justify-end gap-2">
        <button ref={cancelRef} type="button" onClick={onCancel} className={modalGhostBtn}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing || nothing}
          className={modalAccentBtn}
        >
          {publishing ? "Publishing…" : "Publish site"}
        </button>
      </div>
    </StudioModal>
  );
}
