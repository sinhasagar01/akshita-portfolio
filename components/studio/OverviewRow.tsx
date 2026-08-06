import type { ReactNode } from "react";
import { IconChevronRight } from "./icons";

export type CardSignal = { label: string; tone?: "warn" | "muted" };

type Props = {
  /** Display index, e.g. "01". Decorative. */
  index: string;
  title: string;
  /** Inline SVG icon element. Rendered decorative. */
  icon: ReactNode;
  status: "live" | "code";
  meta?: string;
  /** Small sub-note under the meta, e.g. "facet labels in code". */
  note?: string;
  signals?: CardSignal[];
  /** Link target (a /studio route). When omitted the row is a visually LOCKED,
   *  non-interactive row (Contact): a plain div, never a link/button, no hover,
   *  shift or chevron. */
  href?: string;
  /** Accessible name for the link, e.g. "Edit Hero in Settings". */
  ariaLabel?: string;
};

// THE DOT, NOT A PILL — the signal the studio already uses everywhere else it says
// published-or-not: `BlogPostList`, `SectionsRail` and the case-study index all draw a 6px
// circular 6px dot beside a word. This row was the one surface carrying a filled
// badge instead, and a filled green pill reads as a stronger claim than "this section is live",
// which is the plainest fact on the page.
//
// IT ALSO RETIRES THE LAST 9.5px IN THE STUDIO. That size lived here and nowhere else — a scale
// of one, which is how a size stops being a scale.
//
// THE GROUND CHANGED WITH THE SHAPE, AND THAT IS WHY THE COLOUR IS RE-MEASURED RATHER THAN
// COPIED. The existing dots sit on the rails at cream-200 and cream-300; these rows sit on
// cream-50. A ratio belongs to the ground it was taken on — the third time this project has had
// to say so — so success-700 and ink-400 were measured again HERE. See the PR body.
//
// (The dot's utilities are described above WITHOUT their class spelling, deliberately. Tailwind
// v4 scans raw source text, comments included, so a class name written here EMITS it — and
// `studio-ink` F5 counts the pill shape over RAW source precisely because a comment can ship
// CSS. Second time in two PRs. The rule is in LinksEditPanel's header, and it is easiest to
// forget while explaining the very class you are adding.)
function StatusBadge({ status }: { status: "live" | "code" }) {
  const live = status === "live";
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-studio-ink-600">
      <span
        aria-hidden
        className={`size-1.5 shrink-0 rounded-full ${live ? "bg-studio-success-700" : "bg-studio-ink-400"}`}
      />
      {live ? "Live" : "In code"}
    </span>
  );
}

// Overview row (Task 2). Was a filled card; now a hairline row shared by the six
// homepage-overview entries.
//
// RENAMED FROM ContentCard.tsx IN #199. #166 deferred the rename to "whichever later task
// opens this file", and no later task did — so the condition never fired and the filename
// stayed wrong for the whole arc. A deferral conditional on something that may never happen
// is a deferral with no owner; this one sat for nine PRs. The name now says what it is.
export default function OverviewRow({
  index,
  title,
  icon,
  status,
  meta,
  note,
  signals = [],
  href,
  ariaLabel,
}: Props) {
  const isCode = status === "code";

  const inner = (
    <>
      {/* THE ORDINAL TAKES THE LABEL SCALE. It was `font-display text-[17px] italic` — a Fraunces
          italic numeral competing with the row's own 20px display title two elements to its
          right, so the loudest thing in the row carried the least. The contract's own spec is
          12px/700 sans at .14em tracking, which is the studio's label scale exactly.
          ⚠ NOT the contract's ink-400 though: #228 swept 45 sites off ink-400 because it
          measured 3.02–3.49 on cream and failed AA. Adopting it back here would walk into the
          value that PR removed, so this takes the label scale's ink-600.

          ---- WRITTEN OUT RATHER THAN IMPORTED, AND THAT IS A BOUNDARY, NOT A COPY ----------
          This file is a SERVER component and `labelCls` lives in `blocks/fields.tsx`, which is
          `"use client"`. Importing the constant across that boundary does not fail to build — it
          silently yields a THROWING PROXY, which a template literal stringifies, so the rendered
          class was literally `w-6 shrink-0 tabular-nums function() { throw new Error("Attempted
          to call labelCls() from the server...`. **tsc passed, lint passed, ralph passed.** Only
          rendering it showed anything. Kept as literals here, with `studio-ink` asserting the two
          agree — the "assert the pair, because you cannot delete the pair" rule three-pane H
          already runs on the pane widths. */}
      <span
        className="w-6 shrink-0 text-[12px] font-bold uppercase tracking-eyebrow tabular-nums font-label text-studio-ink-600"
        aria-hidden
      >
        {index}
      </span>
      <span
        className={[
          "grid size-5 shrink-0 place-items-center [&>svg]:size-[19px]",
          isCode ? "text-studio-ink-400" : "text-studio-accent-500",
        ].join(" ")}
        aria-hidden
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block font-display text-[20px] leading-tight",
            isCode ? "text-studio-ink-600" : "text-studio-ink-950",
          ].join(" ")}
        >
          {title}
        </span>
        {meta && <span className="mt-1 block text-[14px] text-studio-ink-600">{meta}</span>}
        {note && <span className="mt-0.5 block text-[12px] text-studio-text-subtle">{note}</span>}
        {signals.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <span
                key={s.label}
                className={[
                  "inline-block rounded-full border px-2 py-0.5 text-[10px]",
                  s.tone === "muted"
                    ? "border-studio-ink-950/12 text-studio-text-subtle"
                    : "border-studio-accent-500/35 text-studio-accent-500",
                ].join(" ")}
              >
                {s.label}
              </span>
            ))}
          </span>
        )}
      </span>

      <StatusBadge status={status} />

      {href && (
        <span
          className="shrink-0 -translate-x-1 text-studio-ink-400 opacity-0 transition duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 [&>svg]:size-4"
          aria-hidden
        >
          <IconChevronRight />
        </span>
      )}
    </>
  );

  // Navigable rows: ONE block-level <a> (no nested interactive element), with the
  // hover lift + right-shift + chevron reveal.
  if (href) {
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className="group flex items-center gap-4 rounded-[var(--studio-radius-card,8px)] border-b border-studio-ink-950/12 py-4 pl-3.5 pr-3.5 transition-[background-color,padding-left] duration-200 ease-out hover:bg-studio-cream-100 hover:pl-6"
      >
        {inner}
      </a>
    );
  }

  // LOCKED row (Contact): a plain div — not a link/button, not focusable, no hover,
  // no shift, no chevron. A row that looks clickable and isn't is worse than one
  // that admits it.
  return (
    <div className="flex items-center gap-4 border-b border-studio-ink-950/12 py-4 pl-3.5 pr-3.5">
      {inner}
    </div>
  );
}
