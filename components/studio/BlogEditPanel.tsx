"use client";

// BS-3c — the blog post editor: a head strip plus the blocks host. The blog twin of
// ProjectsEditPanel, and the same split — the head is a small useDraftForm posting
// { collection:"blog", slug, patch }, the body is its own panel with its own writer.
//
// THE TITLE IS READ-ONLY, and that is a constraint, not a styling choice.
// sanitizeBlogPatch REJECTS a `title` patch ("title is the entry slug and cannot be
// edited here"), so a contenteditable title — which the design mock draws — would 400 on
// the first keystroke. Renaming is the deferred create-at-new-slug / move-assets /
// delete-old arc, not a field. The slug is shown beside it, also read-only.
//
// TOPIC IS FREE TEXT, not a select. The mock draws a four-option dropdown, but #173 made
// `topic` an open string deliberately: no topic set is declared in the schema or read by
// anything, so a closed list here would be invented rather than enforced. A datalist
// offers the existing values as suggestions without inventing a closed set.
import { useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { HeroImageField } from "./ProjectsEditPanel";
import BlogBlocksEditPanel from "./BlogBlocksEditPanel";
import { BLOG_STATUSES } from "@/lib/studio/blog-format";
import type { BlogRawBlock } from "@/lib/blog/blocks-raw";
import { inputCls, labelCls } from "./blocks/fields";

type HeadFields = { dek: string; date: string; topic: string; status: string };

export default function BlogEditPanel({
  slug,
  title,
  dek,
  date,
  topic,
  status,
  heroImage,
  blocks,
  topicSuggestions,
}: {
  slug: string;
  title: string;
  dek: string;
  date: string;
  topic: string;
  status: string;
  heroImage: string | null;
  blocks: readonly BlogRawBlock[];
  /** Existing topics across posts — suggestions, not a closed set (see the header). */
  topicSuggestions: string[];
}) {
  const { setUnpublished } = usePublishSignal();
  const [liveStatus, setLiveStatus] = useState(status);

  const { values, setField, dirty, saveStatus, saveDraft } = useDraftForm<HeadFields>({
    initial: { dek, date, topic, status },
    buildCommitted: (v) => ({ dek: v.dek, date: v.date, topic: v.topic, status: v.status }),
    isDirty: (v, b) => JSON.stringify(v) !== JSON.stringify(b),
    saveExtras: { collection: "blog", slug },
    buildBody: (committed, extras) => ({ ...extras, patch: committed }),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-ink-950/8 bg-cream-50 p-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Read-only: the seam refuses a title patch. */}
            <h1 className="font-display text-2xl text-ink-950">{title}</h1>
            <p className="mt-1 font-mono text-[11.5px] text-text-subtle">/blog/{slug}</p>
          </div>
          <span aria-live="polite" className="shrink-0 text-[12px] text-text-subtle">
            {saveStatus === "saving" ? "Saving…" : dirty ? "Unsaved" : "Saved"}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="flex flex-col gap-1 lg:col-span-2">
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
            {/* type="date" emits exactly YYYY-MM-DD, which is what the sanitizer's
                ISO_DATE requires — no format translation needed in either direction. */}
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
            <div role="group" aria-label="Status" className="flex items-center gap-0.5 rounded-md bg-cream-200 p-0.5">
              {BLOG_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={values.status === s}
                  onClick={() => {
                    setField("status", s);
                    setLiveStatus(s);
                    // Status is a one-click control, so it commits immediately rather
                    // than waiting for a blur that may never come.
                    queueMicrotask(saveDraft);
                  }}
                  className={`flex-1 rounded px-3 py-1.5 text-[12px] capitalize transition-colors ${
                    values.status === s
                      ? "bg-cream-50 text-ink-950 shadow-sm"
                      : "text-ink-600 hover:text-ink-950"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-text-subtle">
              {liveStatus === "published"
                ? "Live on /blog once published."
                : "Hidden from /blog until you set it to published."}
            </p>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-2">
            <span className={labelCls}>Card image</span>
            {/* ONE field, two jobs: the article hero and the index/homepage card
                thumbnail are the same `heroImage`. The mock draws it twice; the schema
                has one, and a post without one falls back to the typographic plate. */}
            <HeroImageField
              slug={slug}
              collection="blog"
              initial={heroImage}
              onChanged={() => setUnpublished(true)}
            />
            <p className="text-[11px] text-text-subtle">
              Used as the article hero and the card thumbnail. Without one, the card
              falls back to a typographic plate.
            </p>
          </div>
        </div>

        <p className="mt-4 border-t border-ink-950/8 pt-3 text-[11px] leading-relaxed text-text-subtle">
          Reading time is computed from the blocks. Loves are runtime state and are never
          edited here.
        </p>
      </section>

      <BlogBlocksEditPanel slug={slug} blocks={blocks} />
    </div>
  );
}
