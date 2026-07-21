# VE — `videoEmbed` block kind (Final-design video section)

A net-new case-study block for the looping prototype video. First new block kind since
Phase 4, so it's gated like net-new system work — one proof-gated step at a time, each
proven before the next. Chosen design = Variation B (browser frame), reference
`docs/studio/fosfor-video-section.html`.

---

## The one load-bearing decision (locked)

**The video is an externally-hosted URL, NOT a committed binary.** P4-1's "commit
binaries into the repo" rule is correct for webp images (small, sharp-normalized, under
the GraphQL commit ceiling). Video breaks every one of those assumptions — multi-MB
files, no webp-normalize, permanent git-history bloat, commit-size ceiling. So `src` is
a URL string (host: Vercel Blob / Mux / a plain CDN). This is the ONE place the
external-store tradeoff flips, and the reason is the file size, not a change of heart.

Consequence: the block is trivially editable in /studio — `src` is a text field, no
video-upload pipeline. The poster still and caption reuse machinery that already exists.

## Block shape (raw / on-disk)

```
videoEmbed:
  src: string            # external URL (required; validated http/https)
  poster?: image         # still frame — REUSES the P4-1 / 4b-iv content-addressed
                         #   block-image upload (this is the only binary, and it's an image)
  caption?: Rich         # REUSES the inline rich-text just shipped (bold/italic/link)
  frame?: "plain" | "browser"   # default "browser" (Variation B); "plain" = Variation A card
  aspect?: number        # default 16/9
  eyebrow?: string       # "Final design"
  title?: string         # "The profiler, in motion."
```

`frame` is why the two variations are ONE block, not two — it mirrors the existing
DeviceImage frame system. The editor flips one field; the page and the canvas render
identically.

## Placement (content, not code)

Insert as the **last showcase section** of fosfor-data-profiling — after the static
screens/solution, before the reflection/principle wind-down. This is content authored
through the section editor once the block exists; no code decides ordering.

---

## Plan — gated steps, each proven before the next

**VE-1 — schema + adapter + sanitizer (no render yet).** Add `videoEmbed` to
keystatic.config (the 14→15 kind), so `sections-raw.ts`'s derived union picks it up
(the typecheck resolving the 15-kind union is the proof the schema landed). Extend the
adapter (`adaptSections`) to map it (caption → `parseRich`, poster → image spec, frame
default), and the STRICT sanitizer (`sanitizeSectionsPatch`) to validate it (src
required + URL-allowlisted http/https, reject unknown keys, poster optional).
- Proof: adapter unit suite gains videoEmbed cases (round-trip deep-equal, URL
  allowlist, missing-src rejected); the 15-kind exhaustiveness holds (assertNever /
  BLOCK_EMPTIES entry — the #140 invariant); public site byte-identical (no content
  uses it yet); ralph stays green.

**VE-2 — renderer (Variation B browser frame).** New `VideoEmbed` block component:
the video in the browser chrome (dots + url bar, matching HeroCover's web frame),
`aspect-ratio`, `<video>` autoplay muted loop playsInline, poster as the `poster`
attr, eyebrow + serif title + caption. `frame: "plain"` renders the Variation-A card
(same component, one branch). Wire into the block renderer registry.
- a11y: `<video>` gets a label from title/caption; provide a visible caption; respect
  `prefers-reduced-motion` (pause/So don't autoplay) — muted-autoplay-loop must not
  trap motion-sensitive users.
- Proof: renders Variation B for a videoEmbed section (screenshot); `frame:plain`
  renders the card; template=mobile + boat-crest byte-identical (videoEmbed appears in
  neither); publish-time validate-draft-sections covers a null/blank src (born-empty
  block can't wedge the build — same gate as image blocks).

**VE-3 — studio editor form.** Registry form entry for videoEmbed: a URL text input
(with the same URL validation as the sanitizer), the poster picker (reuse the block-
image upload), the caption (inline rich-text), a frame select (browser/plain),
eyebrow/title inputs. Un-gate it in the add-block picker.
- Proof: add a videoEmbed block on the canvas → surgical patch (byte-identical
  {sections}, only the new block added); edit src/caption → only that field changes;
  the canvas renders the same browser-framed video as the public page; reorder is
  byte-safe (src is a verbatim URL string, poster is content-addressed — no rename);
  real-focus QA on the caption rich-text.

**VE-4 — content: author the section + host the video.** Upload the mp4 to the chosen
host (Vercel Blob recommended — same account, no new vendor), set `src`, upload the
poster still, write eyebrow/title/caption, place it as the last showcase section.
Publish. Owner-verified on live.

## Invariants to preserve

- New kind flows through the ONE derived union (`sections-raw.ts`) — no hand-mirrored
  block list; exhaustiveness by construction (a 16th kind is a compile error).
- Strict sanitizer SEPARATE from the permissive adapter (never reuse the adapter to
  validate a patch).
- src URL allowlist (http/https) enforced at sanitizer AND renderer; reject
  javascript:/data:, same posture as the link mark.
- Poster reuses content-addressed block-image naming (reorder byte-safe).
- Publish-time validate-draft-sections gates a missing src (the picker can't).
- template=mobile + boat-crest byte-identical every render step.
- No committed video binary — ever. src is a URL.

## Out of scope

- Video upload pipeline (deliberately not built — video is a URL by decision).
- Multiple videos / playlists / chapters — one video per block.
- Autoplay-with-sound — muted-loop only (autoplay policy + not being obnoxious).

## Build order

VE-1 (schema/adapter/sanitizer) → VE-2 (renderer, browser frame) → VE-3 (editor form)
→ VE-4 (content). One gated step at a time; each proven + PR'd; publish only at VE-4.

## Reality note

This is genuinely net-new (a 15th block kind), the first build since the rich-text arc.
It's small as new blocks go — because the expensive parts (binary handling, rich
caption) are deliberately offloaded to a URL and to existing machinery. But it's still a
real schema change, so it gets the full gated treatment, not a rider on a content edit.
