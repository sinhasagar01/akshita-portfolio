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
import { TextField, TextArea, SelectField, TabGroup, DisclosureGroup, groupLabelCls } from "./fields";

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
    <div className="flex flex-col gap-2 rounded-[var(--studio-radius-control,4px)] border border-ink-950/12 bg-cream-100 p-3">
      <span className={groupLabelCls}>Section settings</span>
      {/* Content — the copy that renders in the section header, plus the anchor id
          and display index that identify it. */}
      <TabGroup group="content">
        {/* Eyebrow + Title are the section's primary header, always shown. The rest
            of the shell copy is optional (adapter opt/richOpt) and collapses when
            blank so a fresh section isn't a wall of empty inputs. */}
        <TextField label="Eyebrow" value={value.eyebrow} onChange={(v) => set("eyebrow", v)} onBlur={onBlur} />
        <TextField label="Title" value={value.title} onChange={(v) => set("title", v)} onBlur={onBlur} />
        <DisclosureGroup revealLabel="More section fields">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <TextField
                label="Anchor id"
                value={value.id}
                onChange={(v) => set("id", v)}
                onBlur={onBlur}
                optional
              />
              {duplicateId && (
                <span className="text-[10px] text-accent-600">
                  Another section already uses this id. Anchors need it to be unique.
                </span>
              )}
            </div>
            <TextField label="Index, e.g. 03" value={value.index} onChange={(v) => set("index", v)} onBlur={onBlur} optional />
          </div>
          <TextArea
            label="Lead — **bold** for emphasis"
            value={value.lead}
            onChange={(v) => set("lead", v)}
            onBlur={onBlur}
            rows={2}
            optional
          />
          <TextField label="North star" value={value.northStar} onChange={(v) => set("northStar", v)} onBlur={onBlur} optional />
        </DisclosureGroup>
      </TabGroup>
      {/* Style — how the section presents: variant, layout, and the glow word. */}
      <TabGroup group="style">
        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Variant"
            value={value.variant}
            options={VARIANTS}
            onChange={(v) => set("variant", v)}
            onBlur={onBlur}
            hint="hero skips the standard header"
          />
          <SelectField
            label="Layout"
            value={value.layout}
            options={LAYOUTS}
            onChange={(v) => set("layout", v)}
            onBlur={onBlur}
          />
        </div>
        {/* The glow word is optional appearance — collapse it behind one reveal. */}
        <DisclosureGroup revealLabel="Glow settings">
          <div className="grid grid-cols-2 gap-2">
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
    </div>
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
