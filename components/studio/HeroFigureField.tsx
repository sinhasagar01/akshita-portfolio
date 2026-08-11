"use client";

// The hero illustration upload control — the field that was missing entirely.
//
// ⚠ THE HERO'S IMAGE WAS HARDCODED IN THE COMPONENT, so /studio could neither show it nor change
// it. This mirrors SettingsPhotoField's commit model exactly: the route commits the blob AND the
// yaml in one commit, so on success there is nothing left to save and it just reflects the new path
// and lights the Unpublished badge. A shared component is still not worth the mode flag at this
// count — see SettingsPhotoField's header, which makes the same call for the same reason.
//
// ⚠ AND ITS ONE REAL DIFFERENCE IS THE FALLBACK, WHICH IS A DISPLAY PROBLEM RATHER THAN A COMMIT
// ONE. `heroFigure` is optional and the page falls back to the shipped asset, so "no value" does
// NOT mean "no image" here — it means the shipped one is drawing. A control that said "No image
// set" over an empty plate would be describing a state the visitor never sees. So the preview draws
// the shipped asset and the caption says which of the two is live.
import { useRef, useState } from "react";
import { IconX } from "./icons";
import ImageThumb from "./ImageThumb";
import { HERO_FIGURE_FALLBACK } from "@/components/sections/HeroSection";
import { labelCls } from "./blocks/fields";

export default function HeroFigureField({
  heroFigure: initialFigure,
  onUploaded,
}: {
  heroFigure: string | null;
  /** Fired after a successful commit so the panel can light the Unpublished badge. */
  onUploaded: (heroFigure: string | null) => void;
}) {
  const [figure, setFigure] = useState(initialFigure);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** What the PAGE would draw right now — the override, or the shipped asset. */
  const shown = figure?.trim() ? figure : HERO_FIGURE_FALLBACK;
  const isDefault = !figure?.trim();

  async function send(body: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/upload-hero-figure", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setError("Image upload needs github mode (dev)");
        return;
      }
      if (res.ok && json.ok && "heroFigure" in json) {
        setFigure(json.heroFigure);
        onUploaded(json.heroFigure);
        return;
      }
      setError(
        {
          unsupported_type: "Use a PNG or WebP. The hero figure is a cut-out, and JPEG cannot carry transparency.",
          file_too_large: "That image is too large. The limit is 12 MB.",
          image_processing_failed: "That image could not be processed.",
        }[json.error as string] ?? "Upload failed. Try again."
      );
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    void send(body);
  }

  function reset() {
    const body = new FormData();
    body.append("clear", "true");
    void send(body);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelCls}>Hero illustration</span>
      {/* The container declares NO ground — see BlockImageField, which carries the full note. */}
      <div className="flex flex-col gap-2 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-3 py-2.5">
        {/* ⚠ THE ASPECT IS READ OFF THE ASSET, NOT OFF THE PANEL. The public panel is `100svh` tall
            and CROPS the figure to whatever the viewport gives it, so there is no single public
            ratio to match — matching one would show the author a crop that only occurs at one
            window size. 1033x1024 is the source's own, so the thumb shows the whole artwork, which
            is what an author needs to recognise and judge a cut-out. */}
        <ImageThumb src={shown} aspect={1033 / 1024} className="w-full" />
        <div className="flex items-center gap-2">
          {/* ⚠ THE CAPTION NAMES WHICH OF THE TWO IS LIVE. "No image set" would be false — the hero
              always draws something, and saying otherwise sends an author looking for a bug. */}
          {isDefault ? (
            <span className="min-w-0 flex-1 truncate text-[12px] text-studio-text-subtle">
              Using the shipped illustration
            </span>
          ) : (
            <code className="min-w-0 flex-1 truncate text-[12px] text-studio-ink-600">{figure}</code>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            aria-label="Choose a hero illustration"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="shrink-0 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-2.5 py-1 text-[12px] transition-colors hover:border-studio-accent-500/40 hover:text-studio-accent-600 disabled:opacity-40"
          >
            {busy ? "Uploading…" : isDefault ? "Upload" : "Replace"}
          </button>
          {/* ⚠ "RESET", NOT "CLEAR", AND THE WORD IS THE BEHAVIOUR. Clearing restores the shipped
              asset rather than emptying the hero, so a bin icon labelled "clear" would promise a
              deletion the layout cannot survive and does not perform. Hidden when the default is
              already live, because there would be nothing to reset to. */}
          {!isDefault && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={reset}
              disabled={busy}
              aria-label="Reset to the shipped illustration"
              title="Reset to the shipped illustration"
              className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 text-studio-ink-400 transition-colors hover:border-studio-accent-500/40 hover:text-studio-accent-600 disabled:opacity-40 [&>svg]:size-3.5"
            >
              <IconX />
            </button>
          )}
        </div>
        <p className="text-[10px] leading-relaxed text-studio-text-subtle">
          A cut-out on transparency. PNG or WebP — the panel drives its height and crops the width,
          so tall art crops least. The shipped asset is 1033 × 1024.
        </p>
      </div>
      {/* Announced: an upload failure is the one thing here a screen-reader user cannot otherwise
          notice, since the visible change is a small line of text. */}
      {error && (
        <span role="alert" className="text-[10px] text-studio-accent-600">
          {error}
        </span>
      )}
    </div>
  );
}
