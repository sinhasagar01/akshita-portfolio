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
// Once their fields share a 320px pane the temptation to merge them is real, so both report
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
// TOPIC IS A CLOSED LISTBOX (PR D closed the set; this PR gave it the animated control). It reads
// its options from `BLOG_TOPICS`, the same const the sanitizer and the publish gate validate
// against, so the control and the gates cannot disagree. The empty option ("No topic yet") is the
// draft state; a topic becomes REQUIRED at publish, not at save. It uses `ListboxField`, which
// since #251 is the studio's ONLY select — the by-role split this comment used to describe (this
// field on the listbox, variant/layout/frame on a native `SelectField`) was deleted when the
// migration trigger it named actually fired. Topic was the listbox's first consumer and is now
// one of six. See ListboxField's header.
//
// `dek` IS NOT A CONTENTEDITABLE. The mock draws it as part of the canvas, styled as prose, but
// blog has no contenteditable infrastructure and introducing the studio's second one inside a
// layout change is scope creep. That still holds.
// ⚠ IT IS NO LONGER A PLAIN `input` EITHER, and neither is the title. Both were CLIPPED at the
// inspector's 320px default — 299px and 305px of text in a 289px box — so neither could be read
// without scrolling inside its own field. They are `WrappingField` now: a textarea that wraps and
// still holds a one-line value. Widening the pane was the other option and it is wrong; the
// reasoning is at `WrappingField`.
import { useEffect, useRef, useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { HeroImageField } from "./ProjectsEditPanel";
import BlogBlocksEditPanel from "./BlogBlocksEditPanel";
import SaveIndicator from "./SaveIndicator";
import { BLOG_STATUSES, BLOG_TOPICS } from "@/lib/studio/blog-format";
import type { BlogRawBlock } from "@/lib/blog/blocks-raw";
import type { BlogCard } from "@/lib/keystatic";
import { inputCls, labelCls, FieldKey, WrappingField } from "./blocks/fields";
import { ListboxField } from "./ListboxField";

type HeadFields = { title: string; dek: string; date: string; topic: string; status: string };

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
  inspectorWidth,
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
  /** The inspector's stored width, read and clamped on the SERVER so the first paint is right. */
  inspectorWidth: number;
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
  const [hero, setHero] = useState<{ path: string | null; preview: string | null }>({
    path: heroImage,
    preview: null,
  });

  // THIS PANEL OWNS THE PREVIEW URL IT DISPLAYS, and owns nothing else's.
  //
  // `onChanged` hands up the File rather than HeroImageField's url, so this makes its own
  // from the same Blob. That is hazard 15's fix: two components used to display ONE revocable
  // url, and neither could free it without blanking the other. The unmount case is what ruled
  // out simply revoking in the field — below the fold BlogBlocksEditPanel renders the
  // inspector INSTEAD of the canvas, so the two holders genuinely unmount independently.
  //
  // THIS panel outlives both of them for one post, so its cleanup is unambiguous.
  const ownedPreview = useRef<string | null>(null);
  const releasePreview = () => {
    if (ownedPreview.current) URL.revokeObjectURL(ownedPreview.current);
    ownedPreview.current = null;
  };
  // Unmount only — navigating to another post frees this post's preview rather than leaving
  // it to page unload. StrictMode's dev double-invoke fires this at mount, when the ref is
  // null and there is nothing to free.
  useEffect(() => releasePreview, []);

  /** Adopt a new preview and free the one it supersedes. Called from the upload callback,
   *  which is an event handler — creating the url here rather than in an effect means the
   *  canvas hero never paints a frame with the old (404-ing) committed path first. */
  const adoptPreview = (file: File | null) => {
    releasePreview();
    const url = file ? URL.createObjectURL(file) : null;
    ownedPreview.current = url;
    return url;
  };

  const { values, setField, dirty, saveStatus, saveDraft } = useDraftForm<HeadFields>({
    initial: { title, dek, date, topic, status },
    buildCommitted: (v) => ({ title: v.title, dek: v.dek, date: v.date, topic: v.topic, status: v.status }),
    isDirty: (v, b) => JSON.stringify(v) !== JSON.stringify(b),
    saveExtras: { collection: "blog", slug },
    buildBody: (committed, extras) => ({ ...extras, patch: committed }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  // ONE COLUMN. The old two-column grid assumed a full-width card; the inspector pane is
  // 320px and every field here is now full width of it.
  // THE STATUS TRAVELS SEPARATELY BECAUSE IT BELONGS IN THE BAND, NOT UNDER IT.
  // The contract's `.sechead` is `justify-content: space-between` with the heading left and the
  // status right, BOTH INSIDE the filled bar. #205 built the bands and left this one outside,
  // so it is a miss rather than a decision — the Body band has always had its indicator inside.
  // `onInk` is not a new colour: SaveIndicator already carries PR 1's on-ink foreground.
  const postStatus = (
    <SaveIndicator label="Post" saving={saveStatus === "saving"} dirty={dirty} onInk />
  );

  const postSection = (
    <div className="flex flex-col gap-3 px-3 py-3">

      {/* THE TITLE IS EDITABLE NOW, and the slug shows beneath it as the read-only thing.
          The two used to be conflated — the field said "the title is the slug and is read
          only", which was false: the slug is the filename and this is a frontmatter key that
          moves nothing when edited (#216). Blank is allowed and the article falls back to the
          slug; publish requires a non-empty one, enforced in validate-blog-post. */}
      <label className="flex flex-col gap-1">
        {/* ⚠ WRAPS RATHER THAN CLIPS. At the inspector's 320px default this needed 299px in a
            289px box, so the headline an author writes first could not be read without scrolling
            inside its own field. See `WrappingField` for why widening the pane was not the fix. */}
        <FieldKey>Title</FieldKey>
        <WrappingField
          value={values.title}
          onChange={(v) => setField("title", v)}
          onBlur={saveDraft}
          placeholder={slug}
        />
        <span className="text-[12px] text-text-subtle">
          Slug <span className="font-mono text-ink-400">{slug}</span> — set at create, fixed.
          The URL, the images and the love count key on it, so it never moves.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        {/* Needed 305px in the same 289px box — and it is a SENTENCE, so wrapping is what it
            wanted anyway. The value stays one line; only the box has two. */}
        <FieldKey>Dek</FieldKey>
        <WrappingField
          value={values.dek}
          onChange={(v) => setField("dek", v)}
          onBlur={saveDraft}
        />
      </label>

      <label className="flex flex-col gap-1">
        <FieldKey>Publish date</FieldKey>
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

      <ListboxField
        label="Topic"
        value={values.topic}
        options={["", ...BLOG_TOPICS]}
        onChange={(v) => setField("topic", v)}
        onBlur={saveDraft}
        optionLabel={(v) => (v === "" ? "No topic yet" : v)}
      />

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
        <div role="group" aria-label="Status" className="inline-flex rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-50 p-0.5">
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
              className={`flex-1 rounded-[var(--studio-radius-control,4px)] px-2 py-1.5 text-[12px] font-semibold capitalize transition-colors ${
                values.status === s
                  ? "bg-accent-500 text-cream-50"
                  : "text-ink-600 hover:text-ink-950"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-[12px] leading-relaxed text-text-subtle">
          {/* THIS LINE WAS THE AMBIGUITY, NOT A NEIGHBOUR TO IT. It used to read "Live on
              /blog once published", and by the time it shows, the STATUS already reads
              Published — so "once published" could only mean the site, and said no such
              thing. An author reads it as already live. The line was trying to say the right
              thing and could not, because "published" names two different acts.
              FIXED IN PLACE RATHER THAN EXPLAINED BESIDE. Adding a second line would have
              layered copy over an ambiguity instead of removing it. Both branches now name
              BOTH conditions, and "publish the site" matches the PublishBar's button exactly. */}
          {liveStatus === "published"
            ? "Live on /blog after you publish the site."
            : "Hidden from /blog until you set this to Published and publish the site."}
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
            setHero({ path: info.heroImage, preview: adoptPreview(info.file) });
            setUnpublished(true);
          }}
        />
        <p className="text-[12px] leading-relaxed text-text-subtle">
          The article hero and the card thumbnail.
        </p>
      </div>

      <p className="border-t border-ink-950/12 pt-2.5 text-[12px] leading-relaxed text-text-subtle">
        The slug is set at create and never moves; the title above is editable. Reading time
        is computed from the blocks. Loves are runtime state and are never edited here.
      </p>
    </div>
  );

  return (
    <BlogBlocksEditPanel
      inspectorWidth={inspectorWidth}
      slug={slug}
      // LIVE, AND WITH THE SLUG FALLBACK, so the canvas mirrors the public article exactly.
      // The read path renders `resolveSlugField(title, slug)` — title when set, slug when
      // blank (select.ts:55). Blanking the field in the inspector now shows the slug in the
      // canvas heading and bar, which is what will actually publish. `title` was a static
      // prop until #216 made it editable; it joins headDek/headDate/headTopic as a live value.
      title={values.title.trim() || slug}
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
      postStatus={postStatus}
    />
  );
}
