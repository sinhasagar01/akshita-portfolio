"use client";

// Links edit panel (Surface B). Item 10 migrated the fixed resume/linkedin/
// dribbble/behance fields to a `links` ARRAY of { label, url } plus a separate
// `email` field. This is the MINIMAL migration-PR editor: it edits `email` and
// the EXISTING link rows (label + url) in place, with per-row URL validation and a
// whole-array save through the settings path. Add / remove / reorder come in the
// follow-up editor PR (which needs stable client ids for reorder); until then the
// rows are fixed, so an index key is safe.
//
// URL validation is client-side (mirroring validateUrlFields): a blank url is
// valid (its link is just omitted from the render); a non-empty value must parse.
// The save is GATED while any url is invalid; the server 422 invalid_url stays the
// github-mode backstop.
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconArrowUpRight } from "./icons";
import type { LinkItem } from "@/lib/studio/site-settings-format";

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

export default function LinksEditPanel({ itemId, email, links }: Props) {
  const initial: LinksFields = { email, links };
  const { setUnpublished } = usePublishSignal();

  const {
    values,
    setField,
    dirty,
    saveStatus,
    saveDraft,
    cancel,
  } = useDraftForm<LinksFields>({
    initial,
    buildCommitted: (v) => ({
      email: v.email,
      links: v.links.map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
    }),
    isDirty: (v, b) => v.email !== b.email || !sameLinks(v.links, b.links),
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists)

  const hasUrlError = values.links.some((l) => !isValidUrl(l.url));

  const updateLink = (i: number, patch: Partial<LinkItem>) =>
    setField("links", values.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // Gate the on-blur auto-save: never post while a url is invalid.
  const handleBlur = () => {
    if (!hasUrlError) saveDraft();
  };

  const inputCls =
    "w-full rounded-md border bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:ring-1";
  const okBorder = "border-ink-950/8 focus:border-accent-500 focus:ring-accent-500/30";

  return (
    <section
      aria-label="Edit Links"
      className="overflow-hidden rounded-xl border border-accent-500/30 bg-cream-50"
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-950/8 bg-cream-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="grid size-6 place-items-center rounded-md bg-accent-500/10 text-accent-500 [&>svg]:size-3.5">
            <IconArrowUpRight />
          </span>
          <span className="font-display text-base text-ink-950">Links</span>
          {dirty && (
            <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-500">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Contact email</span>
          <input
            type="text"
            inputMode="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={handleBlur}
            className={`${inputCls} ${okBorder}`}
          />
        </label>

        {values.links.map((link, i) => {
          const invalid = !isValidUrl(link.url);
          const errorId = `links-${i}-error`;
          return (
            <div key={i} className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                {link.label.trim() || `Link ${i + 1}`}
              </span>
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
                onBlur={handleBlur}
                placeholder="Label"
                className={`${inputCls} ${okBorder}`}
              />
              <input
                type="text"
                inputMode="url"
                value={link.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
                onBlur={handleBlur}
                placeholder="https://…"
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? errorId : undefined}
                className={`${inputCls} ${
                  invalid ? "border-accent-500 focus:border-accent-500 focus:ring-accent-500/30" : okBorder
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

      <footer className="flex items-center justify-between gap-3 border-t border-ink-950/8 bg-cream-100 px-4 py-3">
        <span className="text-[11px]" aria-live="polite">
          {hasUrlError ? (
            <span className="text-accent-600">Fix the highlighted URL to save.</span>
          ) : saveStatus === "saving" ? (
            <span className="text-ink-500">Saving draft…</span>
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
          className="rounded-md bg-accent-500 px-4 py-2 text-[13px] font-medium text-cream-50 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveStatus === "saving" ? "Saving…" : "Save draft"}
        </button>
      </footer>
    </section>
  );
}
