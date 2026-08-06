"use client";

// P4 4(b)-iii — the section SHELL form (everything on a section except its blocks).
//
// WHY IT LANDS HERE. 4(b)-ii built forms for all fourteen BLOCK kinds and left the
// shell they sit in, so `title`, `lead`, `eyebrow`, `index` and `northStar` — real
// copy that renders on the live page through CaseSectionHeader — had never been
// editable. Section-add forces the issue: without this, a new section is a blank
// card the owner cannot name or configure.
//
// `id` IS A DOM ID, not a label — SectionRenderer emits `<div id={section.id}
// className="scroll-mt-20">`, so it is a scroll anchor and must be unique in the
// document. The field says so, and the panel mints a unique one on add.
//
// The selects read VARIANTS/LAYOUTS from the sanitizer's own exported consts, so
// the form cannot offer an option the sanitizer would reject.
import type { RawSection } from "@/lib/case-studies/sections-raw";
import { VARIANTS, LAYOUTS } from "@/lib/studio/sections-format";
import { ListboxField } from "../ListboxField";
import { TextField, TextArea, TabGroup, DisclosureGroup, groupLabelCls } from "./fields";
import CollapsibleGroup from "./CollapsibleGroup";

export function SectionShellForm({
  value,
  onChange,
  onBlur,
  duplicateId,
}: {
  value: RawSection;
  onChange: (next: RawSection) => void;
  onBlur?: () => void;
  /** True when another section already uses this id — two identical DOM ids break
   *  anchors, so it is surfaced rather than silently allowed. */
  duplicateId?: boolean;
}) {
  const set = <K extends keyof RawSection>(k: K, v: RawSection[K]) => onChange({ ...value, [k]: v });

  return (
    // OPEN BY DEFAULT, AND THE MEASUREMENT IS WHY IT GETS THE AFFORDANCE WITHOUT THE DEFAULT.
    // This group holds the section's COPY — eyebrow, title, lead, north star — which is what an
    // author opened the section to edit. Folding it by default would hide the thing you came
    // for to save ~250px, where folding the ItemRows rows below saves 342–1764px of material
    // you were not looking at.
    //
    // AND IT HAS NOTHING TO SUMMARISE, WHICH IS A FINDING RATHER THAN A GAP. Its content is the
    // eyebrow and the title, and the section header directly above it already renders exactly
    // those through `sectionLabel`. A "Section settings · <title>" summary would restate the
    // line above it, so it keeps its name and nothing else. The other two groups this pattern
    // serves both had a content-derived summary already; this one genuinely does not, and
    // inventing a placeholder to fill the slot would be the wrong kind of consistency.
    <CollapsibleGroup
      /* GROUND + 1 STEP, WHICH THIS CARD WAS NOT. Measured: it rendered cream-100 ON the
         inspector's cream-100 — a 1.00 ratio, the same well-equals-ground defect #227 fixed at
         six sites, surviving here on a CARD instead of a well. cream-50 gives it the one step
         the rule asks for, and radius-card matches the block cards beside it.
         THE ITEMROWS ROWS ARE DELIBERATELY NOT CHANGED WITH IT: they sit INSIDE a cream-50 block
         card, so they are already one step off their own parent. Moving them to cream-50 would
         recreate exactly the defect this line fixes, one level down. The contract's
         `.grp{background:cream-50}` is drawn for a group on cream-100; the rule is RELATIONAL. */
      className="rounded-[var(--studio-radius-card,8px)] border border-studio-ink-950/12 bg-studio-cream-50 p-3"
      summary="Section settings"
      summaryClassName={groupLabelCls}
    >
      {/* Content — the copy that renders in the section header, plus the anchor id
          and display index that identify it. */}
      {/* THE FOUR `fieldId`s BELOW ARE T3's ADDRESSES, and they are exactly the four section
          fields the CANVAS can select — `CaseSectionHeader` emits `data-edit` for eyebrow, title
          and lead, and `SectionRenderer` for northStar. Anchor id and Index carry none because
          nothing on the canvas maps to them, and giving them one would advertise an echo that
          could never fire. The set is the canvas's, not this form's. */}
      <TabGroup group="content">
        {/* Eyebrow + Title are the section's primary header, always shown. The rest
            of the shell copy is optional (adapter opt/richOpt) and collapses when
            blank so a fresh section isn't a wall of empty inputs. */}
        <TextField fieldId="eyebrow" label="Eyebrow" value={value.eyebrow} onChange={(v) => set("eyebrow", v)} onBlur={onBlur} />
        <TextField fieldId="title" label="Title" value={value.title} onChange={(v) => set("title", v)} onBlur={onBlur} />
        <DisclosureGroup revealLabel="More section fields">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <TextField
                label="Anchor id"
                value={value.id}
                onChange={(v) => set("id", v)}
                onBlur={onBlur}
                optional
              />
              {duplicateId && (
                <span className="text-[10px] text-studio-accent-600">
                  Another section already uses this id. Anchors need it to be unique.
                </span>
              )}
            </div>
            <TextField label="Index, e.g. 03" value={value.index} onChange={(v) => set("index", v)} onBlur={onBlur} optional />
          </div>
          <TextArea
            fieldId="lead"
            label="Lead — **bold** for emphasis"
            value={value.lead}
            onChange={(v) => set("lead", v)}
            onBlur={onBlur}
            rows={2}
            optional
          />
          <TextField fieldId="northStar" label="North star" value={value.northStar} onChange={(v) => set("northStar", v)} onBlur={onBlur} optional />
        </DisclosureGroup>
      </TabGroup>
      {/* Style — how the section presents: variant, layout, and the glow word. */}
      <TabGroup group="style">
        <div className="flex flex-col gap-2">
          <ListboxField
            label="Variant"
            value={value.variant}
            options={VARIANTS}
            onChange={(v) => set("variant", v)}
            onBlur={onBlur}
            hint="hero skips the standard header"
          />
          <ListboxField
            label="Layout"
            value={value.layout}
            options={LAYOUTS}
            onChange={(v) => set("layout", v)}
            onBlur={onBlur}
          />
        </div>
        {/* The glow word is optional appearance — collapse it behind one reveal. */}
        <DisclosureGroup revealLabel="Glow settings">
          <div className="flex flex-col gap-2">
            <TextField label="Glow text" value={value.glow.text} onChange={(v) => onChange({ ...value, glow: { ...value.glow, text: v } })} onBlur={onBlur} optional />
            <TextField label="Glow size (CSS)" value={value.glow.size} onChange={(v) => onChange({ ...value, glow: { ...value.glow, size: v } })} onBlur={onBlur} optional />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["top", "right", "bottom", "left"] as const).map((k) => (
              <TextField
                key={k}
                label={`Glow ${k}`}
                value={value.glow[k]}
                onChange={(v) => onChange({ ...value, glow: { ...value.glow, [k]: v } })}
                onBlur={onBlur}
                optional
              />
            ))}
          </div>
        </DisclosureGroup>
      </TabGroup>
    </CollapsibleGroup>
  );
}

/** A brand-new section. Every key the schema declares, with its empty spelling —
 *  the sanitizer requires them all, and `variant`/`layout` must be real options.
 *  `id` is minted by the caller, because it must be unique across the document. */
export const emptySection = (id: string): RawSection => ({
  variant: "default",
  id,
  index: "",
  eyebrow: "",
  title: "",
  lead: "",
  northStar: "",
  layout: "stack",
  glow: { text: "", top: "", right: "", bottom: "", left: "", size: "" },
  blocks: [],
});
