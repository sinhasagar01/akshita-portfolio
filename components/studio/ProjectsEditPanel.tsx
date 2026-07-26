"use client";

// CE-2 — project entry editor (Surface B). Mirrors the CE-1 experience panel:
// one panel per existing project, editing summary + the two editable facts via
// useDraftForm. The save posts { collection, slug, patch } via saveExtras; the
// route commits to the SAME draft branch as the singleton (DB-1 accumulation).
// title is the slug (read-only); the case-study body is edited on the body page.
//
// P4-1 — heroImage is now editable HERE via a separate multipart upload route
// (its own local state, NOT part of the useDraftForm text patch), committing the
// normalized webp blob + the yaml path to the same draft branch.
import { useEffect, useRef, useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import SectionsEditPanel from "./SectionsEditPanel";
import SegmentedToggle from "./SegmentedToggle";
import { IconGrid } from "./icons";
import { BESPOKE_SLUGS } from "@/lib/case-studies/types";
import type { ProjectFacts } from "@/lib/studio/projects-format";
import type { RawSection } from "@/lib/case-studies/sections-raw";

type Props = {
  itemId: string;
  slug: string;
  title: string;
  summary: string;
  heroImage: string | null;
  facts: ProjectFacts;
  // CS-6a — the case-study template ("" | "mobile" | "web"), for the header toggle.
  template: string;
  // Editorial taxonomy ("" | "mobile" | "web") for the work-section filter (PR 1),
  // for the header CategoryToggle. Drives no rendering — see keystatic.config.ts.
  category: string;
};

// Only type + platform are editable here (Phase-1 T1). role + timeline stay in
// the file as valid data but are not part of the form, so the posted facts patch
// is { type, platform } and the serializer merges it (role/timeline preserved).
type EditableFacts = { type: string; platform: string };
type ProjectsFields = {
  summary: string;
  facts: EditableFacts;
};

const FACTS: { key: keyof EditableFacts; label: string; placeholder: string }[] = [
  { key: "type", label: "Type", placeholder: "Mobile app redesign" },
  { key: "platform", label: "Platform", placeholder: "Android and iOS" },
];

export default function ProjectsEditPanel({ itemId, slug, title, summary, heroImage, facts, template, category }: Props) {
  const initial: ProjectsFields = {
    summary,
    facts: { type: facts.type, platform: facts.platform },
  };
  // Report differs + pending up to the page Publish bar (in the dashboard layout).
  const { setUnpublished } = usePublishSignal();

  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<ProjectsFields>({
    initial,
    buildCommitted: (v) => ({ summary: v.summary, facts: { ...v.facts } }),
    isDirty: (v, b) =>
      v.summary !== b.summary ||
      v.facts.type !== b.facts.type ||
      v.facts.platform !== b.facts.platform,
    saveExtras: { collection: "projects", slug },
    onSaved: () => setUnpublished(true),
  });

  // Sections are fetched separately from the list payload, which never carries them
  // (a project's sections are ~15KB, and the index shows four projects). boat-crest
  // is bespoke: a read-only notice, never fetched.
  const bespoke = BESPOKE_SLUGS.has(slug);
  // Sections are the reason you opened this page, so they are always visible and the
  // DETAILS collapse instead — the reverse of the old Details|Sections tabs, where the
  // thing you came for was one click away behind the thing you rarely change.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sectionsData, setSectionsData] = useState<RawSection[] | null>(null);
  // The canvas composes from `template`, so it lives HERE rather than inside the
  // toggle: flipping Mobile/Web has to recompose the preview immediately, and the
  // editor has to render with the right one from the start. Seeded from the
  // server prop, then owned by the toggle.
  const [templateValue, setTemplateValue] = useState(template);
  const [draftImages, setDraftImages] = useState<string[]>([]);
  const [sectionsStatus, setSectionsStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const setFact = (key: keyof EditableFacts, val: string) =>
    setField("facts", { ...values.facts, [key]: val });

  async function loadSections() {
    setSectionsStatus("loading");
    try {
      const res = await fetch(
        `/api/studio/case-study-sections?slug=${encodeURIComponent(slug)}`
      );
      const json = await res.json();
      if (res.ok && json.ok) {
        setSectionsData((json.sections ?? []) as RawSection[]);
        if (typeof json.template === "string") setTemplateValue(json.template);
        if (Array.isArray(json.draftImages)) setDraftImages(json.draftImages as string[]);
        setSectionsStatus("loaded");
      } else {
        setSectionsStatus("error");
      }
    } catch {
      setSectionsStatus("error");
    }
  }

  // Sections load on mount now that they are the default view. Still never for
  // bespoke, and still never re-fetched once loaded.
  useEffect(() => {
    if (!bespoke && sectionsStatus === "idle") void loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per mounted study
  }, []);

  const inputCls =
    "w-full rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30";

  return (
    <section
      aria-label={`Edit ${title}`}
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconGrid />
          </span>
          <span className="truncate font-display text-base text-ink-950">{title}</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-500">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* CS-1 — the draft-preferring preview opens in a new tab (never in-dashboard),
              so the owner keeps the editor open beside it. */}
          <a
            href={`/studio/projects/${slug}/preview`}
            target="_blank"
            rel="noopener"
            className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
          >
            Preview
          </a>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* The details STRIP. Summary, type and platform are the three you glance at,
          so they read straight off the bar; title and hero image live inside the
          expanded form because they are set once. Replaces the Details|Sections
          tablist — a case study is one thing, not two tabs. */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-ink-950/8 bg-cream-100 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-8 gap-y-2">
          <span className="flex min-w-0 max-w-[46ch] flex-col">
            <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Summary</span>
            <span className="truncate text-[12.5px] text-ink-600">
              {values.summary || "No summary yet"}
            </span>
          </span>
          <span className="flex flex-col">
            <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Type</span>
            <span className="text-[12.5px] text-ink-950">{values.facts.type || "—"}</span>
          </span>
          <span className="flex flex-col">
            <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Platform</span>
            <span className="text-[12.5px] text-ink-950">{values.facts.platform || "—"}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* CS-6a — case-study template toggle. Sections-owned only (bespoke
              boat-crest renders no template). Writes `template` via the Details save. */}
          {!bespoke && (
            <TemplateToggle
              slug={slug}
              initial={template}
              onChange={setTemplateValue}
              onSaved={() => setUnpublished(true)}
            />
          )}
          {/* Editorial taxonomy for the work-section filter (PR 1). Same !bespoke
              gate as the template toggle — boat-crest's category is set in content
              (the reseed), so its otherwise read-only panel grows no live control. */}
          {!bespoke && (
            <CategoryToggle
              slug={slug}
              initial={category}
              onSaved={() => setUnpublished(true)}
            />
          )}
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
            aria-controls={`cs-details-${slug}`}
            className="rounded-md border border-ink-950/8 bg-cream-50 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
          >
            Edit details {detailsOpen ? "▴" : "▾"}
          </button>
        </div>
      </div>

      {/* The facts form, UNCHANGED — same fields, same posted patch. Kept mounted
          (hidden, not unmounted) so collapsing the strip never drops its draft. */}
      <div id={`cs-details-${slug}`} hidden={!detailsOpen}>
        <div className="flex flex-col gap-5 px-4 py-5">
          {/* Title is the slugField (the entry identity). Shown read-only so an edit
              here never silently fails — it is set on Add and not editable. */}
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Title</span>
          <input
            type="text"
            value={title}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
            className="w-full cursor-not-allowed rounded-md border border-ink-950/8 bg-cream-100 px-3 py-2 text-[14px] text-ink-500 outline-none"
          />
          <span className="text-[10px] text-text-subtle">
            The project&rsquo;s identity, set when you add it. The case study body is edited below.
          </span>
        </label>

        <HeroImageField slug={slug} collection="projects" initial={heroImage} onChanged={() => setUnpublished(true)} />

        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Summary</span>
          <textarea
            rows={3}
            value={values.summary}
            onChange={(e) => setField("summary", e.target.value)}
            onBlur={saveDraft}
            className="w-full resize-y rounded-md border border-ink-950/8 bg-cream-50 px-3 py-2 text-[14px] leading-relaxed text-ink-950 outline-none transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
          />
          <span className="text-[10px] text-text-subtle">One sentence shown on the project card.</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          {FACTS.map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">{label}</span>
              <input
                type="text"
                value={values.facts[key]}
                onChange={(e) => setFact(key, e.target.value)}
                onBlur={saveDraft}
                placeholder={placeholder}
                className={inputCls}
              />
            </label>
          ))}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/8 bg-cream-100 px-4 py-3">
        <span className="text-[11px]" aria-live="polite">
          {saveStatus === "saving" ? (
            <span className="text-ink-500">Saving draft…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-accent-600">Draft saved</span>
          ) : saveStatus === "error" ? (
            <span className="text-accent-600">Save failed. Try again.</span>
          ) : saveStatus === "fs" ? (
            <span className="text-text-subtle">Draft save needs github mode (dev)</span>
          ) : (
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish from Site settings.</span>
          )}
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={!dirty || saveStatus === "saving"}
          className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
      </div>

      {/* Sections — the default and only view now, loaded on mount. boat-crest is
          bespoke → read-only notice, never fetched. */}
      <div className="px-4 py-5">
        {bespoke ? (
          <div className="rounded-lg border border-ink-950/8 bg-cream-100 px-4 py-8 text-center">
            <p className="font-display text-[15px] text-ink-950">Hand-built case study</p>
            <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-ink-600">
              {title} is a bespoke, hand-coded showpiece. Its sections and its work-filter
              category are set in code, not here. The details above stay editable.
            </p>
          </div>
        ) : sectionsStatus === "loaded" && sectionsData ? (
          <SectionsEditPanel
            slug={slug}
            sections={sectionsData}
            template={templateValue}
            draftImages={draftImages}
          />
        ) : sectionsStatus === "error" ? (
          <div className="rounded-lg border border-ink-950/8 bg-cream-100 px-4 py-8 text-center">
            <p className="text-[13px] text-accent-600">Could not load the sections.</p>
            <button
              type="button"
              onClick={() => void loadSections()}
              className="mt-2 rounded-md border border-ink-950/8 px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid place-items-center rounded-lg border border-ink-950/8 bg-cream-100 px-4 py-8 text-[13px] text-text-subtle">
            Loading sections…
          </div>
        )}
      </div>
    </section>
  );
}

// P4-1 — heroImage upload field. Separate from the text useDraftForm: it posts a
// multipart upload to /api/studio/upload-hero-image, which normalizes to webp and
// commits the blob + yaml path to the draft branch. Preview is optimistic — an
// object URL of the just-picked file (the committed draft blob is not served from
// local disk in dev); an existing published path falls back to a placeholder if
// it does not resolve. Reports its own pending state so Publish waits on uploads.
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;

export function HeroImageField({
  slug,
  collection,
  initial,
  onChanged,
}: {
  slug: string;
  /** BS-3c — which collection's hero tree the upload lands in. REQUIRED, mirroring the
   *  change BlockImageField took in #172: a default is exactly how blog would inherit the
   *  projects tree. #173 generalised commitEntryHeroImage, so the route accepts both. */
  collection: "projects" | "blog";
  initial: string | null;
  onChanged: () => void;
}) {
  const [current, setCurrent] = useState<string | null>(initial);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // object URL, session-only
  const [brokenSrc, setBrokenSrc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "note"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useReportPending(busy);

  const shownSrc = previewUrl ?? (current && !brokenSrc ? current : null);

  async function send(file: File | null) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setStatus(null);
    const objUrl = file ? URL.createObjectURL(file) : null;
    try {
      const fd = new FormData();
      fd.append("collection", collection);
      fd.append("slug", slug);
      if (file) fd.append("file", file);
      else fd.append("clear", "true");
      const res = await fetch("/api/studio/upload-hero-image", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok && json.saved) {
        if (objUrl) {
          setBrokenSrc(false);
          setPreviewUrl(objUrl);
        } else {
          setPreviewUrl(null); // cleared
        }
        setCurrent(json.heroImage ?? null);
        onChanged();
      } else if (res.ok && json.mode === "fs") {
        setStatus({ kind: "note", text: "Image upload needs github mode (dev)." });
        if (objUrl) URL.revokeObjectURL(objUrl);
      } else {
        setStatus({ kind: "error", text: uploadError(res.status, json.error) });
        if (objUrl) URL.revokeObjectURL(objUrl);
      }
    } catch {
      setStatus({ kind: "error", text: "Upload failed. Try again." });
      if (objUrl) URL.revokeObjectURL(objUrl);
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setStatus({ kind: "error", text: "Use a PNG, JPG, or WebP image." });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus({ kind: "error", text: "Image must be under 12 MB." });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    void send(file);
  }

  const hasImage = shownSrc !== null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Hero image</span>
      <div className="flex items-center gap-4">
        <div className="relative aspect-[21/9] w-40 shrink-0 overflow-hidden rounded-md border border-ink-950/8 bg-cream-100">
          {hasImage ? (
            // Plain img (not next/image): the source is either a session object URL
            // or a public path; onError falls back to the placeholder so an unresolved
            // draft path never shows a broken image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownSrc!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setBrokenSrc(true)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] text-text-subtle">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPick}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-fit rounded-md bg-accent-500 px-3 py-1.5 text-[12px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Uploading…" : hasImage ? "Replace image" : "Upload image"}
          </button>
          {current && !busy && (
            <button
              type="button"
              onClick={() => void send(null)}
              className="w-fit rounded-md px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <span className="text-[10px]" aria-live="polite">
        {status ? (
          <span className={status.kind === "error" ? "text-accent-600" : "text-text-subtle"}>
            {status.text}
          </span>
        ) : (
          <span className="text-text-subtle">
            PNG, JPG, or WebP up to 12 MB. Stored as WebP. Publishes with your other changes.
          </span>
        )}
      </span>
    </div>
  );
}

function uploadError(status: number, code?: string): string {
  if (status === 415 || code === "unsupported_type") return "Use a PNG, JPG, or WebP image.";
  if (status === 413 || code === "file_too_large") return "Image must be under 12 MB.";
  if (status === 404) return "This project no longer exists.";
  if (status === 401) return "Session expired. Sign in again.";
  return "Upload failed. Try again.";
}

// CS-6a — the case-study template toggle. Posts a HEAD patch
// { collection:"projects", slug, patch:{ template } } to the SAME save-draft route
// the Details form uses (NOT the sections payload — that keeps the two save seams
// apart). Web -> "web" (browser default), Mobile -> "mobile" (phone default) via
// CS-4's mapping. The optimistic-save-with-revert, the pending report, and the
// markup now live in the shared SegmentedToggle; this passes the template-only
// bits, including the onChange that recomposes the canvas as the value flips.
function TemplateToggle({
  slug,
  initial,
  onSaved,
  onChange,
}: {
  slug: string;
  initial: string;
  onSaved: () => void;
  /** Report the current value up, so the canvas recomposes as soon as it flips. */
  onChange?: (t: string) => void;
}) {
  return (
    <SegmentedToggle
      slug={slug}
      initial={initial}
      patchKey="template"
      label="Template"
      ariaLabel="Case study template"
      onSaved={onSaved}
      onChange={onChange}
    />
  );
}

// The work-section filter category (PR 1). Same control as the template toggle,
// minus the onChange: category is EDITORIAL taxonomy that drives no rendering, so
// there is no canvas recompose. Writes the `category` field to the same draft.
function CategoryToggle({
  slug,
  initial,
  onSaved,
}: {
  slug: string;
  initial: string;
  onSaved: () => void;
}) {
  return (
    <SegmentedToggle
      slug={slug}
      initial={initial}
      patchKey="category"
      label="Category"
      ariaLabel="Work filter category"
      onSaved={onSaved}
    />
  );
}
