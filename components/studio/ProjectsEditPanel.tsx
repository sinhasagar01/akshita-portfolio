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
import { inputClsMd, labelCls, FieldKey} from "./blocks/fields";
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
  /** Resolved server-side — `lib/site.ts` pulls node:fs, so the path arrives as a string. */
  livePath: string;
  /** Every study, for the crumb row's switcher. */
  studies: { slug: string; title: string }[];
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

export default function ProjectsEditPanel({ itemId, slug, title, summary, heroImage, facts, template, category, livePath, studies }: Props) {
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

  // Sections load once the panel is SELECTED. Still never for bespoke, and still never
  // re-fetched once loaded.
  //
  // ---- HAZARD 17 IS CLOSED HERE, AND THE FETCH GATE IS WHY IT IS TWO CHANGES -------------
  //
  // The `rules-of-hooks` disable that used to sit on this hook is GONE, along with the early
  // return that caused it. `if (!isSelected) return null` sat ABOVE this `useEffect`, so on any
  // render where it fired React would see one fewer hook than the render before and the hook
  // order would break. It was latent, never active: `useListItem` returns
  // `isSelected: ctx === null ? true : activeId === id`, and this panel mounts at exactly one
  // place — app/studio/(dashboard)/projects/[slug]/page.tsx — OUTSIDE any ListDetailLayout, so
  // `ctx` is null and `isSelected` is always true. It would have become a crash the moment the
  // panel was placed in the list shell its own comment says it is built for, which is exactly
  // what the three-pane case-study editor does. That is why this lands BEFORE the shell work,
  // not alongside it.
  //
  // THE EARLY RETURN NOW SITS BELOW EVERY HOOK (see it under this effect), which is the fix the
  // hazard named. Moving it alone would have been wrong, though: with the return below the
  // hooks, an UNSELECTED panel would reach this effect and fetch. Sections are deliberately not
  // in the list payload because they are ~15KB per study and the index shows four, so mounting
  // four panels in a shell would turn one fetch into four on mount. Gating the effect BODY on
  // `isSelected` keeps the lazy-fetch property the payload split exists for: today it is always
  // true so this fires on mount exactly as before, and in a shell it fires on first selection.
  // `sectionsStatus === "idle"` still makes it once-only, so re-selecting never refetches.
  useEffect(() => {
    if (!isSelected || bespoke || sectionsStatus !== "idle") return;
    void loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once, on first selection
  }, [isSelected]);

  // BELOW THE HOOKS, DELIBERATELY — this is hazard 17's fix. The panel stays MOUNTED so its
  // draft persists; the shell shows the selected item.
  if (!isSelected) return null;

  // THE DETAILS FORM IS NOW A NODE, mounted in the INSPECTOR when the rail's Details entry is
  // selected. The read-only strip and the `Edit details ▾` disclosure that used to sit above the
  // body are both gone: the crumb row carries identity once and the rail carries navigation, so a
  // strip duplicating three fields and a disclosure hiding the rest were surface with nothing
  // left to do.
  //
  // AND IT CLOSES A REAL BUG INCIDENTALLY. The Save-draft footer lived INSIDE that disclosure, so
  // with the strip collapsed — its default state — the only control that saved these fields could
  // not be reached. Nothing failed; it simply was not clickable. Here the footer is part of the
  // node, so whenever the form is on screen its save is too.
  const detailsNode = (
    <div className="flex flex-col">
      {/* THE STUDY-LEVEL CONTROLS AND ACTIONS, re-homed from the deleted strip and header.
          Template and category are LIVE controls — they were never read-only glances — so they
          move with the fields they belong beside rather than disappearing with the strip that
          happened to hold them.
          THE COLOUR IS ON THIS ROW, NOT ON THE LINK. The Preview <a> and the Cancel <button>
          carried BYTE-IDENTICAL class strings and only the button's worked: an unlayered
          `a { color: inherit }` beats the utility layer, so the anchor had never been ink-600.
          Setting it on the row lets the anchor inherit it with no extra element — hazard 22,
          and `studio-ink` E6 pins it. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-950/12 bg-cream-200 px-4 py-2.5">
        {/* THE TWO TOGGLES SHARE A LINE AND SPREAD ACROSS IT, which needs a wrapper rather than
            a class on the row. Measured: the row has three children and the actions sit on
            `ml-auto`, and an auto margin absorbs the free space BEFORE `justify-content` is
            consulted — so `justify-between` on the row itself renders nothing (Category stays at
            72px), and removing `ml-auto` to make it bite drops Category in the CENTRE at 393px.
            Neither is the drawing. A wrapper holding only the two toggles has two children, which
            is the shape `space-between` was drawn for.
            `w-full` RATHER THAN `flex-1`, and that is what keeps the actions where they are. The
            row is `flex-wrap` inside a 313px inspector; a full-width child takes its own line and
            the actions wrap beneath exactly as they do today. `flex-1` would try to share the
            line, leaving the toggles 179px between them and squeezing both. */}
        {!bespoke && (
          <div className="flex w-full items-start justify-between gap-3">
            <TemplateToggle
              slug={slug}
              initial={template}
              onChange={setTemplateValue}
              onSaved={() => setUnpublished(true)}
            />
            <CategoryToggle
              slug={slug}
              initial={category}
              onSaved={() => setUnpublished(true)}
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 text-ink-600">
          {/* CS-1 — the draft-preferring preview opens in a new tab (never in-dashboard),
              so the owner keeps the editor open beside it. */}
          <a
            href={`/studio/projects/${slug}/preview`}
            target="_blank"
            rel="noopener"
            className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold transition-colors hover:bg-cream-200"
          >
            Preview
          </a>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
          >
            Cancel
          </button>
        </div>
      </div>
        <div className="flex flex-col gap-5 px-4 py-5">
          {/* Title is the slugField (the entry identity). Shown read-only so an edit
              here never silently fails — it is set on Add and not editable. */}
        <label className="flex flex-col gap-1.5">
          <FieldKey>Title</FieldKey>
          <input
            type="text"
            value={title}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
            // DELIBERATELY LOCAL — the READONLY-DISPLAY family; ExperienceEditPanel's
            // Company field carries the full reasoning, including why `text-ink-500` was a
            // phantom (hazard 23, now closed) re-pointed to text-text-subtle. The family's real distinction is
            // the focus styling the export carries, dead on tabIndex={-1}, plus
            // cursor-not-allowed. Height tracks the well.
            className="min-h-11 w-full cursor-not-allowed rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-200 px-3 py-2 text-[14px] text-text-subtle outline-none"
          />
          <span className="text-[10px] text-text-subtle">
            The project&rsquo;s identity, set when you add it. The case study body is edited below.
          </span>
        </label>

        <HeroImageField slug={slug} collection="projects" initial={heroImage} onChanged={() => setUnpublished(true)} />

        <label className="flex flex-col gap-1.5">
          <FieldKey>Summary</FieldKey>
          <textarea
            rows={3}
            value={values.summary}
            onChange={(e) => setField("summary", e.target.value)}
            onBlur={saveDraft}
            className={`${inputClsMd} resize-y leading-relaxed`}
          />
          <span className="text-[10px] text-text-subtle">One sentence shown on the project card.</span>
        </label>

        <div className="flex flex-col gap-3">
          {FACTS.map(({ key, label, placeholder }) => (
            <label key={key} className="flex flex-col gap-1.5">
              <FieldKey>{label}</FieldKey>
              <input
                type="text"
                value={values.facts[key]}
                onChange={(e) => setFact(key, e.target.value)}
                onBlur={saveDraft}
                placeholder={placeholder}
                className={inputClsMd}
              />
            </label>
          ))}
        </div>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/12 bg-cream-200 px-4 py-3">
        <span className="text-[12px]" aria-live="polite">
          {saveStatus === "saving" ? (
            <span className="text-text-subtle">Saving draft…</span>
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
          className="rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[14px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {/* "Save details", NOT "Save draft" — #200's fix, second instance. Two footers are
              visible at once when Details is selected, this one and the sections footer, and
              they commit genuinely different drafts (facts through this panel's useDraftForm,
              sections through SectionsEditPanel's). By role neither is wrong. The defect was
              that identical labels CLAIMED they were the same action. As in #200, the button
              was the only string that never named its object, and as in #200 the progress
              label is left alone: the ambiguity is in the RESTING label, which is what gets
              read while deciding. */}
          {saveStatus === "saving" ? "Saving…" : "Save details"}
        </button>
      </footer>
    </div>
  );

  // BESPOKE, LOADING AND ERROR KEEP A PLAIN PANEL. None of them has sections to navigate, so a
  // three-pane shell would be two empty panes beside a notice. Only the loaded state composes it.
  if (bespoke || sectionsStatus !== "loaded" || !sectionsData) {
    return (
      // ---- THIS ONE KEEPS ITS FRAME, AND THAT IS THE POINT OF SCOPING THE CHANGE ----------
      //
      // Five sibling panels lost this frame because they render inside the full-height list-detail
      // pane, where it is a box around a box. THIS branch does not: it is the case-study route's
      // bespoke/loading/error fallback, a lone notice on a PAGE that scrolls. Strip its frame and
      // it becomes text floating on the canvas with nothing to say where it begins.
      // A class-level sweep across "the panel section" would have taken it — the fourth firing of
      // the shared-seam trap in this sequence — so `studio-ink` derives the shell consumers from
      // the three `ListDetailLayout` call sites and asserts THIS file is not among them.
      //
      // AND THE PADDING IS A SECOND DEFECT, FIXED HERE. #233 dropped `STUDIO_PAGE` from the
      // case-study route so the three-pane editor could reach the viewport edges, and this
      // fallback never got padding of its own — measured, it sat flush against the sidebar at
      // `distanceFromMainLeftEdge: 0`. The wrapper restores what the route used to supply, for
      // this branch only, because the loaded state genuinely wants the edges.
      <div className="p-4 lg:p-6">
      <section
        aria-label={`Edit ${title}`}
        className="overflow-hidden rounded-[var(--studio-radius-panel,12px)] border border-accent-500/30 bg-cream-100"
      >
        <header className="flex items-center justify-between gap-3 border-b border-ink-950/12 bg-cream-200 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
              <IconGrid />
            </span>
            <span className="truncate font-display text-base text-ink-950">{title}</span>
            {dirty && (
              <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-text-subtle">
                Unsaved changes
              </span>
            )}
          </div>
        </header>
        {detailsNode}
        <div className="px-4 pb-5">
          {bespoke ? (
          <div className="rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-200 px-4 py-8 text-center">
            <p className="font-display text-[15px] text-ink-950">Hand-built case study</p>
            {/* THE MEASURE IS ON THE WRAPPER, NOT THE <p>. `max-w-[46ch]` on the paragraph
                itself rendered 68ch — the unlayered `p { max-width: 68ch }` reset beats any
                layered utility, and re-asserting it scoped does not help, because an unlayered
                `.studio-chrome p` would beat the utility too. The constraint has to sit on an
                element the reset does not name. Found by ralph's studio-cascade suite. */}
            <div className="mx-auto mt-2 max-w-[46ch]">
              <p className="text-[14px] leading-relaxed text-ink-600">
                {title} is a bespoke, hand-coded showpiece. Its sections and its work-filter
                category are set in code, not here. The details above stay editable.
              </p>
            </div>
          </div>
          ) : sectionsStatus === "error" ? (
          <div className="rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-200 px-4 py-8 text-center">
            <p className="text-[14px] text-accent-600">Could not load the sections.</p>
            <button
              type="button"
              onClick={() => void loadSections()}
              className="mt-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
            >
              Try again
            </button>
          </div>
          ) : (
          <div className="grid place-items-center rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-200 px-4 py-8 text-[14px] text-text-subtle">
            Loading sections…
          </div>
          )}
        </div>
      </section>
      </div>
    );
  }

  return (
    <SectionsEditPanel
      slug={slug}
      title={title}
      sections={sectionsData}
      template={templateValue}
      draftImages={draftImages}
      detailsNode={detailsNode}
      detailsDirty={dirty}
      livePath={livePath}
      studies={studies}
    />
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
  label = "Hero image",
}: {
  slug: string;
  /** The field's own label. It has always rendered one; blog wants "Card image" because
   *  one `heroImage` serves both the article hero and the card thumbnail. Blog used to add
   *  a SECOND label outside the component instead, which is why the editor showed
   *  CARD IMAGE immediately followed by HERO IMAGE. The duplication was a missing prop,
   *  not a stray label, so neither string was deleted. Defaulted to the projects wording
   *  so projects' rendered output is byte-identical. */
  label?: string;
  /** BS-3c — which collection's hero tree the upload lands in. REQUIRED, mirroring the
   *  change BlockImageField took in #172: a default is exactly how blog would inherit the
   *  projects tree. #173 generalised commitEntryHeroImage, so the route accepts both. */
  collection: "projects" | "blog";
  initial: string | null;
  /** Fired after a successful upload or clear, with the values the caller would otherwise
   *  have to re-derive.
   *
   *  WIDENED FOR THE BLOG CANVAS, and additive on purpose. The blog canvas draws the hero,
   *  so it needs BOTH the committed path and a preview — `draftImages` is a snapshot taken
   *  server-side at page load, so a hero uploaded during the session is not in it and the
   *  committed path 404s against main until publish. See resolveHeroSrc.
   *
   *  IT HANDS UP THE `File`, NOT AN OBJECT URL, and that is hazard 15's fix. Passing the url
   *  made two components share one revocable resource that neither could safely free. Passing
   *  the File lets each make its own from the same Blob and free exactly that. See the
   *  `previewUrl` note below for why an unmount-time revoke was not an option.
   *
   *  PROJECTS PASSES A ZERO-ARG ARROW AND IS UNTOUCHED. TypeScript accepts a lower-arity
   *  function where a higher-arity one is expected, so this widening cost the projects
   *  caller nothing — which is the check that decided it was safe to do here rather than
   *  fork the component. */
  onChanged: (info: { heroImage: string | null; file: File | null }) => void;
}) {
  const [current, setCurrent] = useState<string | null>(initial);
  // Object URL, session-only, and THIS COMPONENT OWNS THIS ONE OUTRIGHT.
  //
  // HAZARD 15 WAS FIXED BY REMOVING THE SHARED LIFETIME, NOT BY MANAGING IT. This URL used to
  // be handed to BlogEditPanel as a string, so two components displayed one resource and
  // neither could safely free it: revoking here blanks the canvas hero, revoking there blanks
  // this thumbnail. Worse, the two genuinely unmount independently — below the fold
  // BlogBlocksEditPanel renders the inspector INSTEAD of the canvas, so switching to the
  // canvas after an upload unmounts this field while the hero is still on screen. Any
  // unmount-time revoke here would break exactly the "upload it, then go look at it" flow.
  //
  // So `onChanged` now hands up the FILE. A second `createObjectURL` on the same File yields
  // a DISTINCT url backed by the same Blob — no copy of the bytes — and each component
  // revokes only what it created. Two owners, two textbook cleanups, no coupling.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  /** The url this component created and is still showing, so a replacement can free the one
   *  it supersedes. A ref rather than state: revocation is a side effect on a resource, not
   *  something the render reads. */
  const ownedUrl = useRef<string | null>(null);

  /** Free whatever this field created. Replaces on every new pick, and runs on unmount.
   *  Safe to call at unmount BECAUSE the url is this component's alone — nothing else can be
   *  displaying it. That is the property the File-passing above buys. */
  const releaseOwnUrl = () => {
    if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current);
    ownedUrl.current = null;
  };
  // Unmount only. Under StrictMode's dev double-invoke this cleanup fires once at mount, when
  // `ownedUrl` is still null and there is nothing to free, so the extra pass is a no-op.
  useEffect(() => releaseOwnUrl, []);
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
        // FREE THE ONE THIS REPLACES, before adopting the new one. This is the leak that was
        // real and unbounded: every successful upload used to strand its predecessor, and a
        // hero can be up to 12MB of Blob held alive by a url nobody reads any more.
        releaseOwnUrl();
        if (objUrl) {
          setBrokenSrc(false);
          ownedUrl.current = objUrl;
          setPreviewUrl(objUrl);
        } else {
          setPreviewUrl(null); // cleared — releaseOwnUrl above already freed the old preview
        }
        const committed = (json.heroImage ?? null) as string | null;
        setCurrent(committed);
        // The FILE goes up, not this url. The blog canvas needs a preview to draw the hero
        // before publish and makes its OWN url from the same Blob, so neither side is holding
        // a resource the other might free. Projects ignores the payload entirely.
        onChanged({ heroImage: committed, file });
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
      <span className={labelCls}>{label}</span>
      {/* THE PLATE STACKS ABOVE THE CONTROLS, which is what the contract's `.thumb` +
          `.rowbtns` describe — and THIS is the field the contract's `.thumb` was always
          describing. It sits under "Card image" in the POST section with the hint "the article
          hero and the card thumbnail". PR C mapped `.thumb` to ImageThumb and improved a
          different component; that change stands on its own merits, but this is the specified
          one.
          THE OLD SIDE-BY-SIDE ROW IS GONE, and with it the `flex-wrap` note about the controls
          wrapping by 2.2734px at 320px. That measurement described a layout that no longer
          exists: the plate is full width and the controls are on their own line beneath, so
          there is nothing to wrap.

          16/9 REPLACES 21/9 per the contract. The width comes from a HEIGHT CAP, not from
          `w-full`, because PR C measured a `w-full` plate at 941x1255px in the wide About
          panel — and this field renders in BOTH the 320px inspector AND the wide projects
          card, so it is exposed to exactly that. 160px cap x 16/9 = 284px max width; the
          inspector gives 280px, so there it is full-bleed and in the wide card it stops at
          284 instead of running to 900+. */}
      <div className="flex flex-col gap-2">
        <div
          className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-200"
          style={{ maxWidth: 160 * (16 / 9) }}
        >
          {hasImage ? (
            // Plain img (not next/image): the source is either a session object URL
            // or a public path; onError falls back to the placeholder so an unresolved
            // draft path never shows a broken image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownSrc!}
              alt=""
              // HEIGHT COMES FROM THE INSETS, NOT FROM `h-full`. The unlayered
              // `img, video { height: auto }` reset beats any layered height utility, so
              // `h-full` here rendered `auto` and the image never filled its 21/9 box — it
              // was merely clipped by the parent's overflow-hidden, which looks close enough
              // to hide the bug. `absolute inset-0` sizes the box without the height
              // property, so nothing the reset owns is contested. Same mechanism the
              // canvas-hero suite pins. Found by ralph's studio-cascade suite.
              className="absolute inset-0 w-full object-cover"
              onError={() => setBrokenSrc(true)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] text-text-subtle">
              No image
            </div>
          )}
        </div>
        {/* `.rowbtns` — flex, gap 8, align-items center. They stacked in a column before; the
            contract puts them on ONE line beneath the plate. Measured at the narrowest studio
            width to confirm two controls fit — see the PR body. */}
        <div className="flex items-center gap-2">
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
            className="w-fit rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-3 py-1.5 text-[12px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Uploading…" : hasImage ? "Replace image" : "Upload image"}
          </button>
          {current && !busy && (
            <button
              type="button"
              onClick={() => void send(null)}
              className="w-fit rounded-[var(--studio-radius-control,4px)] px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
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
