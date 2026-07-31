"use client";

// Links edit panel (Surface B). Item 10 migrated the fixed link fields to a
// `links` ARRAY of { label, url } plus a separate `email` field (PR 1). This is
// the full row editor (PR 2): add / remove / reorder link rows, whole-array save
// through the settings path, per-row URL validation.
//
// SK-3b — each row has a STABLE CLIENT ID kept in a parallel `ids` array, EXTERNAL
// to the form values, so a row keeps its React key across reorder and rename (an
// index key would break focus/state on reorder). The POST shape stays the id-less
// { label, url }[]. ids and values.links are always mutated together, index-aligned.
//
// URL validation is client-side (mirroring validateUrlFields): a blank url is
// valid (its link is just omitted from the render); a non-empty value must parse.
// The save is GATED while any url is invalid; the server 422 invalid_url stays the
// github-mode backstop.
import { useRef, useState } from "react";
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconArrowUpRight, IconChevronUp, IconChevronDown, IconX, IconPlus } from "./icons";
import type { LinkItem } from "@/lib/studio/site-settings-format";
import { labelCls, FIELD_MEASURE } from "./blocks/fields";

type Props = {
  itemId: string;
  email: string;
  links: LinkItem[];
};

type LinksFields = { email: string; links: LinkItem[] };

function isValidUrl(value: string): boolean {
  if (value.trim() === "") return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function sameLinks(a: LinkItem[], b: LinkItem[]): boolean {
  return a.length === b.length && a.every((l, i) => l.label === b[i].label && l.url === b[i].url);
}

// Trim each row and DROP fully-blank rows, so a row the owner added but never
// filled is neither committed to the draft nor counted as dirty. Both
// buildCommitted and isDirty use this (mirroring About's trimChips), so a trailing
// blank row is invisible to the save boundary — adding a row does not, by itself,
// make the form dirty or commit an empty {label:'',url:''} on the next blur.
function nonBlank(links: LinkItem[]): LinkItem[] {
  return links
    .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
    .filter((l) => l.label !== "" || l.url !== "");
}

// DELIBERATELY LOCAL, AND NOT THE SHARED `inputClsMd` — the COMPOSED-BORDER family of the
// deliberate locals (see ralph's studio-ink suite, which names all three families). Every
// input in this panel supplies its border through the two constants below, per validation
// state, which the shared string cannot express: importing it and appending overrides would
// leave two competing border declarations whose winner is decided by the generated sheet
// rather than by this file — the trap BoldToolbar's header already records.
// (The border-colour and focus-override properties are named without their utility spelling on
// purpose. Tailwind v4 scans raw source text, comments included, so writing the class name
// here would EMIT it — the union-of-declarations gate caught exactly that, and it is how a
// comment ships dead CSS.)
//
// ONE BASE, THREE COMPOSITIONS — the PR 2a defect, closed. 2a's edit reached only the ONE
// consumer this constant then had, while the email and URL inputs in the same file were
// separate literals. Measured: every link row showed a 44px cream-100 well (Label) beside a
// 39px cream-50 flat box (URL), with the email above them flat too — one panel, both
// generations of the design at once. The three strings are now this single base, so the four
// controls cannot disagree again. Width is per-site: the row inputs are flex children, the
// email and URL are w-full.
//
// STAYING LOCAL DOES NOT MEAN STAYING BEHIND: the reasons above are about the BORDER, not the
// well, so the height and ground track blocks/fields.tsx exactly and move whenever it does.
const inputBase =
  "min-h-11 rounded-[var(--studio-radius-control,4px)] border bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:ring-1";
const okBorder = "border-ink-950/12 focus:border-accent-500 focus:ring-accent-500/30";
const errBorder = "border-accent-500 focus:border-accent-500 focus:ring-accent-500/30";
const iconBtn =
  "grid size-8 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors enabled:hover:bg-cream-200 enabled:hover:text-ink-950 disabled:opacity-30 [&>svg]:size-4";

export default function LinksEditPanel({ itemId, email, links }: Props) {
  const initial: LinksFields = { email, links };
  const { setUnpublished } = usePublishSignal();

  // Client-only stable ids, aligned by index with values.links (SK-3b). Deterministic
  // initial ids (l0, l1, …) so SSR and the first client render agree; a ref counter
  // mints ids for added rows. Only add/remove/reorder change this array.
  const nextId = useRef(links.length);
  const [ids, setIds] = useState<string[]>(() => links.map((_, i) => `l${i}`));
  const pendingFocus = useRef<number | null>(null);

  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<LinksFields>({
    initial,
    // Trim each row and drop fully-blank rows at the save boundary, so an added-
    // but-unfilled row is never committed to the draft (a blank row a blur would
    // otherwise commit) — the owner still sees it in the UI until they fill or
    // remove it. buildSiteLinks also omits any blank-url link from the render.
    buildCommitted: (v) => ({ email: v.email, links: nonBlank(v.links) }),
    isDirty: (v, b) => v.email !== b.email || !sameLinks(nonBlank(v.links), b.links),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists)

  const rows = values.links;
  const hasUrlError = rows.some((l) => !isValidUrl(l.url));
  const handleBlur = () => {
    if (!hasUrlError) saveDraft();
  };

  const updateLink = (i: number, patch: Partial<LinkItem>) =>
    setField("links", rows.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // add/remove/reorder touch BOTH arrays in one batch so they stay index-aligned.
  function addLink() {
    pendingFocus.current = rows.length;
    setField("links", [...rows, { label: "", url: "" }]);
    setIds((prev) => [...prev, `l${nextId.current++}`]);
  }
  function removeLink(i: number) {
    setField("links", rows.filter((_, idx) => idx !== i));
    setIds((prev) => prev.filter((_, idx) => idx !== i));
  }
  function moveLink(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const nextLinks = [...rows];
    [nextLinks[i], nextLinks[j]] = [nextLinks[j], nextLinks[i]];
    setField("links", nextLinks);
    setIds((prev) => {
      const nextIds = [...prev];
      [nextIds[i], nextIds[j]] = [nextIds[j], nextIds[i]];
      return nextIds;
    });
  }

  return (
    <section
      aria-label="Edit Links"
      // NO FRAME — these pages are full-height shells since #242, so a panel frame here is a box
      // drawn around a box, and its `overflow-hidden` clipped the pane's own scrolling. The full
      // reasoning and the measurements are on `AboutEditPanel`'s copy of this line.
      className="bg-cream-100"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/12 bg-cream-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-[var(--studio-radius-control,4px)] bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconArrowUpRight />
          </span>
          <span className="font-display text-base text-ink-950">Links</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-text-subtle">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-[var(--studio-radius-control,4px)] px-2 py-1 text-[12px] font-semibold text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Contact email</span>
          <input
            type="text"
            inputMode="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={handleBlur}
            className={`${inputBase} w-full ${FIELD_MEASURE} ${okBorder}`}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Links</span>
          <div className="flex flex-col gap-2">
            {rows.map((link, i) => {
              const invalid = !isValidUrl(link.url);
              const errorId = `links-${ids[i]}-error`;
              const name = link.label.trim() || `link ${i + 1}`;
              return (
                <div key={ids[i]} className="flex flex-col gap-1.5 rounded-[var(--studio-radius-card,8px)] border border-ink-950/12 bg-cream-200 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={link.label}
                      ref={(el) => {
                        if (el && pendingFocus.current === i) {
                          el.focus();
                          pendingFocus.current = null;
                        }
                      }}
                      onChange={(e) => updateLink(i, { label: e.target.value })}
                      onBlur={handleBlur}
                      placeholder="Label"
                      className={`${inputBase} min-w-0 flex-1 ${FIELD_MEASURE} ${okBorder}`}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => moveLink(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${name} up`}
                      className={iconBtn}
                    >
                      <IconChevronUp />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => moveLink(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label={`Move ${name} down`}
                      className={iconBtn}
                    >
                      <IconChevronDown />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => removeLink(i)}
                      aria-label={`Remove ${name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 text-ink-400 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-4"
                    >
                      <IconX />
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    onBlur={handleBlur}
                    placeholder="https://…"
                    aria-invalid={invalid || undefined}
                    aria-describedby={invalid ? errorId : undefined}
                    className={`${inputBase} w-full ${FIELD_MEASURE} ${
                      invalid ? errBorder : okBorder
                    }`}
                  />
                  {invalid && (
                    <span id={errorId} className="text-[10px] text-accent-600" aria-live="polite">
                      Enter a full URL including https://
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-accent-500/40 hover:text-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> Add link
          </button>
          <span className="text-[10px] text-text-subtle">
            Shown in order in the header and footer. A blank URL hides its link.
          </span>
        </div>
      </div>

      <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-ink-950/12 bg-cream-200 px-4 py-3">
        <span className="text-[12px]" aria-live="polite">
          {hasUrlError ? (
            <span className="text-accent-600">Fix the highlighted URL to save.</span>
          ) : saveStatus === "saving" ? (
            <span className="text-text-subtle">Saving draft…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-accent-600">Draft saved</span>
          ) : saveStatus === "error" ? (
            <span className="text-accent-600">Save failed. Try again.</span>
          ) : saveStatus === "fs" ? (
            <span className="text-text-subtle">Draft save needs github mode (dev)</span>
          ) : (
            <span className="text-text-subtle">Auto-saves to draft on blur. Publish from the Hero panel.</span>
          )}
        </span>
        <button
          type="button"
          onClick={saveDraft}
          disabled={!dirty || saveStatus === "saving" || hasUrlError}
          className="rounded-[var(--studio-radius-control,4px)] bg-accent-500 px-4 py-2 text-[14px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
    </section>
  );
}
