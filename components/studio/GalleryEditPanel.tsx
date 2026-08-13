"use client";

// The gallery item editor — list, canvas and inspector. `ThreePaneShell`'s THIRD consumer.
//
// ---- ⚠ WHAT THE CANVAS SHOWS, AND WHY IT IS THE OVERLAY RATHER THAN THE TILE -----------------
//
// Blog's canvas renders the article at the public measure. A gallery item has no article, so the
// question had a real answer to find rather than a pattern to copy, and it was decided by asking
// what the INSPECTOR edits:
//
//     alt           read by a screen reader from the overlay's image
//     description   drawn in the overlay's meta rail
//     tags          drawn in the overlay's meta rail
//     caseStudy     drawn in the overlay's spec grid
//     ------------------------------------------------------------------
//     the tile      draws NONE of them — it is the image and nothing else
//
// So a tile canvas would show an author none of what they are changing. Every field in this panel
// moves something in the overlay, and the one property the tile would demonstrate — the aspect
// ratio — is machine-written from the upload and cannot be edited at all. It is stated as a
// read-only figure in the panel instead, which is the honest form for a value the pipeline owns.
//
// ⚠ AND THE CANVAS RENDERS THE PUBLIC COMPONENT, NOT A COPY OF IT. `GalleryOverlay` lives under
// `components/gallery` and the public page will mount the same node inside a dialog. That is the
// case study's parity rule applied to a second collection: an editor whose preview approximates
// the reader's view drifts silently, because nobody notices an approximation getting worse.
//
// ---- ⚠ THE DIMENSIONS ARE READ-ONLY, AND boat-crest IS WHY ------------------------------------
//
// `width` and `height` are written by the upload route from the bytes it committed, after the
// resize and after `rotate()` has baked in EXIF orientation. An editable field for a value the
// pipeline owns is how a collection ends up with 19 of 25 images describing themselves wrongly —
// every one of them typed in good faith. They are DISPLAYED, prominently, because an author needs
// to see that the upload completed; they are not typeable, and `sanitizeGalleryPatch` would refuse
// a zero even if they were.
import { autosaveTitle } from "@/lib/studio/studio-copy";
import { useMemo, useRef, useState } from "react";
import ThreePaneShell from "./ThreePaneShell";
import GalleryItemList from "./GalleryItemList";
import GalleryOverlay from "@/components/gallery/GalleryOverlay";
import SaveIndicator from "./SaveIndicator";
import SaveBar from "./SaveBar";
import ViewToggle from "./ViewToggle";
import ChipListEditor from "./ChipListEditor";
import { ListboxField } from "./ListboxField";
import InspectorResizer from "./InspectorResizer";
import { useInspectorWidth } from "./useInspectorWidth";
import { usePageWidthMin } from "./usePageWidthMin";
import { usePublishSignal } from "./PublishProvider";
import { useDraftForm } from "./useDraftForm";
import { useSidebarWidth } from "./SidebarWidthProvider";
import { BlockImageField, TextField, TextArea, groupLabelCls } from "./blocks/fields";
import { GALLERY_KINDS } from "@/lib/studio/gallery-format";
import { draftImageUrl } from "@/lib/studio/draft-image";
import { GALLERY_CANVAS_MIN_PX, GALLERY_PANES_SUM, INSPECTOR_FOLD_PX } from "@/lib/studio/three-pane";
import type { GalleryItem } from "@/lib/keystatic";

/* ⚠ `image`, `width` AND `height` ARE IN THE FORM, AND THEIR ABSENCE WAS THE DEFECT. They were
   held in a `useState` beside it, so the upload route committed the BYTES to the draft branch and
   the ENTRY was never told — `image: null, width: 0, height: 0` on disk while the panel showed a
   picture and read "MEASURED ON UPLOAD 1200x800". A gallery item could not hold an image at all.

   ⚠ AND THE FIELD SET IS A SEVENTH HAND-MAINTAINED SPELLING OF THE SCHEMA'S KEYS. Hop 3 counted
   six and brought them to five; this one was not in that count, because that census walked `lib/`
   and this list lives in a component. A denominator computed inside a walk cannot see the walk's
   own boundary — the same defect the census was closing, one directory over.
   `collection-dispatch` I1 now compares this set to the schema, so a key the schema declares and
   the form omits is a red row rather than a field that silently cannot be saved. */
type Fields = {
  title: string;
  kind: string;
  image: string | null;
  width: number;
  height: number;
  alt: string;
  description: string;
  tags: string[];
  caseStudy: string;
};

/** The kind options. Derived from `GALLERY_KINDS`, the same const the sanitizer validates against,
 *  so the control and the gate cannot disagree — `topic`'s exact arrangement in BlogEditPanel. */
const KIND_OPTIONS = ["", ...GALLERY_KINDS] as const;

/** Human label per option value. `ListboxField` takes the values and this separately — the empty
 *  option's "No kind yet" is the draft state, and a kind becomes required only at publish. */
const KIND_LABEL: Record<string, string> = {
  "": "No kind yet",
  photo: "Photograph",
  illus: "Illustration",
  proj: "Product study",
};

export default function GalleryEditPanel({
  slug,
  item,
  items,
  inspectorWidth,
}: {
  slug: string;
  item: GalleryItem;
  /** Every item, passed straight through to the list pane. */
  items: readonly GalleryItem[];
  /** The inspector's stored width, read and clamped on the SERVER so the first paint is right. */
  inspectorWidth: number;
}) {
  const { setUnpublished } = usePublishSignal();
  const sidebarPx = useSidebarWidth();
  const ins = useInspectorWidth(inspectorWidth, "gallery");

  /* THE IMAGE AND ITS DIMENSIONS ARE ONE PIECE OF STATE, and splitting them is the defect this
     shape prevents. They arrive together from one response and they are refused together at
     publish — a path with no dimensions is an upload that did not finish. Two useStates would
     make the intermediate state representable, and anything representable eventually happens. */
  /* ⚠ ONLY THE OBJECT URL LIVES HERE NOW. The path and the dimensions moved into the form, because
     state beside a form is state that never reaches disk — which is exactly what happened. What
     remains is genuinely session-only: a `blob:` for bytes the browser already holds, which no
     server can know about and which must not be persisted. */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // This panel owns the preview url it displays and frees the one it supersedes — #190's rule.
  const ownedPreview = useRef<string | null>(null);

  const form = useDraftForm<Fields>({
    initial: {
      title: item.title,
      kind: item.kind,
      image: item.image,
      width: item.width,
      height: item.height,
      alt: item.alt,
      description: item.description,
      tags: [...item.tags],
      caseStudy: item.caseStudy ?? "",
    },
    buildCommitted: (v) => ({ ...v, tags: v.tags.map((t) => t.trim()).filter(Boolean) }),
    /* ARRAY-AWARE, because a shallow compare on `tags` reports every render as dirty — About's
       chip form made exactly this mistake and its comment is why this one does not. */
    isDirty: (v, b) =>
      v.title !== b.title ||
      v.kind !== b.kind ||
      v.image !== b.image ||
      v.width !== b.width ||
      v.height !== b.height ||
      v.alt !== b.alt ||
      v.description !== b.description ||
      v.caseStudy !== b.caseStudy ||
      v.tags.length !== b.tags.length ||
      v.tags.some((t, i) => t !== b.tags[i]),
    syncValuesOnSave: true,
    /* ⚠ THE BAR IS A PAGE-LOAD SNAPSHOT AND SOMETHING MUST TELL IT AN EDIT HAPPENED. `BlogEditPanel`
       has three of these; gallery had ZERO, so the pill read "All changes published" with Publish
       disabled while four saves sat on the draft branch — an author unable to publish work that
       demonstrably existed. `useDraftForm` calls this only on a save the server accepted, so it
       cannot mark the site dirty for a write that did not land. */
    onSaved: () => setUnpublished(true),
    toastLabel: `Gallery · ${slug}`,
    saveExtras: { collection: "gallery", slug },
  });

  /* ⚠ THE TITLE IS EDITABLE HERE AND IS NOT ON BLOG, and the difference is the schema rather than
     a preference. `sanitizeBlogPatch` REJECTS a title patch because the title IS the slug there;
     the gallery's slugField is also `title`, but `sanitizeGalleryPatch` accepts a title change as
     an ordinary field — the file keeps its original slug and the displayed name moves. That is
     deliberate: a photograph gets renamed far more often than a post does, and the URL of a
     gallery item is not a thing anyone has bookmarked. */

  const inspectorFits = usePageWidthMin(INSPECTOR_FOLD_PX);

  /* ⚠ THE FOLD'S OTHER HALF, AND ITS ABSENCE IS WHAT WAS REPORTED AS "NO SAVE DRAFT".
     Below `INSPECTOR_FOLD_PX` the shell is handed `inspector={null}`, and this panel gave the
     canvas no fallback — so the author saw the overlay and NOTHING ELSE. No title, no alt, no
     tags, no upload, no indicator. Saves were wired the whole time: blur calls `saveDraft` on
     every field, the indicator renders, and the structural ops post their own bodies. THE REPORT
     NAMED A MISSING BUTTON; THE DEFECT WAS A MISSING COMPOSITION.

     BLOG'S SHAPE, NOT A NEW ONE. The canvas swaps to the inspector below the fold and a
     `ViewToggle` moves between them — the same three lines `BlogBlocksEditPanel` carries, now
     imported from a seam because gallery is the second consumer. */
  const [view, setView] = useState<"canvas" | "inspector">("canvas");

  /* ⚠ AND THE COLLAPSED STATE IS A SECOND WAY TO HAVE NO FORM, WHICH IS WHY THIS BAR EXISTS. A
     dragged-shut inspector is zero-width and `inert`, so a bar nested inside it takes the save AND
     its state line off screen with it. It docks to the canvas foot instead — a seam that
     COMPRESSES the canvas rather than covering it. Blog's exact reasoning, at its own line. */
  const gallerySaveBar = (
    <SaveBar
      className="sticky bottom-0 z-10 mt-auto"
      status={form.saveStatus}
      dirty={form.dirty}
      savedAt={form.savedAt}
      title={autosaveTitle("Publish from Site settings.")}
      primary={{
        label: "Save draft",
        onClick: form.saveDraft,
        disabled: !form.dirty || form.saveStatus === "saving",
        title: "Commits this item's fields.",
      }}
    />
  );

  /** What the canvas draws. Built from the FORM's live values rather than from the item prop, so
   *  a keystroke in the rail moves the preview before any save lands — which is the whole reason
   *  the canvas is the overlay. */
  const preview = useMemo(
    () => ({
      title: form.values.title,
      kind: form.values.kind,
      /* ⚠ THE CANVAS'S ANSWER IS DERIVED SEPARATELY AND LANDS ON STRATEGY 1 FOR A DIFFERENT REASON
         THAN THE RAIL'S — the count, not the size class.

         `ImageThumb`'s header says what would change the calculus for strategy 1 is "proxying MANY
         images at once, which is why the canvas still uses strategy 2". THE GALLERY OVERLAY SHOWS
         EXACTLY ONE IMAGE. That objection is not in play here, so the many-images argument that
         sends the case-study canvas to strategy 2 does not reach this one.

         ⚠ AND THE COST OF THE ROAD NOT TAKEN IS THE DEFECT THAT WAS REPORTED. Strategy 2 is a
         PAGE-LOAD SNAPSHOT: it cannot resolve a file uploaded during the session, because the
         snapshot predates it. That is precisely "the image does not appear until refresh". Taking
         it here would have needed strategy 3 beside it — an object URL for this session — which is
         two mechanisms on one surface for one image.

         WHAT STRATEGY 1 COSTS, STATED: one proxy round trip per canvas render, which the public
         page does not pay. One image, one trip, and it is correct whether the file is on the draft
         branch, on main, or in the browser's memory from a moment ago. */
      image: previewUrl ?? (form.values.image ? draftImageUrl(form.values.image) : null),
      width: form.values.width,
      height: form.values.height,
      alt: form.values.alt,
      description: form.values.description,
      tags: form.values.tags.filter((t) => t.trim() !== ""),
      caseStudy: form.values.caseStudy.trim() === "" ? null : form.values.caseStudy,
    }),
    [form.values, previewUrl]
  );

  const inspector = (
    /* `min-h-full` SO THE BAR HAS FREE SPACE TO CONSUME — `sticky bottom-0` is inert when nothing
       scrolls, so a short form would leave the bar floating mid-pane. Blog's finding, same shape. */
    <div className="flex min-h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <BlockImageField
            label="Image"
            /* ⚠ THE COMMITTED PATH, NEVER THE `blob:` — AND THAT WAS THE SURFACE THE STRATEGY
               CENSUS MISSED. `BlockImageField` renders `ImageThumb`, which is strategy 1 and
               proxies whatever it is handed; handed an object URL it produced
               `?path=blob:https://…` and drew "No image" beside a canvas showing the picture.
               The census enumerated my three call sites and this one is a layer down, inside a
               shared field. Now that the upload persists, the form's value IS the committed path
               from the moment the response lands, and the proxy resolves it on the draft branch. */
            src={form.values.image}
            slug={slug}
            collection="gallery"
            onChange={(src, file, dims) => {
              if (ownedPreview.current) URL.revokeObjectURL(ownedPreview.current);
              ownedPreview.current = file ? URL.createObjectURL(file) : null;
              setPreviewUrl(ownedPreview.current);
              /* ⚠ THE THREE FIELDS AND THEN A SAVE, IN ONE TICK — WHICH IS SAFE BECAUSE #438 MADE
                 IT SO. `setField` writes `valuesRef` synchronously and `saveDraft` reads that ref
                 rather than a render-time closure; before that repair this exact pattern returned
                 early on a stale dirty check and reported a success it had not performed. The
                 upload is the one write with no blur to ride on, so it must ask for the save. */
              form.setField("image", src);
              form.setField("width", src ? dims?.width ?? 0 : 0);
              form.setField("height", src ? dims?.height ?? 0 : 0);
              form.saveDraft();
            }}
          />

          {/* THE MACHINE-WRITTEN HALF, DRAWN AS A READING RATHER THAN AS FIELDS. See the header:
              an editable box for a value the pipeline owns is how boat-crest got 19 of 25 wrong. */}
          <div className="rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-100 p-3">
            <p className={groupLabelCls}>Measured on upload</p>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-studio-text-subtle">
                  Width
                </dt>
                <dd className="m-0 font-mono text-[12px] text-studio-ink-950">
                  {form.values.width > 0 ? `${form.values.width}px` : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-studio-text-subtle">
                  Height
                </dt>
                <dd className="m-0 font-mono text-[12px] text-studio-ink-950">
                  {form.values.height > 0 ? `${form.values.height}px` : "—"}
                </dd>
              </div>
            </dl>
            {/* ⚠ READ FROM THE FORM, NOT FROM SESSION STATE, AND THAT IS THE WHOLE INCIDENT IN
                ONE LINE. This panel read "MEASURED ON UPLOAD 1200x800" from a `useState` the entry
                never saw — a surface reporting a value that would never be stored, beside a rail
                that correctly showed nothing. A SURFACE SHOWING UNSAVED STATE AS THOUGH IT WERE
                SAVED IS WORSE THAN ONE SHOWING NOTHING, and the empty one is what got reported. */}
            <p className="mt-2 text-[11px] leading-[1.5] text-studio-text-subtle">
              Written from the processed file, so these describe what the reader downloads rather
              than what was chosen. Re-upload to change them.
            </p>
          </div>

          <TextField
            label="Title"
            value={form.values.title}
            onChange={(v) => form.setField("title", v)}
            onBlur={form.saveDraft}
          />

          <ListboxField
            label="Kind"
            value={form.values.kind}
            options={KIND_OPTIONS}
            optionLabel={(v) => KIND_LABEL[v] ?? v}
            onChange={(v) => {
              form.setField("kind", v);
              form.saveDraft();
            }}
          />

          {/* ⚠ ALT IS FIRST AMONG THE TEXT FIELDS AND CARRIES THE BLOCKER SENTENCE, because it is
              the one field publish will refuse. Advisory here, enforced in
              `galleryPublishBlockers` — the same split `validate-blog-post` uses, so a freshly
              added item is savable while it is still incomplete. */}
          <TextField
            label="Alt text"
            value={form.values.alt}
            onChange={(v) => form.setField("alt", v)}
            onBlur={form.saveDraft}
            blocker={
              form.values.alt.trim() === ""
                ? "Publish will refuse this item until it has alt text."
                : undefined
            }
          />

          <TextArea
            label="Description"
            value={form.values.description}
            onChange={(v) => form.setField("description", v)}
            onBlur={form.saveDraft}
            rows={4}
            optional
          />

          <div className="flex flex-col gap-1">
            <span className={groupLabelCls}>Tags</span>
            <ChipListEditor
              chips={form.values.tags}
              onChange={(next) => form.setField("tags", next)}
              onBlur={form.saveDraft}
              addLabel="Add tag"
              placeholder="35mm"
              itemNoun="tag"
              ariaContext="tags"
            />
          </div>

          {/* ⚠ A SLUG, NOT A PICKER, AND THE SANITIZER AGREES BY DESIGN. `sanitizeGalleryPatch`
              checks the SHAPE and never that the study exists — verifying it would make a write
              path depend on another collection's content and fail at save time whenever a study
              was renamed. The link is optional and one-way; a stale one renders as no link. */}
          <TextField
            label="Case study slug"
            value={form.values.caseStudy}
            onChange={(v) => form.setField("caseStudy", v)}
            onBlur={form.saveDraft}
            optional
          />
        </div>
      </div>

      <div className="flex-none border-t border-studio-ink-950/12 px-4 py-3">
        <SaveIndicator label="Item" saving={form.saveStatus === "saving"} dirty={form.dirty} />
      </div>
      {/* NOT WHEN COLLAPSED — it docks to the canvas foot there instead, or it would be clipped
          into a zero-width pane along with the only save control on the surface. */}
      {ins.collapsed ? null : gallerySaveBar}
    </div>
  );

  return (
    <ThreePaneShell
      rootRef={ins.rootRef}
      rootStyle={ins.styleVar}
      /* BOTH SEAMS TAKE A THIRD CONSUMER UNCHANGED — the question asked before this was built.
         `fitThresholdPx` is the caller's arithmetic and `listNoun` is the caller's word, exactly
         as they are for the other two. What DID need widening was `InspectorSurface`, one module
         over, and that widening is a compile error until its bounds are declared. */
      fitThresholdPx={sidebarPx + GALLERY_PANES_SUM + ins.width}
      inspectorCollapsed={ins.collapsed}
      inspectorResizer={
        inspectorFits ? (
          <InspectorResizer
            width={ins.width}
            collapsed={ins.collapsed}
            preview={ins.preview}
            commit={ins.commit}
            lastOpen={ins.lastOpen}
            surface="gallery"
            canvasFloorPx={GALLERY_CANVAS_MIN_PX}
          />
        ) : null
      }
      listNoun="items"
      list={<GalleryItemList items={items} currentSlug={slug} />}
      canvasBar={
        <>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-studio-ink-950">
            {form.values.title || slug}
          </span>
          {/* A CONTROL THAT EXISTS ONLY WHERE IT DOES SOMETHING. Above the fold both panes are on
              screen and a switch between them would be inert. */}
          {!inspectorFits ? (
            <ViewToggle
              value={view}
              onChange={setView}
              options={["canvas", "inspector"] as const}
              label="View"
            />
          ) : null}
        </>
      }
      canvasDock={ins.collapsed ? gallerySaveBar : null}
      /* THE PANE'S GROUND IS THE OVERLAY'S OWN DARK BAND, not the studio cream. The overlay paints
         its own full-bleed ground; leaving the pane cream would draw a cream hairline frame around
         a component that has no frame on the public page. */
      canvasGround="bg-band-dark"
      canvas={
        !inspectorFits && view === "inspector" ? (
          inspector
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* `unoptimizedImage` because both branches of `preview.image` are unfetchable by the
                optimizer: the proxy needs the owner cookie, and a `blob:` URL cannot be refetched
                at all. The public page passes nothing and keeps the optimizer. */}
            <GalleryOverlay item={preview} staticView unoptimizedImage />
          </div>
        )
      }
      inspector={inspectorFits ? inspector : null}
    />
  );
}
