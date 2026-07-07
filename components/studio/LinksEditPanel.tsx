"use client";

// PL-2a — Links edit panel (Surface B). The fourth inline-editable settings
// group, mirroring the About panel's proven save-draft pattern (thin over
// useDraftForm, no Publish — Publish is singleton-wide and lives on Hero). The
// save posts a PARTIAL patch of only the five link fields, so DB-1 accumulates
// it onto the draft without touching the Hero or About edits.
//
// URL validation is done here, client-side, mirroring validateUrlFields in
// site-settings-format.ts. The server's sanitizeSiteSettingsPatch only
// type-checks; URL format is validated at commit (transformSiteSettings), which
// runs in github mode only — so in fs/dev the server would never surface a bad
// URL. We show a per-field error and GATE the save (never post) while any URL
// field is invalid; the server 422 invalid_url stays as the github-mode backstop.
import { useDraftForm } from "./useDraftForm";
import { usePublishSignal, useReportPending } from "./PublishProvider";
import { useListItem } from "./ListDetailLayout";
import { IconArrowUpRight } from "./icons";
import { URL_FIELDS } from "@/lib/studio/site-settings-format";

type Props = {
  resumeUrl: string;
  email: string;
  linkedinUrl: string;
  dribbbleUrl: string;
  behanceUrl: string;
};

type LinksFields = Props;

// Mirrors validateUrlFields: a blank field is valid (it gets stripped and the
// link is omitted); a non-empty value must parse with the URL constructor.
function isValidUrl(value: string): boolean {
  if (value.trim() === "") return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const URL_FIELD_KEYS = URL_FIELDS as readonly (keyof LinksFields)[];

const FIELD_LABELS: Record<keyof LinksFields, string> = {
  resumeUrl: "Resume URL",
  email: "Contact email",
  linkedinUrl: "LinkedIn URL",
  dribbbleUrl: "Dribbble URL",
  behanceUrl: "Behance URL",
};

// email is not URL-validated (it is fields.text, not fields.url); it renders
// between the socials to match the schema order.
const FIELD_ORDER: (keyof LinksFields)[] = [
  "resumeUrl",
  "email",
  "linkedinUrl",
  "dribbbleUrl",
  "behanceUrl",
];

export default function LinksEditPanel({ itemId, ...fields }: Props & { itemId: string }) {
  const initial: LinksFields = { ...fields };
  // UX-1: report this panel's differs + pending state up to the page Publish bar.
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
    buildCommitted: (v) => ({ ...v }),
    isDirty: (v, b) =>
      v.resumeUrl !== b.resumeUrl ||
      v.email !== b.email ||
      v.linkedinUrl !== b.linkedinUrl ||
      v.dribbbleUrl !== b.dribbbleUrl ||
      v.behanceUrl !== b.behanceUrl,
    onSaved: () => setUnpublished(true),
  });

  useReportPending(dirty || saveStatus === "saving");
  const { isSelected } = useListItem(itemId, dirty);
  if (!isSelected) return null; // stays MOUNTED (draft persists); the shell shows the selected item

  const invalidFields = URL_FIELD_KEYS.filter((k) => !isValidUrl(values[k]));
  const hasUrlError = invalidFields.length > 0;

  // Gate the on-blur auto-save: never post while a URL field is invalid, so an
  // invalid URL is not committed. The inline error (derived from values) still
  // shows. A corrected value blurs and saves normally.
  const handleBlur = () => {
    if (!hasUrlError) saveDraft();
  };

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
          // preventDefault on mousedown keeps focus on the edited field, so the
          // blur auto-save never fires for edits the click is about to discard.
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          className="rounded-md px-2 py-1 text-[12px] text-ink-600 transition-colors hover:bg-cream-200 hover:text-ink-950"
        >
          Cancel
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-5">
        {FIELD_ORDER.map((key) => {
          const invalid = URL_FIELD_KEYS.includes(key) && !isValidUrl(values[key]);
          const errorId = `links-${key}-error`;
          return (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">
                {FIELD_LABELS[key]}
              </span>
              <input
                type="text"
                inputMode={key === "email" ? "email" : "url"}
                value={values[key]}
                onChange={(e) => setField(key, e.target.value)}
                onBlur={handleBlur}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? errorId : undefined}
                className={`w-full rounded-md border bg-cream-50 px-3 py-2 text-[14px] text-ink-950 outline-none transition-colors focus:ring-1 ${
                  invalid
                    ? "border-accent-500 focus:border-accent-500 focus:ring-accent-500/30"
                    : "border-ink-950/8 focus:border-accent-500 focus:ring-accent-500/30"
                }`}
              />
              {invalid && (
                <span id={errorId} className="text-[10px] text-accent-600" aria-live="polite">
                  Enter a full URL including https://
                </span>
              )}
            </label>
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
