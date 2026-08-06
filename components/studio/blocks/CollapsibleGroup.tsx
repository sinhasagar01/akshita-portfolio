"use client";

// A titled region that folds. The group-level counterpart to DisclosureGroup.
//
// ---- WHY THIS IS A SECOND COMPONENT AND NOT AN OPTION ON THE FIRST ---------------------
//
// `DisclosureGroup` (fields.tsx) looks close enough to reuse and is not, and the difference is
// role rather than degree — the same by-role split this project has landed on six times now
// (listbox vs select, three-pane vs list-detail, ink band vs cream bar, doc save bar vs panel
// footer, canvas-for-shape vs inspector-for-words, rail-reads vs board-writes):
//
//                    DisclosureGroup                  CollapsibleGroup
//   UNIT             a run of FIELDS                  a TITLED REGION
//   DIRECTION        one-way                          two-way
//   STICKINESS       latches via shownRef —           free; close what you just opened
//                    "never re-collapse once
//                     it had a value"
//   PURPOSE          reveal BLANK OPTIONAL fields     fold a region you are not editing
//   ARIA             none (it is a reveal, not        aria-expanded + aria-controls
//                    a disclosure)
//
// A one-way sticky reveal cannot express "fold this again", and making it two-way would break
// the property it exists for. Two components, each honest about its job.
//
// ---- WHY NOT NATIVE <details>/<summary>, WHICH WOULD BE FREE ---------------------------
//
// Ruled out by a STRUCTURAL constraint, not a preference. `ItemRows` — the surface that carries
// this PR's entire saving — already puts three buttons in its header (move up, move down,
// remove). Interactive controls inside `<summary>` are unreliable: the click toggles the
// disclosure instead of firing the control. The pattern has to work where the height is, so the
// platform option is unavailable there, and having one implementation matters more than having
// the free one in the two places it would have fitted.
//
// A real <button> gives back most of what <details> would have: Enter, Space, the focus ring,
// and a screen-reader name, all native.
//
// ---- WHAT IS DELIBERATELY DROPPED, NAMED HERE WHERE THE DECISION LIVES -----------------
//
// FIND-IN-PAGE WILL NOT OPEN A COLLAPSED GROUP. `<details>` participates in Ctrl-F through
// `hidden="until-found"`; a `hidden` div does not, so text inside a folded row is unfindable
// while it is folded. This is a real capability and it is dropped ON PURPOSE — dropping
// deliberately is fine and dropping silently is not.
// TRIGGER TO REVISIT: React gaining `hidden="until-found"` support, or an author reporting a
// search that should have found something.
import { useId, useState, type ReactNode } from "react";
import { IconChevronDown } from "../icons";

export default function CollapsibleGroup({
  summary,
  name,
  nameClassName = "",
  controls,
  blockAddress,
  defaultOpen = true,
  className = "",
  hidden,
  summaryClassName = "",
  bodyClassName = "flex flex-col gap-2",
  children,
}: {
  /** What a CLOSED group shows. Never a placeholder — see the call sites. */
  summary: ReactNode;
  /** A STATIC group name, rendered before the summary. When given, the summary becomes the
   *  contract's muted right-aligned `.sum`; when absent nothing changes for existing callers. */
  name?: ReactNode;
  nameClassName?: string;
  /** THE HEADER'S TYPE BELONGS TO THE CALL SITE, not to this component, and passing it rather
   *  than importing `groupLabelCls` is what keeps `fields.tsx -> CollapsibleGroup -> fields.tsx`
   *  from being a cycle. It is also the truer shape: the three groups this serves sit at three
   *  levels and read at three scales — an ItemRows row is a 10px eyebrow, a block card a 12px
   *  medium. A component that fixed one would be wrong for the others. */
  summaryClassName?: string;
  /** Reorder/remove and friends. Rendered BESIDE the toggle, never inside it. */
  controls?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  /** Hides the WHOLE group — a different axis from `open`, and it stacks with it. The block
   *  card uses it for the Content|Style split, which hides a copy-only card under Style. Both
   *  are `hidden` rather than unmounted, for the same reason. */
  hidden?: boolean;
  bodyClassName?: string;
  /** T0/T3's address for a BLOCK, rendered as `data-studio-block` on the card.
   *  DECLARED EXPLICITLY BECAUSE THIS COMPONENT SPREADS NOTHING — passing `data-studio-block`
   *  as a bare prop type-checks (React allows `data-*` on intrinsic elements) and then reaches
   *  no DOM node, which is the cast-that-compiles-and-does-nothing shape. Naming it here is
   *  what makes the attribute real. */
  blockAddress?: number;
  children: ReactNode;
}) {
  // LOCAL STATE, AND NO PERSISTENCE MACHINERY — which is not a shortcut. Mount discipline
  // already requires this group to stay MOUNTED when it folds (see below), so this state
  // survives every selection change for free. Surviving a reload would need storage; surviving
  // navigation falls out of a constraint enforced for another reason entirely, and a behaviour
  // you get free from an existing rule is worth having as such rather than rebuilding.
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <div hidden={hidden} className={className} data-studio-block={blockAddress}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          // preventDefault on mousedown keeps focus off the toggle so the click cannot
          // blur-save mid-op — the About-panel fix, same as the controls beside it.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="group/ct -my-0.5 -ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] px-1 py-0.5 text-left transition-colors hover:bg-studio-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent-500"
        >
          <span
            aria-hidden
            /* ---- THE CHEVRON IS UNCHANGED, AND THAT IS CORRECTION 30 -------------------
               The contract draws 13px ink-400 rotating 180deg when OPEN. Ours is 12px ink-600
               rotating -90deg when CLOSED, and it stays. The contract's mark is QUIETER because
               in that drawing it is not the primary affordance; under #234's fold, on a collapsed
               row, IT IS. A disclosure triangle pointing at the thing it will reveal is the more
               legible of the two, and the size and colour go with the orientation — they were
               drawn for a mark doing a different job. Only the HOVER is added. */
            className={`grid size-3 shrink-0 place-items-center text-studio-ink-600 transition-colors transition-transform group-hover/ct:text-studio-ink-950 ${
              open ? "" : "-rotate-90"
            } [&>svg]:size-3`}
          >
            <IconChevronDown />
          </span>
          {/* ---- THE CLOSED STATE HAS TO EARN ITS CLICK ------------------------------------
              A static NAME plus a live SUMMARY, which is the contract's `.ghead b` + `.ghead
              .sum`. The summary is not new work and was never thrown away — #234 already routes
              `rowLabel` here and its record says it "consumes it rather than inventing an API".
              What was wrong is the SHAPE: the summary occupied the name slot wearing the name's
              eyebrow, so a row said "Front door sensor" where it should say "DEVICE 2 · Front
              door sensor" with the content muted and right-aligned.
              `name` is optional, so every other consumer (the block cards, DisclosureGroup)
              renders exactly as before with the summary still filling the row. */}
          {name !== undefined && (
            <span className={`flex-none font-bold ${nameClassName} group-hover/ct:text-studio-ink-950`}>{name}</span>
          )}
          <span
            className={`min-w-0 flex-1 truncate ${
              name !== undefined
                ? // ink-400 HERE WAS A LIVE AA FAILURE, AND IT IS #253's, MINE. The summary is the row's
                  // live CONTENT — "10%", "My role" — which is what an author reads to identify a
                  // collapsed row, so it is text and takes the text floor. Measured: ink-400 is
                  // 3.49 on cream-50 and 3.33 on cream-100. `text-subtle` is 5.52 / 5.25.
                  // THIRD TIME the contract has specified ink-400 as text, after #253's placeholder
                  // and #255's unit suffix. Each time the project already held the rule.
                  "text-right text-[11px] font-normal normal-case tracking-normal text-studio-text-subtle group-hover/ct:text-studio-ink-800"
                : `${summaryClassName} group-hover/ct:text-studio-ink-950`
            }`}
          >
            {summary}
          </span>
        </button>
        {controls}
      </div>

      {/* HIDDEN, NEVER UNMOUNTED. A folded group holding a dirty edit must still be holding it
          when you unfold it — unmounting drops the value, the caret and, inside ItemRows, the
          pending-focus index, and NOTHING FAILS. It is the same defect `mount-discipline`
          gates for the shell, one level down, and it is driven there rather than assumed. */}
      <div id={bodyId} hidden={!open} className={bodyClassName}>
        {children}
      </div>
    </div>
  );
}
