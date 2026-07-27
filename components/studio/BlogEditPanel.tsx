"use client";

// BS-3c — the blog post editor's head fields. The blog twin of ProjectsEditPanel's head
// strip, and the same split: this is a small useDraftForm posting
// { collection:"blog", slug, patch }, the body is its own panel with its own writer.
//
// SINCE THE THREE-PANE RELAYOUT THIS RENDERS NOTHING BY ITSELF. It builds a `postSection`
// node and hands it to BlogBlocksEditPanel, which stacks it above the block strip as the
// inspector's first section. The nesting is unchanged — this component still owns the
// child — but the fields now render inside the inspector rather than as a sibling card.
//
// THE TWO FORMS STAY SEPARATE, and that is locked. This one patches head fields, the body
// panel posts a whole `blocks` array through a different branch of the save-draft seam.
// Once their fields share a 244px pane the temptation to merge them is real, so both report
// through a LABELLED SaveIndicator ("Post saved", "Body saved"). Standing hazard 7 is that
// somebody reads two unlabelled indicators as one form, which is #174's defect class, and
// G4 proves the separation by capturing two distinct patches.
//
// THE TITLE IS READ-ONLY, and that is a constraint, not a styling choice. sanitizeBlogPatch
// REJECTS a `title` patch ("title is the entry slug and cannot be edited here"), so a
// contenteditable title — which the design mock draws — would 400 on the first keystroke.
// Renaming is the deferred create-at-new-slug / move-assets / delete-old arc, not a field.
// The title and slug are shown READ-ONLY in the canvas bar, where the article's title
// belongs, with the constraint stated here beside the fields that can change.
//
// TOPIC IS FREE TEXT, not a select. The mock draws a four-option dropdown, but #173 made
// `topic` an open string deliberately: no topic set is declared in the schema or read by
// anything, so a closed list here would be invented rather than enforced. A datalist offers
// the existing values as suggestions without inventing a closed set.
//
// `dek` STAYS A PLAIN INPUT. The mock draws it as part of the canvas, styled as prose, but
// blog has no contenteditable infrastructure and introducing the studio's second one inside
// a layout change is scope creep.
import { useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { HeroImageField } from "./ProjectsEditPanel";
import BlogBlocksEditPanel from "./BlogBlocksEditPanel";
import SaveIndicator from "./SaveIndicator";
import { BLOG_STATUSES } from "@/lib/studio/blog-format";
import type { BlogRawBlock } from "@/lib/blog/blocks-raw";
import type { BlogCard } from "@/lib/keystatic";
import { inputCls, labelCls } from "./blocks/fields";

type HeadFields = { dek: string; date: string; topic: string; status: string };

export default function BlogEditPanel({
  slug,
  title,
  livePath,
  dek,
  date,
  topic,
  status,
  heroImage,
  blocks,
  draftImages,
  posts,
  topicSuggestions,
}: {
  slug: string;
  title: string;
  /** The public article's href, computed on the server — see BlogBlocksEditPanel's prop. */
  livePath: string;
  dek: string;
  date: string;
  topic: string;
  status: string;
  heroImage: string | null;
  blocks: readonly BlogRawBlock[];
  /** Draft-branch image paths, passed straight through to the canvas. */
  draftImages: readonly string[];
  /** Every post, passed straight through to the list pane. */
  posts: readonly BlogCard[];
  /** Existing topics across posts — suggestions, not a closed set (see the header). */
  topicSuggestions: string[];
}) {
  const { setUnpublished } = usePublishSignal();
  const [liveStatus, setLiveStatus] = useState(status);

  // THE HERO, LIFTED, so the canvas can draw it. It was HeroImageField's private state until
  // the canvas needed it, and `onChanged` reported only that SOMETHING changed.
  //
  // PLAIN useState, NOT useDraftForm, and the distinction is load-bearing rather than
  // stylistic. The head form posts a `patch` through save-draft; the hero is committed by
  // /api/studio/upload-hero-image on its own. Putting it in the form would make the form
  // report itself dirty over a field it never posts, and "Post" would sit unsaved forever
  // after an upload — hazard 7's two-indicators problem with a new cause.
  //
  // The object URL is NOT revoked here. See HeroImageField's note on who owns that.
  const [hero, setHero] = useState<{ path: string | null; preview: string | null }>({
    path: heroImage,
    preview: null,
  });

  const { values, setField, dirty, saveStatus, saveDraft } = useDraftForm<HeadFields>({
    initial: { dek, date, topic, status },
    buildCommitted: (v) => ({ dek: v.dek, date: v.date, topic: v.topic, status: v.status }),
    isDirty: (v, b) => JSON.stringify(v) !== JSON.stringify(b),
    saveExtras: { collection: "blog", slug },
    buildBody: (committed, extras) => ({ ...extras, patch: committed }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  // ONE COLUMN. The old two-column grid assumed a full-width card; the inspector pane is
  // 244px and every field here is now full width of it.
  const postSection = (
    <div className="flex flex-col gap-3 px-3 py-3">
      <div className="flex items-center justify-end">
        <SaveIndicator label="Post" saving={saveStatus === "saving"} dirty={dirty} />
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Dek</span>
        <input
          type="text"
          value={values.dek}
          onChange={(e) => setField("dek", e.target.value)}
          onBlur={saveDraft}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Publish date</span>
        {/* type="date" emits exactly YYYY-MM-DD, which is what the sanitizer's ISO_DATE
            requires — no format translation needed in either direction. */}
        <input
          type="date"
          value={values.date}
          onChange={(e) => setField("date", e.target.value)}
          onBlur={saveDraft}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Topic</span>
        <input
          type="text"
          list="blog-topics"
          value={values.topic}
          onChange={(e) => setField("topic", e.target.value)}
          onBlur={saveDraft}
          className={inputCls}
        />
        <datalist id="blog-topics">
          {topicSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>

      <div className="flex flex-col gap-1">
        <span className={labelCls}>Status</span>
        {/* Matches SegmentedToggle's convention: accent fill on a cream track. That
            component is the studio-wide two-segment control with two live call sites and
            its own suite; this is the one bespoke instance, and it exists only because
            SegmentedToggle posts a projects patch. The shared component sets the
            convention.
            aria-pressed IS correct here: a two-segment selection genuinely has a pressed
            state. It was wrong on LoveButton only because love is one-way and cannot be
            un-pressed. */}
        <div role="group" aria-label="Status" className="inline-flex rounded-md border border-ink-950/8 bg-cream-50 p-0.5">
          {BLOG_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={values.status === s}
              onClick={() => {
                setField("status", s);
                setLiveStatus(s);
                // Status is a one-click control, so it commits immediately rather than
                // waiting for a blur that may never come.
                queueMicrotask(saveDraft);
              }}
              className={`flex-1 rounded px-2 py-1.5 text-[12px] capitalize transition-colors ${
                values.status === s
                  ? "bg-accent-500 text-cream-50"
                  : "text-ink-600 hover:text-ink-950"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-text-subtle">
          {liveStatus === "published"
            ? "Live on /blog once published."
            : "Hidden from /blog until you set it to published."}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {/* ONE field, two jobs: the article hero and the index/homepage card thumbnail are
            the same `heroImage`. The mock draws it twice; the schema has one, and a post
            without one falls back to the typographic plate.
            The label is passed IN — this used to render its own "Card image" span above a
            component that already labels itself "Hero image". */}
        <HeroImageField
          slug={slug}
          collection="blog"
          label="Card image"
          initial={heroImage}
          onChanged={(info) => {
            setHero({ path: info.heroImage, preview: info.previewUrl });
            setUnpublished(true);
          }}
        />
        <p className="text-[11px] leading-relaxed text-text-subtle">
          The article hero and the card thumbnail.
        </p>
      </div>

      <p className="border-t border-ink-950/8 pt-2.5 text-[11px] leading-relaxed text-text-subtle">
        The title is the slug and is read only. Reading time is computed from the blocks.
        Loves are runtime state and are never edited here.
      </p>
    </div>
  );

  return (
    <BlogBlocksEditPanel
      slug={slug}
      title={title}
      livePath={livePath}
      blocks={blocks}
      draftImages={draftImages}
      heroImage={hero.path}
      heroPreviewUrl={hero.preview}
      // THE LIVE FORM VALUES, not the server props. The canvas head is a preview, so it has
      // to track what the inspector's fields currently hold — typing in the dek field should
      // move the dek in the canvas, not wait for a save. `values` is useDraftForm's working
      // copy, which is exactly that.
      headDek={values.dek}
      headDate={values.date}
      headTopic={values.topic}
      posts={posts}
      postSection={postSection}
    />
  );
}
