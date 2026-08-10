"use client";

// P4 4(b)-ii — the field primitives the 14 block forms are built from, so each form
// is a declaration of its schema rather than fourteen copies of the same markup.
//
// Every control is CONTROLLED and preserves what it was given. None of them trim,
// coalesce, or drop an empty value — a field that reads "" writes "" back. That is
// the hard requirement at the form layer: Keystatic writes every key including the
// empty ones, so a form that tidies them up rewrites blocks the owner never
// touched, which is exactly what the surgical bar fails on.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { PreviewUpload } from "@/lib/studio/preview-map";
import { useItemList } from "../useItemList";
import CollapsibleGroup from "./CollapsibleGroup";
import { IconChevronUp, IconChevronDown, IconX, IconPlus } from "../icons";
import ImageThumb from "../ImageThumb";

// CS-3 — the Content | Style split. A section's fields are grouped into two tabs;
// this context carries which tab is active, and TabGroup wraps a run of fields so
// they show only under their tab. Presentational only — the wrapper is a hidden
// toggle, so both tabs' fields stay MOUNTED (no lost input, no field renames, no
// change to what any field posts).
export type FieldTab = "content" | "style";
const FieldTabContext = createContext<FieldTab>("content");

export function FieldTabProvider({ tab, children }: { tab: FieldTab; children: ReactNode }) {
  return <FieldTabContext.Provider value={tab}>{children}</FieldTabContext.Provider>;
}

/** Show `children` only when the active field-tab matches `group`. Hidden (not
 *  unmounted) otherwise, so a field keeps its value and caret across a tab switch. */
export function TabGroup({
  group,
  className = "flex flex-col gap-2",
  children,
}: {
  group: FieldTab;
  className?: string;
  children: ReactNode;
}) {
  const tab = useContext(FieldTabContext);
  return (
    <div hidden={tab !== group} className={className}>
      {children}
    </div>
  );
}

// CS-3 progressive disclosure — empty OPTIONAL inputs collapse behind a per-group
// reveal so a section is not a wall of blank boxes. This HIDES the input only: the
// value stays in form state and is still posted (the 4b-ii empties-preserved rule
// and the sanitizer, which requires every key, are untouched → save shape stays
// byte-identical). Required or already-filled fields always render.
//
// "blank" reuses the studio's trim-based non-blank notion (LinksEditPanel.nonBlank).
// "optional" is declared per field by the form, from the renderer's opt()/num()
// types — a required field never passes `optional`, so it never collapses.
const isBlankText = (v: string) => v.trim() === "";

type DisclosureCtx = {
  revealed: boolean;
  reveal: () => void;
  report: (id: string, collapsed: boolean) => void;
};
const DisclosureContext = createContext<DisclosureCtx | null>(null);

/**
 * Wraps a run of fields: required/filled ones render inline; when any OPTIONAL field
 * in it is blank (and it is not yet revealed), a reveal control shows the rest. The
 * reveal is STICKY for the session — once shown, a field never disappears mid-edit.
 *
 * NOT `CollapsibleGroup`, AND THE TWO ARE NOT VARIANTS OF EACH OTHER. This is a one-way,
 * sticky reveal over a run of FIELDS; that is a two-way fold over a TITLED REGION. The
 * stickiness here is the property this component exists for — a field must not vanish
 * mid-edit — and making it two-way would destroy it, so "add a collapse option" is not
 * available. See CollapsibleGroup's header for the full split.
 */
export function DisclosureGroup({
  revealLabel = "More options",
  className = "flex flex-col gap-2",
  children,
}: {
  revealLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const report = useCallback((id: string, isCollapsed: boolean) => {
    setCollapsed((prev) => {
      if (isCollapsed === prev.has(id)) return prev;
      const next = new Set(prev);
      if (isCollapsed) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const ctx = useMemo<DisclosureCtx>(
    () => ({ revealed, reveal: () => setRevealed(true), report }),
    [revealed, report]
  );
  return (
    <DisclosureContext.Provider value={ctx}>
      <div className={className}>
        {children}
        {!revealed && collapsed.size > 0 && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-studio-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-studio-ink-600 transition-colors hover:border-studio-accent-500/40 hover:text-studio-accent-600 [&>svg]:size-3.5"
          >
            <IconPlus /> {revealLabel}
          </button>
        )}
      </div>
    </DisclosureContext.Provider>
  );
}

/**
 * For an OPTIONAL field: whether it should render. It collapses when it is optional,
 * blank, its group is not revealed, AND it has not been shown yet this session (the
 * shownRef latch is the "never re-collapse once it had a value" rule). It reports its
 * collapsed state up to the nearest DisclosureGroup so the reveal control appears.
 * Outside a DisclosureGroup, or when not optional, it always renders.
 */
function useFieldVisible(optional: boolean | undefined, blank: boolean): boolean {
  const ctx = useContext(DisclosureContext);
  const id = useId();
  const shownRef = useRef(false);
  const visible = !optional || !ctx ? true : ctx.revealed || !blank || shownRef.current;
  if (visible) shownRef.current = true;
  const collapsed = Boolean(optional) && ctx !== null && !visible;
  useEffect(() => {
    if (!ctx) return;
    ctx.report(id, collapsed);
    return () => ctx.report(id, false);
  }, [ctx, id, collapsed]);
  return visible;
}

// Exported so a bespoke field (VE-3's video URL input, which owns an inline error the
// shared TextField has no slot for) can match every other input to the pixel instead of
// re-deriving the class string and drifting.
// THE WELL — cream-50, the bottom step of the STUDIO GROUND LADDER (globals.css).
//
// THE RULE IS RELATIONAL AND IT HAS NOW BEEN READ AS AN ABSOLUTE TWICE. An input reads as a
// well because it is one step LIGHTER than the surface holding it, never because it is a
// particular colour. #205 measured the lightest cream on a panel of the same cream, correctly saw that
// the input and its ground were identical, and fixed it by darkening THE INPUT to cream-100 —
// which inverted the relation and reproduced the identical collision on the cream-100
// inspector. The fidelity pass then proposed "inputs to cream-50", another absolute, which
// would have collided on the six cream-50 entry panels instead.
//
// The ladder fixes it as an ORDER rather than a value: cream-200 chrome, cream-100 field
// surface, cream-50 well. This string is the bottom step, and the panel that holds it is the
// middle one. Change either and you must check the other.
//
// HEIGHT IS 44px VIA `min-h-11`, NOT VIA PADDING. Measured, the box was 39px (21px line-height
// + 8/8 padding + 2 border), not the 36 the direction assumed. Deriving 44 from padding would
// mean two different padding values for the 13px and 14px variants, which would make them
// differ by more than the font size and break `studio-nav-active` G6 — the gate that keeps
// #199's dedupe honest. A min-height lands both on exactly 44 and leaves the ONE token of
// difference intact.
/**
 * THE FIELD MEASURE — a cap on how wide a SINGLE-LINE field may run.
 *
 * A form is content, and content has a measure. Unbounded, a text input grows with the window:
 * measured on the entry panels, **1939px on a 2560 display** and 915px on the 1536 laptop. At
 * 1939 the eye cannot track from a label on the far left to a value ending nearly two thousand
 * pixels away, and a 44px well stretched that far stops reading as a control at all. This is the
 * argument the blog canvas already makes at 68ch, applied to a form.
 *
 * THE PANEL KEEPS ITS FULL WIDTH. Only the field is capped — the panel is the surface, the
 * fields are the content on it, and those are different things.
 *
 * TEXTAREAS ARE DELIBERATELY EXCLUDED. "What you did", the hero's tab lines and the about copy
 * hold paragraphs and genuinely use the room, so they keep it. That exclusion is what rules out
 * every seam that looked shared:
 *
 *   ListDetailLayout's detail pane   caps the PANEL — its cream-200 header bar and its footer
 *                                    save bar would contract with it
 *   the panels' body wrapper         byte-identical across five panels, and still wrong: it
 *                                    holds the textareas that need the width
 *   `inputCls` itself                textareas use it too, and it reaches the case-study
 *                                    inspector, which is 304px wide and has no such problem
 *
 * Three plausible seams, three different failures. So this is ONE DEFINITION, N APPLICATIONS —
 * the same shape as the well constants below it — and ralph asserts the application rather than
 * trusting it: every single-line input element in the derived entry-panel set carries it, and no
 * textarea element does. Applied ALONGSIDE whichever well family a field uses; a width cap is
 * orthogonal to the border and focus styling the three families differ on.
 *
 * (Those two element names are written WITHOUT their angle brackets on purpose. `studio-ink`'s
 * E2 detector attributes an inline-geometry match to the last JSX-looking tag before it, over RAW
 * source — so an angle-bracketed mention here re-attributed the three well constants below and
 * failed a gate about something else entirely. Same class of trap as the class name a comment
 * emits, which LinksEditPanel's header records.)
 */
export const FIELD_MEASURE = "max-w-[760px]";

export const inputCls =
  "w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-50 px-3 py-2 text-[14px] text-studio-ink-950 outline-none transition-colors focus:border-studio-accent-500 focus:ring-1 focus:ring-studio-accent-500/30";

/**
 * The same box at 14px, for the ENTRY PANELS rather than the block forms.
 *
 * THE 13px/14px SPLIT IS DELIBERATE AND UNRESOLVED — DO NOT MERGE THESE TWO. They were seven
 * hand-copied strings across seven files until #199 collapsed them, and the copies had
 * DRIFTED: four panels carried 14px, the block forms and the case-study index carried 13px.
 * The two differ by exactly ONE token, `text-[14px]` against `text-[14px]`, and nothing else.
 *
 * Unifying them CHANGES RENDERED FONT SIZE on real surfaces — four of them one way, two the
 * other — so it is a design decision and the owner's call, not a cleanup. #199 deduped only
 * what was byte-identical and deliberately left this split standing rather than silently
 * picking a winner. Read as an accident and merged, it would move type on screen.
 *
 * NAMED FOR WHAT DIFFERS, not for a surface, because it spans four unrelated panels.
 */
export const inputClsMd =
  "w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-50 px-3 py-2 text-[14px] text-studio-ink-950 outline-none transition-colors focus:border-studio-accent-500 focus:ring-1 focus:ring-studio-accent-500/30";

/** The same box, in the rejection state — a danger border and ring.
 *
 *  IT CARRIES THE GEOMETRY INDEPENDENTLY, which is why it moves with the other two by hand.
 *  It is not derived from `inputCls`, so it is the copy that silently keeps the OLD shape when
 *  the well changes — and its only visible moment is a rejected value, so nobody would notice
 *  for a long time. There are FIVE strings with this geometry; see the ralph suite, which
 *  enumerates them so a sixth is loud. */
export const inputErrorCls =
  "w-full min-h-11 rounded-[var(--studio-radius-control,4px)] border border-studio-danger-600 bg-studio-cream-50 px-3 py-2 text-[14px] text-studio-ink-950 outline-none ring-1 ring-studio-danger-600/20 transition-colors";

/* ⚠ THIS COMPONENT SITS BELOW THE THREE WELL CONSTANTS ON PURPOSE, AND THE FILE'S OWN HEADER
   SAYS WHY. studio-ink's E2 attributes an inline-geometry match to the last JSX-looking tag
   before it, over RAW source — so a component with a tag in it, placed above those constants,
   re-attributes all three to itself and fails a gate about something else entirely. The header
   records that trap for an angle-bracketed mention in a COMMENT; a real tag does it too. Caught
   by the gate on the first run, exactly as designed. */
/**
 * A one-line VALUE in a box that WRAPS. Renders a textarea and behaves like an input.
 *
 * ⚠ IT EXISTS BECAUSE AN `input` PHYSICALLY CANNOT WRAP, and two blog fields were clipped by it.
 * Measured in the 320px inspector: the post title needs 299px in a 289px box and the dek needs
 * 305 — so an author could not read either without scrolling inside the field, and they are the
 * two written first.
 * RAISING THE PANE'S DEFAULT WAS THE OTHER OPTION AND IT IS WRONG. Blog's canvas has a hard 794px
 * floor (the 68ch measure), so at a 1585 page a 340px inspector leaves it 738 — the article would
 * narrow, which is the one property the blog layout exists to protect. The pane cannot widen there
 * and the field has to stop clipping instead.
 *
 * ⚠ THE VALUE STAYS ONE LINE. These round-trip to YAML as single-line scalars, so Enter is
 * suppressed and pasted newlines collapse to spaces — the box wraps, the STRING does not gain
 * breaks. Enter blurs instead, which is what it already did in an input.
 *
 * The geometry is `inputCls` unchanged, so it reads as the same well as every field beside it;
 * only `resize-none` and the driven height are added.
 */
export function WrappingField({
  value,
  onChange,
  onBlur,
  placeholder,
  className = inputCls,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Driven from the content on every change AND on mount, because the pane can be resized under
  // it and the first paint has to be right rather than corrected.
  const grow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";        // release the old height or scrollHeight only ever grows
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useEffect(() => {
    grow();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(grow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [grow, value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/[\r\n]+/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
      }}
      onBlur={onBlur}
      // `block` is not cosmetic: a textarea is inline-block, so the row sits ~1px taller on the
      // descender line than the inputs beside it. Measured in the block form before it was added.
      className={`${className} block resize-none overflow-hidden`}
    />
  );
}

/**
 * THE STUDIO LABEL SCALE — TWO STEPS, NAMED BY ROLE.
 *
 *   labelCls       a FIELD label            12px / 700 / 0.14em / ink-600
 *   groupLabelCls  a nested-card GROUP head 10px / 400 / 0.14em / ink-600
 *
 * NAMED BY ROLE, NOT BY SIZE, so the name says WHEN to reach for it — the same discipline as
 * the radius scale's panel/card/control and the ground ladder's chrome/field/well. `labelSm`
 * would have said nothing about when it applies.
 *
 * WHY TWO AND NOT ONE, which #199 already settled for `inputCls`/`inputClsMd`: the 10px is a
 * HIERARCHY SOMEBODY BUILT, not drift. Six sites carry it and all six sit inside the identical
 * container — `rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-100
 * p-3`, a nested card — so the smaller step marks "this heading groups the fields below it,
 * one level in". Flattening the two would have destroyed that. The `labelCls` step is the field
 * label proper, and the two outliers that looked like the same case (HeroEditPanel's tab
 * labels) turned out to be field labels in a plain tabpanel with no card at all, so they moved
 * UP to 12px. That they separated cleanly is the evidence the second step is real.
 *
 * BOTH ARE ink-600 BECAUSE ink-400 FAILED AA, and that is this scale's real reason for
 * existing. Measured: ink-400 reads 3.49 / 3.33 / 3.02 on cream-50 / cream-100 / cream-200,
 * and 12px is not WCAG large text (that is 24px, or 18.66px bold), so the 4.5 floor applies and
 * every ad-hoc label in the studio was below it. ink-600 reads 7.42 / 7.06 / 6.42. The GROUP
 * step keeps its 10px and its 400 weight — only the colour moved — so fixing the contrast did
 * not flatten the hierarchy the two steps exist to hold.
 *
 * ---- THE FACE, AND `--font-label`'s FIRST CONSUMER ----------------------------------------
 *
 * Both steps now carry `font-label`, which is Space Grotesk. Uppercase tracked chrome is a
 * different job from reading, and a flat-terminal grotesk holds at 10px where a humanist sans
 * softens. The studio is mostly labels, so this is the face it wears most.
 *
 * ⚠ THIS TOKEN HAD ZERO CONSUMERS FROM THE PR THAT DECLARED IT UNTIL THIS ONE, which is the
 * `FIT_THRESHOLD_PX` shape — a constant that reads as authoritative while nothing reads it. #260
 * caught `--studio-t0` sitting in exactly that state for two PRs while a gate written to prevent
 * it passed, because that gate counted over the SET rather than per token. The additive-first
 * sequence was still right — it is what made the swap provable — but the gap is stated rather
 * than left to be noticed, and `typography.mjs` now asserts consumption PER TOKEN.
 *
 * ⚠ AND THE CONTRACT'S UNIFORM 600 IS NOT APPLIED, WHICH IS A CORRECTION RATHER THAN AN
 * OVERSIGHT. It gives both steps weight 600. These are 700 and 400, and the difference is
 * load-bearing: the two steps are told apart by WEIGHT as well as size, which is what lets a
 * 10px group head read as one level in rather than as a smaller field label. Flattening both to
 * 600 would erase the hierarchy the scale exists to hold — the thing the note above says the
 * contrast fix was careful not to do. The face moves; the hierarchy stays.
 *
 * MEASURED BEFORE IT SHIPPED. Space Grotesk is NARROWER than Work Sans at every real label
 * string in the studio — deltas of −2.6 to −17.9px, the widest field label going 252.7px to
 * 234.8px. A label can only get shorter, so nothing can wrap inside the 320px inspector or the
 * 264px rail that did not wrap before.
 *
 * THE EYEBROW TEXT TOKEN IS DELIBERATELY NOT EDITED AND THE SIZE IS A LOCAL LITERAL INSTEAD. That
 * token is read by SIXTEEN non-studio files — components/case-study canvas code, components/ui
 * SectionLabel, app/not-found and app/(portfolio)/error — so sizing the studio label through it
 * would move the canvas and two public pages, the one thing this arc must not do.
 * THE TWO VALUES COINCIDE TODAY AND THAT IS NOT A REASON TO MERGE THEM: that token is
 * 0.75rem, which at the 16px root is exactly the 12px this literal states, so `text-eyebrow`
 * and `text-[12px]` render identically. They are kept INDEPENDENT so the token can move for the
 * canvas without dragging the studio with it — the same coincide-but-decouple relationship
 * `--studio-radius-control` (4px) has with the site's small radius token (4px).
 * (The previous comment here read "11px". It was true when written and #218's site-wide font
 * bump moved it to 12px without updating the prose. `studio-ink` E4 pins the real value.)
 * `tracking-eyebrow` STAYS because 0.14em is already the value both steps want.
 */
export const labelCls =
  "font-label text-[12px] font-bold uppercase tracking-eyebrow text-studio-ink-600";

/** A group heading inside a NESTED CARD — see the scale note above. Size and weight are the
 *  ones that shipped; the colour moved to clear AA, and the FACE moved with the label role. */
export const groupLabelCls =
  "font-label text-[10px] uppercase tracking-eyebrow text-studio-ink-600";

/* ---- THE KEY ROW (R2) — AND IT IS NOT `labelCls` WITH A RADIUS ---------------------------
 *
 * A PILL MEANS YOU TYPED THIS KEY. It marks a key the AUTHOR wrote, beside the value it names —
 * "My role" naming "Senior Product Designer". The owner's report was two identical boxes with no
 * way to tell which was which, and that only happens when BOTH are inputs.
 *
 * IT IS DELIBERATELY NOT APPLIED TO SCHEMA LABELS, and the contract's own item A is why: an
 * author-editable key is a pill INPUT, a fixed key is "the same shape without the ground, because
 * a box you cannot type in should not look like one." The contract then DREW the fixed key as a
 * pill-shaped span carrying the pill's 26px height plus an 8px connector — which measured +190px
 * per inspector section, taking the worst from 2.72 to 3.51 screens and undoing #234's measured
 * win (3.07 -> 1.72). The prose was right and the drawing was wrong. **Correction 28.** A fixed
 * key kept `labelCls`, tight above its field. **THAT CORRECTION WAS REVERSED IN #254** — see
 * FIXED_KEY_CLS below for why: zero pills rendered on the surface the contract was drawn for.
 *
 * THE TEST FOR A NEW SITE, so the next person has a rule rather than a list: does this field's
 * value NAME the value in the field beside it, on the same object? `metaFacts.label` names
 * `metaFacts.value` — pill. `DeviceFields.label` sits beside `dotColor` but does not name it —
 * two adjacent fields, not a key and its content — so it keeps the caption.
 *
 * THIS IS A DECLARED DEPARTURE FROM THE RADIUS SCALE. The scale halved every studio corner to
 * 12/8/4 and full pills survive only where the shape carries meaning — the status dots, the
 * PublishBar, the sidebar nav items. This is the fourth, and it is recorded in `radius-scale`
 * as a declared exception rather than left as an undeclared step.
 *
 * PLACEHOLDER IS `text-subtle`, NOT THE CONTRACT'S `ink-400`. Not a judgement — `studio-ink-
 * contrast` H4 already asserts ink-400 fails the text floor on EVERY cream step, and this pill
 * sits on cream-200 where it measures 3.02. `text-subtle` is 4.78 there. The project already
 * held the rule; the contract had not caught up. */
export const KEY_PILL_CLS =
  "h-[26px] min-w-[70px] w-fit rounded-full border border-transparent bg-studio-cream-200 px-2.5 " +
  "text-[10.5px] font-bold uppercase tracking-[0.13em] text-studio-ink-600 outline-none " +
  "transition-colors hover:bg-studio-cream-300 hover:text-studio-ink-950 " +
  "placeholder:text-studio-text-subtle placeholder:tracking-[0.09em] " +
  "focus-visible:bg-studio-cream-50 focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-1 focus-visible:outline-studio-accent-500";

/* ---- THE FIXED KEY (#254) — THE SAME SHAPE WITHOUT THE GROUND -----------------------------
 *
 * #253 CORRECTED THE CONTRACT HERE AND THE CORRECTION WAS WRONG. It kept fixed labels on the
 * 12px caption because drawing them as pill spans cost ~190px per inspector section, and that
 * cost was real — but the audit that followed measured the thing #253 never asked:
 * **ZERO pills render on the surface the contract was drawn for.** As loaded, the inspector shows
 * 121 captions and 0 pills across all 14 sections; fully expanded it is 9 pills to 216 captions,
 * 4%, in 2 sections. The eight pill sites are `metaFacts` and `glanceGrid`, both inside
 * `ItemRows` rows that #234 folds by default.
 *
 * **A CORRECT MEASUREMENT OF THE WRONG QUANTITY.** The height was priced accurately and the
 * question of whether the thing being bought would be VISIBLE was never asked. Recorded as its
 * own failure shape, because it is not the same as measuring badly.
 *
 * So a fixed key is now the contract's `.s-key`: the pill's height, padding, type and connector,
 * with `background: transparent` and no border — "a box you cannot type in should not look like
 * one" is satisfied by removing the GROUND, which is what item A said all along.
 *
 * NOT APPLIED TO `CheckField`: its label sits INLINE beside a checkbox, naming the control rather
 * than a value beneath it. A key row needs a value under the key. */
export const FIXED_KEY_CLS =
  "flex h-[26px] w-fit items-center px-2.5 text-[10.5px] font-bold uppercase " +
  "tracking-[0.13em] text-studio-ink-600";

/** A fixed key and its connector — the static half of the key row. */
export function FieldKey({ children }: { children: ReactNode }) {
  return (
    <>
      <span className={FIXED_KEY_CLS}>{children}</span>
      <KeyConnector />
    </>
  );
}

/** The connector: 1x8px of rule-edge, indented 20px. It groups the key with its value without a
 *  border or a card, which is the whole reason the pair needs no box at this nesting depth —
 *  measured, the innermost field is already 226px inside four bordered ancestors. */
export function KeyConnector() {
  return <span aria-hidden className="ml-5 block h-2 w-px bg-studio-ink-950/22" />;
}

/**
 * A key the author typed, above the value it names.
 *
 * `label` is the ACCESSIBLE name of the key input (never rendered visually — the pill's own text
 * IS the value being edited), and `children` is the value field beneath the connector.
 */
export function KeyRow({
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  placeholder = "Label",
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  inputRef?: (el: HTMLElement | null) => void;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        aria-label={label}
        value={value}
        ref={inputRef}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={KEY_PILL_CLS}
      />
      <KeyConnector />
      {children}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  optional,
  fieldId,
  blocker,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  inputRef?: (el: HTMLElement | null) => void;
  /** Optional field — collapses behind its DisclosureGroup's reveal while blank. */
  optional?: boolean;
  /** T3'S ADDRESS, AND IT IS OPTIONAL ON PURPOSE. When set it lands as `data-studio-field` on
   *  the wrapper, which is what the selection echo looks up. Absent by default, so every one of
   *  this component's ~40 call sites is byte-identical unless it opts in — the shared-seam rule.
   *  A field with no id simply never echoes, which is a missing mark rather than a wrong one. */
  fieldId?: string;
  /** ⚠ ADVISORY, NEVER BLOCKING. The sentence comes from `publishBlockers` in
   *  validate-blog-post.ts — the rule that will actually refuse the publish — so there is no
   *  second spelling to drift. It marks a field that WOULD block publishing; it does not stop the
   *  save, because an imageBlock is born `alt: ""` and refusing it at save makes the kind
   *  unaddable. THE MARK MOVES THE DISCOVERY TO AUTHORING TIME; the wall stays at publish. */
  blocker?: string | null;
}) {
  const visible = useFieldVisible(optional, isBlankText(value));
  return (
    <label className="flex flex-col gap-1" hidden={!visible} data-studio-field={fieldId}>
      <FieldKey>{label}</FieldKey>
      <input
        type="text"
        value={value}
        ref={inputRef}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={inputCls}
        aria-describedby={blocker ? `${fieldId ?? label}-blocker` : undefined}
      />
      {blocker ? (
        /* ⚠ DELIBERATELY NOT AN ASSERTIVE LIVE REGION. The field is not in an error state, it is
           in a state that will not PUBLISH, and an author mid-draft must not be interrupted by an
           announcement. It is DESCRIBED by the input instead, so a screen reader reads it on focus.

           ⚠ AND THE ROLE NAME IS DESCRIBED RATHER THAN SPELLED, because the suite asserts this
           block does not contain it — a comment naming the thing it forbids fails the check it
           exists to explain. Same discipline as never transcribing a comment delimiter, arriving
           on an ARIA role. */
        <span
          id={`${fieldId ?? label}-blocker`}
          className="text-[0.72rem] leading-snug text-studio-ink-950/55"
        >
          {blocker}
        </span>
      ) : null}
    </label>
  );
}

/** Multiline. Also the "Rich" editor: `**bold**` is plain text in the raw file —
 *  the adapter parses it into Rich runs at render, so there is nothing richer to
 *  build here, and building one would produce markup the schema cannot hold. */
export function TextArea({
  label,
  value,
  onChange,
  onBlur,
  rows = 3,
  inputRef,
  optional,
  fieldId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  rows?: number;
  inputRef?: (el: HTMLElement | null) => void;
  /** Optional field — collapses behind its DisclosureGroup's reveal while blank. */
  optional?: boolean;
  /** T3's address — see `TextField`'s note. Optional, so unset call sites are unchanged. */
  fieldId?: string;
}) {
  const visible = useFieldVisible(optional, isBlankText(value));
  return (
    <label className="flex flex-col gap-1" hidden={!visible} data-studio-field={fieldId}>
      <FieldKey>{label}</FieldKey>
      {/* ---- R3 · A MULTILINE VALUE LOOKS MULTILINE, AND THE GRIP IS THE POINT --------------
          96px minimum, text top-aligned, and a VISIBLE resize grip. The grip is the only mark
          that says the box is meant to grow — the affordance the browser already gives a
          textarea and this studio hid, because `inputCls` carries `min-h-11` and every textarea
          took it. That is the FIRST of the four recorded shared-seam failures, fixed here rather
          than by touching `inputCls`: `min-h-24` is appended AFTER it so the 44px floor is
          overridden for textareas ONLY, and every `<input>` consumer is untouched by
          construction. Ground and border do not change — the ladder already spent its steps on
          chrome, field and well.
          ⚠ THE WRAPPER'S `relative` OUTLIVED ITS REASON AND IS KEPT DELIBERATELY. It existed to
          give the drag grip a positioned ancestor; the grip went with the resize utility. It stays
          because `inputRef` consumers and the selection echo address this span, and removing a
          positioning context is a layout change rather than a cleanup — a separate decision with
          its own before-and-after. Named here so it is not read as debt. */}
      <span className="relative block">
        <textarea
          rows={rows}
          value={value}
          ref={inputRef}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          /* `block` is not cosmetic: a textarea is inline-block by default, so the wrapper
             sits ~1px taller on the descender line and the absolutely-placed grip lands
             1px BELOW the box it belongs to. Measured before it was added. */
          className={`${inputCls} block min-h-24 field-sizing-content resize-none max-h-[500px] overflow-y-auto py-3 pb-[18px] leading-[1.55]`}
        />
        {/* ⚠ THE GRIP IS GONE WITH THE VERTICAL-RESIZE UTILITY, AND THAT PAIRING IS THE POINT. It drew the native
            drag corner so the affordance was discoverable; under `field-sizing: content` the box
            sizes itself and dragging does nothing, so leaving the mark would advertise an action
            that no longer exists — worse than no mark, and the same class of defect as a class that
            looks right and generates nothing. */}
      </span>
    </label>
  );
}

/**
 * A `number | null` field — the tier-3 null hazard.
 *
 * NULL AND ZERO ARE DIFFERENT VALUES and the file distinguishes them: the same
 * device carries `rotate: -6` while its sibling carries `rotate: null`, and there
 * are 106 nulls across the three case studies. A form that renders null as "" and
 * saves "" — or renders 0 as blank via `||` and saves null — has changed content
 * the owner never touched. So:
 *   - `value ?? ""` (never `||`): a real 0 shows "0", only null shows blank.
 *   - blank -> null, never "" and never 0.
 *   - unparseable -> no write at all, so the previous value stands.
 *
 * It keeps the raw text locally rather than deriving it from `value`, because a
 * controlled numeric input cannot hold the intermediate states of typing a real
 * value here: "-" parses to NaN, so a purely controlled field would reject the
 * keystroke and wipe the minus sign — and `rotate: -6` means negatives must be
 * typable. The parent still only ever sees `number | null`.
 */
export function NumberField({
  label,
  value,
  onChange,
  onBlur,
  optional,
  unit,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  onBlur?: () => void;
  /** Optional field — collapses behind its DisclosureGroup's reveal while blank
   *  (null). A real 0 is NOT blank, matching the null-vs-zero discipline below. */
  optional?: boolean;
  /** A UNIT OF MEASURE — `px`, `deg`. Rendered muted inside the well, right-aligned, so the
   *  LABEL says what the field IS and the field says what it HOLDS (contract 5b).
   *
   *  A UNIT, NOT A FORMAT, AND NOT AN EXAMPLE. `hex` is a format — a colour field holding a
   *  muted "hex" reads as a value rather than an affordance — and "e.g. 03" is an example. The
   *  contract's own 5b lists "px, deg and the stacking index", so excluding hex FOLLOWS it
   *  rather than departing from it. Stacking takes none either: see its call site. */
  unit?: string;
}) {
  const visible = useFieldVisible(optional, value === null);
  const toText = (v: number | null) => (v === null ? "" : String(v));
  const [text, setText] = useState(() => toText(value));
  const seen = useRef(value);

  // Adopt the parent's value when IT changed (Cancel, a reload) — but not while
  // the user is mid-edit, or typing "1." would be rewritten to "1". Comparing
  // against `seen` distinguishes "the parent moved" from "we moved it".
  if (seen.current !== value) {
    seen.current = value;
    const parsed = text.trim() === "" ? null : Number(text);
    if (parsed !== value) setText(toText(value));
  }

  return (
    <label className="flex flex-col gap-1" hidden={!visible}>
      <FieldKey>{label}</FieldKey>
      {/* THE WRAPPER IS THE POSITIONING CONTEXT, AND IT HAS TO BE THE INPUT'S RATHER THAN THE
          LABEL'S. `top-1/2` against the <label> would centre the unit in the KEY ROW + field
          together — 42px of key row sits above the input — putting the suffix near the top edge
          or off the field entirely. Same wrapper TextArea uses for its grip, for the same
          reason. `block` because an input is inline-block and the wrapper would otherwise sit a
          descender taller, which is the 1px the grip landed off by in #253. */}
      <span className="relative block">
      <input
        type="text"
        inputMode="numeric"
        /* THE UNIT LEFT THE VISIBLE LABEL, SO IT HAS TO SURVIVE IN THE ACCESSIBLE NAME. The
           suffix span is `aria-hidden` (it is a visual affordance, and announcing "px" as a
           separate node mid-field is worse than not announcing it), so without this a screen
           reader would hear "Width" where it used to hear "Width, px" — the contract's own
           phrasing, lost. Measured as a regression before it shipped, not reasoned about. */
        aria-label={unit ? `${label}, ${unit}` : undefined}
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (next.trim() === "") {
            seen.current = null;
            onChange(null);
            return;
          }
          const n = Number(next);
          if (!Number.isFinite(n)) return; // "-", "1e", "abc" — hold, don't write
          seen.current = n;
          onChange(n);
        }}
        onBlur={onBlur}
        placeholder="auto"
        className={`${inputCls} ${unit ? "pr-[34px] tabular-nums" : ""}`}
      />
      {/* ---- THE UNIT SITS IN THE WELL (contract 5b) ------------------------------------------
          `pointer-events-none` IS LOAD-BEARING, not decoration: without it the span eats clicks
          at the right edge of the field and the input develops a dead zone, which reads as a
          broken input rather than a mislayered label. Driven in the gates, not reasoned about.
          The input reserves `pr-[34px]` so a long value cannot run under the suffix, and
          `tabular-nums` keeps digits from reflowing the gap as you type. */}
      {unit && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-studio-text-subtle"
        >
          {unit}
        </span>
      )}
      </span>
    </label>
  );
}

/**
 * A block image field — P4 4(b)-iv. The single choke point every one of the six
 * image field paths flows through, which is why wiring upload here lights up all
 * five image-bearing kinds at once.
 *
 * The client NEVER names the file. It posts the bytes; the server normalizes to
 * webp, hashes THOSE bytes, derives the path, and returns it. So the path depends on
 * the image and nothing else — not the array position (which is how Keystatic names
 * nested images, and why it is locked out of these files), not the session, not any
 * editable field.
 *
 * Clearing writes `null`, never "" — the PR-B null discipline. `src` is
 * `string | null`, null is how "no image" is spelled, and the sanitizer rejects "".
 *
 * `alt` is NOT here — it stays an editable TextField beside this. It is text, it is
 * real accessibility work, and it is independent of the binary.
 */
export function BlockImageField({
  label,
  src,
  slug,
  collection,
  aspect,
  onChange,
}: {
  label: string;
  src: string | null;
  slug: string;
  /** The plate's shape, width / height. LEFT UNSET BY BOTH REGISTRIES ON PURPOSE — the public
   *  renderer gives an `imageBlock` no ratio (a bare <img> inside `.blog-figure`), so the plate
   *  lets the image keep its own shape and never crops. The prop exists for a call site whose
   *  public counterpart DOES fix a ratio; `SettingsPhotoField` is the one that passes it. */
  aspect?: number;
  /** PR 3a — which collection's image tree the upload lands in ("projects" | "blog").
   *  Threaded parallel to `slug` and REQUIRED: the server maps it to a base and rejects
   *  an unknown one, so a caller that forgets it is a compile error here, not a silent
   *  mis-scope. */
  collection: string;
  /** Receives the server-derived path, or null on clear.
   *
   *  IT ALSO HANDS UP THE `File`, and that second argument is what lets a canvas draw the
   *  image before publish. The path 404s until then, and `draftImages` — the array the
   *  canvas rewriter consults — is a snapshot taken before this upload existed. Only the
   *  bytes the browser already holds can resolve it. See lib/studio/preview-map.ts.
   *
   *  THE `File`, NOT AN OBJECT URL, which is #190's finding restated. Handing up a url makes
   *  two components share one revocable resource that neither can safely free. Handing up the
   *  File lets each holder make its own from the same Blob and free exactly that.
   *
   *  ADDITIVE, AND THAT IS WHAT MADE IT SAFE TO DO HERE RATHER THAN FORK THE COMPONENT. Both
   *  call sites pass one-arity arrows, and TypeScript accepts a lower-arity function where a
   *  higher-arity one is expected. Adding a parameter changes nothing about the first one, so
   *  a caller that does not want the File simply does not name it. */
  onChange: (src: string | null, file?: File) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("collection", collection);
      body.append("slug", slug);
      body.append("file", file);
      const res = await fetch("/api/studio/upload-block-image", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok && json.mode === "fs") {
        setError("Image upload needs github mode (dev)");
        return;
      }
      if (res.ok && json.ok && typeof json.src === "string") {
        // The File goes up WITH the path. It has been in scope here since this component was
        // written and was thrown away, which is the whole of the bug: the path is not
        // fetchable until publish, and the bytes that are were sitting right here.
        onChange(json.src, file);
        return;
      }
      setError(
        {
          unsupported_type: "That file type is not supported. Use a PNG, JPEG or WebP.",
          file_too_large: "That image is too large. The limit is 12 MB.",
          image_processing_failed: "That image could not be processed.",
        }[json.error as string] ?? "Upload failed. Try again."
      );
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
      // Let the same file be chosen again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <FieldKey>{label}</FieldKey>
      {/* VERTICAL, AND THAT IS WHAT UNSQUEEZES THE PATH. #180 measured this readout
          compressing to 27.6px because it shared a horizontal row with a thumb and a button
          inside a 244px inspector. Stacked, the path gets the full content width to itself —
          the plate does not replace the readout, it stops the readout being squeezed.

          THE CONTAINER DECLARES NO GROUND AT ALL, AND THAT IS THE POINT.

          It was the cream-100 ground, which collided on the cream-100 blog inspector — the exact
          defect the ladder exists to prevent, and a site PR A's sweep genuinely did not reach.
          The obvious fix was the ladder's well step, cream-50. MEASURED, THAT COLLIDED TOO:
          on the case-study editor the videoEmbed "Poster still" field is nested inside a
          cream-50 CARD, so a cream-50 container is same-on-same there instead. One absolute
          traded for another — the fourth time in this arc.

          A COMPONENT THAT CAN BE MOUNTED ON SEVERAL GROUNDS MUST NOT ASSERT ONE. This row is
          used on the cream-100 inspector, on cream-50 entry panels and inside cream-50 cards,
          so no single value is right and there is no relational utility that says "one step
          lighter than my parent". Declaring nothing makes it correct on all three by
          construction: it inherits, the border delineates it, and the plate inside is
          cream-200 which reads against every cream step. */}
      <div className="flex flex-col gap-2 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-3 py-2.5">
        {/* NO ASPECT unless a caller supplies one. `BlogProse` renders an imageBlock as a bare
            <img> with no ratio, so the plate matches by letting the image be its own shape. */}
        <ImageThumb src={src} aspect={aspect} className="w-full" />
        <div className="flex items-center gap-2">
        {src ? (
          <code className="min-w-0 flex-1 truncate text-[12px] text-studio-ink-600">{src}</code>
        ) : (
          <span className="flex-1 text-[12px] text-studio-text-subtle">No image set</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          // No background: the container declares none either, so a fixed value here would be
          // the same absolute-on-an-unknown-ground mistake. The border already delineates the
          // control, which is how the Clear button beside it has always worked.
          className="shrink-0 rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 px-2.5 py-1 text-[12px] transition-colors hover:border-studio-accent-500/40 hover:text-studio-accent-600 disabled:opacity-40"
        >
          {busy ? "Uploading…" : src ? "Replace" : "Upload"}
        </button>
        {src && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(null)}
            aria-label={`Clear ${label}`}
            className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 text-studio-ink-400 transition-colors hover:border-studio-accent-500/40 hover:text-studio-accent-600 [&>svg]:size-3.5"
          >
            <IconX />
          </button>
        )}
        </div>
      </div>
      {/* Announced: an upload failure is the one thing here a screen-reader user
          cannot otherwise notice, since the visible change is a small line of text. */}
      {error && (
        <span role="alert" className="text-[10px] text-studio-accent-600">
          {error}
        </span>
      )}
    </div>
  );
}

export function CheckField({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="flex w-fit items-center gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        className="size-3.5 accent-accent-500"
      />
      <span className="text-[12px] text-studio-ink-600">{label}</span>
    </label>
  );
}

/**
 * A block's nested array (stats, cards, items, steps) — add / remove / reorder,
 * with each row a card of arbitrary fields.
 *
 * Rows key off the index, matching ChipListEditor. That is safe here and NOT a
 * violation of the SK-3b stable-id rule: that rule governs the ADDRESSING model
 * (which block an edit targets, which must survive a reorder), whereas these rows
 * hold no state of their own — every value is controlled by the panel's `sections`
 * — so an index key is a render detail, not an identity.
 */
export function ItemRows<T>({
  items,
  onChange,
  empty,
  addLabel,
  itemNoun,
  rowLabel,
  noAdd = false,
  noRemove = false,
  addNote,
  children,
}: {
  items: readonly T[];
  onChange: (next: T[], upload?: PreviewUpload) => void;
  /** MUST return every key the schema declares, including "" and false — a new row
   *  that omits one drops it from the file. The sanitizer rejects the save if so. */
  empty: () => T;
  addLabel: string;
  itemNoun: string;
  rowLabel?: (item: T, i: number) => string;
  /**
   * Hide "add". Two different reasons need it, and both end the same way — an
   * added row would produce content the FAIL-LOUD SSG adapter refuses, so the
   * owner could add it, preview it happily (preview mode substitutes a
   * placeholder), publish, and get a failed build. Worse, one such row blocks the
   * WHOLE publish, including unrelated edits, until it is found and removed.
   *   - heroCover.devices: the schema validates exactly two, and the adapter
   *     re-validates when narrowing to its tuple, so a third throws at SSG.
   *   - any array whose row REQUIRES an image (deviceShelf.devices,
   *     featureRows.features, beforeAfter.pairs): a new row's src is null, and
   *     nothing can set it until 4(b)-iv, so it can never be published.
   * `addNote` explains which, so the missing button is not a mystery.
   */
  noAdd?: boolean;
  /** Hide "remove". Only heroCover.devices needs this (exactly two). Removing is
   *  otherwise always safe, and is the escape hatch for a bad row. */
  noRemove?: boolean;
  /** Shown in place of the add button when noAdd. */
  addNote?: string;
  children: (args: {
    item: T;
    /** Second argument optional, so a row that holds no image passes a one-arity arrow and
     *  compiles unchanged. A row that DOES hold one must forward it — see preview-map.ts. */
    set: (next: T, upload?: PreviewUpload) => void;
    focusRef: (el: HTMLElement | null) => void;
  }) => ReactNode;
}) {
  const list = useItemList(items, onChange, empty);
  const iconBtn =
    "grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 text-studio-ink-400 transition-colors enabled:hover:bg-studio-cream-200 enabled:hover:text-studio-ink-950 disabled:opacity-30 [&>svg]:size-3.5";

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        // The ORDINAL identifies the row and the CONTENT summarises it — two jobs that were
        // sharing one slot. A group with nothing to summarise renders the name alone, which is
        // #234's Section-settings finding applied here rather than filled with a placeholder.
        const rowName = `${itemNoun} ${i + 1}`;
        const rowSummary = rowLabel?.(item, i) ?? "";
        return (
          <CollapsibleGroup
            key={i}
            className="rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 bg-studio-cream-100 p-3"
            // COLLAPSED BY DEFAULT, AND THIS IS THE WHOLE PR. Measured across the 14 sections of
            // elevate-one-view, these rows are where the inspector's height lives — not spread
            // across blocks, stacked inside one. Folding them takes the worst section from 3.07
            // screens to 1.72 and the mean from 1.97 to 1.05, and 8 of 14 sections come to fit
            // in a single screen where 2 did.
            //
            // EXCEPT A ROW THAT WAS JUST ADDED, AND THAT IS A SEQUENCING FIX RATHER THAN A
            // COURTESY. `useItemList.add` records the new index in `pendingFocus`, and
            // `focusRef` claims it by calling `el.focus()` when the row's first input mounts.
            // FOCUS ON A HIDDEN ELEMENT SILENTLY NO-OPS — so a new row rendered folded would
            // swallow the focus, Add would look broken, and nothing would fail. `defaultOpen`
            // is read once at mount and a new row mounts fresh, so reading `pendingFocus` here
            // opens exactly the row that is about to claim focus, in the render before the ref
            // fires. Driven in `mount-discipline`, not remembered.
            defaultOpen={list.pendingFocus.current === i}
            name={rowName}
            nameClassName={groupLabelCls}
            summary={rowSummary}
            controls={
              <div className="flex gap-1">
                {/* preventDefault on mousedown keeps focus off these controls so the
                    click cannot blur-save mid-op (the About-panel fix). */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => list.move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${name} up`}
                  className={iconBtn}
                >
                  <IconChevronUp />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => list.move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label={`Move ${name} down`}
                  className={iconBtn}
                >
                  <IconChevronDown />
                </button>
                {!noRemove && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => list.remove(i)}
                    aria-label={`Remove ${name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-[var(--studio-radius-control,4px)] border border-studio-ink-950/12 text-studio-ink-400 transition-colors hover:border-studio-accent-500/40 hover:text-studio-accent-600 [&>svg]:size-3.5"
                  >
                    <IconX />
                  </button>
                )}
              </div>
            }
          >
            {children({ item, set: (v, upload) => list.set(i, v, upload), focusRef: list.focusRef(i) })}
          </CollapsibleGroup>
        );
      })}
      {noAdd ? (
        addNote ? (
          <p className="text-[10px] text-studio-text-subtle">{addNote}</p>
        ) : null
      ) : (
        <button
          type="button"
          onClick={list.add}
          className="inline-flex w-fit items-center gap-1.5 rounded-[var(--studio-radius-control,4px)] border border-dashed border-studio-ink-950/15 px-3 py-1.5 text-[12px] font-semibold text-studio-ink-600 transition-colors hover:border-solid hover:border-studio-accent-500 hover:text-studio-accent-600 [&>svg]:size-3.5"
        >
          <IconPlus /> {addLabel}
        </button>
      )}
    </div>
  );
}
