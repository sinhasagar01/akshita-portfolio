"use client";

// The site-settings portrait upload control (the last Keystatic-only field to gain
// a /studio writer). Mirrors BlockImageField's look and accessibility, but NOT its
// commit model, which is why it is a separate component rather than a shared one:
//
//   - BlockImageField is BLOB-ONLY. It hands the new path to its parent, whose
//     sections form goes dirty and commits the yaml on the next save.
//   - This route commits the blob AND the yaml in one commit (like heroImage), so
//     when it returns there is nothing left to save — the draft branch already
//     changed. So on success it just reflects the new path and lights the
//     Unpublished badge via onUploaded.
//
// A shared component would need a behavioral mode flag for that fork; at two
// occurrences that is not yet worth the abstraction.
import { useRef, useState } from "react";
import { IconX } from "./icons";
import ImageThumb from "./ImageThumb";

export default function SettingsPhotoField({
  photo: initialPhoto,
  onUploaded,
}: {
  photo: string | null;
  /** Fired after a successful commit so the panel can light the Unpublished badge.
   *  Receives the new path, or null on clear. */
  onUploaded: (photo: string | null) => void;
}) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send(body: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/upload-settings-photo", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setError("Image upload needs github mode (dev)");
        return;
      }
      if (res.ok && json.ok && "photo" in json) {
        setPhoto(json.photo);
        onUploaded(json.photo);
        return;
      }
      setError(
        {
          unsupported_type: "That file type is not supported. Use a PNG, JPEG or WebP.",
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

  function clear() {
    const body = new FormData();
    body.append("clear", "true");
    void send(body);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Photo</span>
      {/* Vertical, and the container declares NO ground — see BlockImageField, which carries
          the full note. This row had the identical class string and the identical collision,
          and the same reason applies: it is mounted on more than one ground. */}
      <div className="flex flex-col gap-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-3 py-2.5">
        {/* 3/4 IS A STATED DEFAULT, NOT A DERIVATION, AND THE DIFFERENCE MATTERS.
            Every other plate reads its aspect off the public renderer. This one cannot: the
            public About column gives the photo NO ratio — `.ab-img` is `position:absolute;
            inset:0` inside a flexible grid column with `min-h-[520px]`, so there is simply
            nothing to match. 3/4 is chosen against shipping evidence rather than taste: the
            asset is 1536x2048, exactly 3:4, and this component's own public placeholder reads
            "900 x 1200", also 3:4.
            THE CONTRACT'S 16/9 WOULD BE WRONG HERE (correction C-16). It was drawn for the
            blog inspector, where images are landscape figures; applied to a portrait it crops
            to a letterbox strip on the one surface where the author most needs to recognise
            the image. */}
        <ImageThumb src={photo} aspect={3 / 4} className="w-full" />
        <div className="flex items-center gap-2">
        {photo ? (
          <code className="min-w-0 flex-1 truncate text-[12px] text-ink-600">{photo}</code>
        ) : (
          <span className="flex-1 text-[12px] text-text-subtle">No photo set</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          aria-label="Choose a portrait photo"
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
          // No background: the container declares none either, so a fixed value here would be
          // the same absolute-on-an-unknown-ground mistake. The border delineates it.
          className="shrink-0 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-2.5 py-1 text-[12px] transition-colors hover:border-accent-500/40 hover:text-accent-600 disabled:opacity-40"
        >
          {busy ? "Uploading…" : photo ? "Replace" : "Upload"}
        </button>
        {photo && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            disabled={busy}
            aria-label="Clear photo"
            className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors hover:border-accent-500/40 hover:text-accent-600 disabled:opacity-40 [&>svg]:size-3.5"
          >
            <IconX />
          </button>
        )}
        </div>
      </div>
      {/* Announced: an upload failure is the one thing here a screen-reader user
          cannot otherwise notice, since the visible change is a small line of text. */}
      {error && (
        <span role="alert" className="text-[10px] text-accent-600">
          {error}
        </span>
      )}
    </div>
  );
}
