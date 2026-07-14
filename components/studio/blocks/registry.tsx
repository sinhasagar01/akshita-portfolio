"use client";

// P4 4(b)-ii — the block form registry, keyed by discriminant.
//
// EXHAUSTIVE BY CONSTRUCTION. `{ [K in SectionBlockKind]: … }` over the
// Keystatic-derived union means a 15th kind is a compile error here, with no
// assertNever: a mapped type over a union IS the exhaustiveness check (assertNever
// is for the switch statements, which is where the adapter and the sanitizer use
// it). Add a kind to the schema and this file stops compiling until it has a form.
//
// FORMS EDIT THE RAW SHAPE, never lib/case-studies/types.ts. See sections-raw.ts —
// raw carries `**bold**` as a plain string, empties as present keys, and
// translateX/translateY as separate numbers. A form typed against the renderer's
// types would write shapes the file has never held.
//
// THE HARD RULE, at the form layer: preserve exactly what was read. Every form
// spreads the value it was given and replaces one key, so any field it does not
// render (and every empty it does) rides through untouched. No form trims, drops an
// empty string, or omits a key — that is what makes the surgical round-trip hold
// for a block the owner only partly edited.
import type { ComponentType } from "react";
import type { SectionBlockKind, RawValue } from "@/lib/case-studies/sections-raw";
import { TextField, TextArea, CheckField, ItemRows } from "./fields";

export type BlockFormProps<K extends SectionBlockKind> = {
  value: RawValue<K>;
  onChange: (next: RawValue<K>) => void;
  /** The panel's save-on-blur. */
  onBlur?: () => void;
};

type Entry<K extends SectionBlockKind> = {
  /** The row heading in the editor's block list. Falls back to the kind's label
   *  when the block has no text worth showing. */
  label: (value: RawValue<K>) => string;
  /** Absent = tier 3, no form yet (PR B). The panel renders a preserved-untouched
   *  note instead, and the sanitizer round-trips the value opaquely. */
  Form?: ComponentType<BlockFormProps<K>>;
};

/** Kind -> human name, for the block list and the not-editable-yet note. */
export const BLOCK_LABELS: { [K in SectionBlockKind]: string } = {
  heroCover: "Hero cover",
  deviceShelf: "Device shelf",
  pullQuote: "Pull quote",
  glanceGrid: "Glance grid",
  issueList: "Issue list",
  stepper: "Stepper",
  statCards: "Stat cards",
  principleCards: "Principle cards",
  featureRows: "Feature rows",
  beforeAfter: "Before / after",
  swatchTokens: "Swatch tokens",
  annotatedImage: "Annotated image",
  richText: "Rich text",
  closingLine: "Closing line",
};

const firstLine = (s: string, fallback: string) => s.split("\n")[0].trim() || fallback;

/* ------------------------------------------------------------ tier 1 forms */

const ClosingLineForm: ComponentType<BlockFormProps<"closingLine">> = ({ value, onChange, onBlur }) => (
  <TextField
    label="Closing line"
    value={value.text}
    onChange={(text) => onChange({ ...value, text })}
    onBlur={onBlur}
  />
);

const PullQuoteForm: ComponentType<BlockFormProps<"pullQuote">> = ({ value, onChange, onBlur }) => (
  <TextArea
    label="Text — **bold** for emphasis"
    value={value.text}
    onChange={(text) => onChange({ ...value, text })}
    onBlur={onBlur}
  />
);

const RichTextForm: ComponentType<BlockFormProps<"richText">> = ({ value, onChange, onBlur }) => (
  <ItemRows
    items={value.paragraphs}
    onChange={(paragraphs) => onChange({ ...value, paragraphs })}
    empty={() => ""}
    addLabel="Add paragraph"
    itemNoun="Paragraph"
    rowLabel={(p, i) => firstLine(p, `Paragraph ${i + 1}`).slice(0, 48)}
  >
    {({ item, set, focusRef }) => (
      <TextArea
        label="Paragraph — **bold** for emphasis"
        value={item}
        onChange={set}
        onBlur={onBlur}
        inputRef={focusRef}
      />
    )}
  </ItemRows>
);

const GlanceGridForm: ComponentType<BlockFormProps<"glanceGrid">> = ({ value, onChange, onBlur }) => (
  <ItemRows
    items={value.items}
    onChange={(items) => onChange({ ...value, items })}
    empty={() => ({ label: "", value: "" })}
    addLabel="Add item"
    itemNoun="Item"
    rowLabel={(it, i) => it.label.trim() || `Item ${i + 1}`}
  >
    {({ item, set, focusRef }) => (
      <>
        <TextField
          label="Label"
          value={item.label}
          onChange={(label) => set({ ...item, label })}
          onBlur={onBlur}
          inputRef={focusRef}
        />
        <TextField
          label="Value"
          value={item.value}
          onChange={(v) => set({ ...item, value: v })}
          onBlur={onBlur}
        />
      </>
    )}
  </ItemRows>
);

const IssueListForm: ComponentType<BlockFormProps<"issueList">> = ({ value, onChange, onBlur }) => (
  <ItemRows
    items={value.items}
    onChange={(items) => onChange({ ...value, items })}
    empty={() => ({ title: "", note: "" })}
    addLabel="Add issue"
    itemNoun="Issue"
    rowLabel={(it, i) => it.title.trim() || `Issue ${i + 1}`}
  >
    {({ item, set, focusRef }) => (
      <>
        <TextField
          label="Title"
          value={item.title}
          onChange={(title) => set({ ...item, title })}
          onBlur={onBlur}
          inputRef={focusRef}
        />
        <TextField
          label="Note"
          value={item.note}
          onChange={(note) => set({ ...item, note })}
          onBlur={onBlur}
        />
      </>
    )}
  </ItemRows>
);

const StepperForm: ComponentType<BlockFormProps<"stepper">> = ({ value, onChange, onBlur }) => (
  <ItemRows
    items={value.steps}
    onChange={(steps) => onChange({ ...value, steps })}
    empty={() => ({ label: "", text: "" })}
    addLabel="Add step"
    itemNoun="Step"
    rowLabel={(s, i) => s.label.trim() || `Step ${i + 1}`}
  >
    {({ item, set, focusRef }) => (
      <>
        <TextField
          label="Label"
          value={item.label}
          onChange={(label) => set({ ...item, label })}
          onBlur={onBlur}
          inputRef={focusRef}
        />
        <TextArea
          label="Text"
          value={item.text}
          onChange={(text) => set({ ...item, text })}
          onBlur={onBlur}
          rows={2}
        />
      </>
    )}
  </ItemRows>
);

/* ------------------------------------------------------------ tier 2 forms */

const StatCardsForm: ComponentType<BlockFormProps<"statCards">> = ({ value, onChange, onBlur }) => (
  <>
    <TextField
      label="Heading (optional)"
      value={value.heading}
      onChange={(heading) => onChange({ ...value, heading })}
      onBlur={onBlur}
    />
    <ItemRows
      items={value.stats}
      onChange={(stats) => onChange({ ...value, stats })}
      // Every key the schema declares, including the "" and the false. An omitted
      // key would drop from the file; the sanitizer requires them all, so a
      // forgotten one fails the save loudly instead.
      empty={() => ({ value: "", suffix: "", body: "", tag: "", highlighted: false })}
      addLabel="Add stat"
      itemNoun="Stat"
      rowLabel={(s, i) => s.value.trim() || `Stat ${i + 1}`}
    >
      {({ item, set, focusRef }) => (
        <>
          <TextField
            label="Value"
            value={item.value}
            onChange={(v) => set({ ...item, value: v })}
            onBlur={onBlur}
            inputRef={focusRef}
          />
          <TextField
            label="Suffix (optional)"
            value={item.suffix}
            onChange={(suffix) => set({ ...item, suffix })}
            onBlur={onBlur}
          />
          <TextArea
            label="Body — **bold** for emphasis"
            value={item.body}
            onChange={(body) => set({ ...item, body })}
            onBlur={onBlur}
            rows={2}
          />
          <TextField
            label="Tag"
            value={item.tag}
            onChange={(tag) => set({ ...item, tag })}
            onBlur={onBlur}
          />
          <CheckField
            label="Highlighted"
            value={item.highlighted}
            onChange={(highlighted) => set({ ...item, highlighted })}
            onBlur={onBlur}
          />
        </>
      )}
    </ItemRows>
  </>
);

const PrincipleCardsForm: ComponentType<BlockFormProps<"principleCards">> = ({
  value,
  onChange,
  onBlur,
}) => (
  <>
    <TextField
      label="Heading (optional)"
      value={value.heading}
      onChange={(heading) => onChange({ ...value, heading })}
      onBlur={onBlur}
    />
    <TextField
      label="Subhead (optional)"
      value={value.subhead}
      onChange={(subhead) => onChange({ ...value, subhead })}
      onBlur={onBlur}
    />
    <ItemRows
      items={value.cards}
      onChange={(cards) => onChange({ ...value, cards })}
      empty={() => ({ index: "", title: "", body: "" })}
      addLabel="Add card"
      itemNoun="Card"
      rowLabel={(c, i) => c.title.trim() || `Card ${i + 1}`}
    >
      {({ item, set, focusRef }) => (
        <>
          <TextField
            label="Index"
            value={item.index}
            onChange={(index) => set({ ...item, index })}
            onBlur={onBlur}
            inputRef={focusRef}
          />
          <TextField
            label="Title"
            value={item.title}
            onChange={(title) => set({ ...item, title })}
            onBlur={onBlur}
          />
          <TextArea
            label="Body — **bold** for emphasis"
            value={item.body}
            onChange={(body) => set({ ...item, body })}
            onBlur={onBlur}
            rows={2}
          />
        </>
      )}
    </ItemRows>
  </>
);

/* ---------------------------------------------------------------- the table */

export const BLOCK_REGISTRY: { [K in SectionBlockKind]: Entry<K> } = {
  // tier 1
  closingLine: { label: (v) => firstLine(v.text, "Closing line"), Form: ClosingLineForm },
  pullQuote: { label: (v) => firstLine(v.text, "Pull quote"), Form: PullQuoteForm },
  richText: {
    label: (v) => firstLine(v.paragraphs[0] ?? "", "Rich text"),
    Form: RichTextForm,
  },
  glanceGrid: { label: (v) => `Glance grid — ${v.items.length} items`, Form: GlanceGridForm },
  issueList: { label: (v) => `Issue list — ${v.items.length} items`, Form: IssueListForm },
  stepper: { label: (v) => `Stepper — ${v.steps.length} steps`, Form: StepperForm },
  // tier 2
  statCards: {
    label: (v) => firstLine(v.heading, `Stat cards — ${v.stats.length} stats`),
    Form: StatCardsForm,
  },
  principleCards: {
    label: (v) => firstLine(v.heading, `Principle cards — ${v.cards.length} cards`),
    Form: PrincipleCardsForm,
  },
  // tier 3 — no Form yet (PR B). Preserved untouched by the panel and round-tripped
  // opaquely by the sanitizer, exactly as every non-pullQuote kind was in 4(b)-i.
  heroCover: { label: (v) => firstLine(v.title, "Hero cover") },
  deviceShelf: { label: () => "Device shelf" },
  featureRows: { label: (v) => `Feature rows — ${v.features.length} features` },
  beforeAfter: { label: (v) => `Before / after — ${v.pairs.length} pairs` },
  swatchTokens: { label: (v) => `Swatch tokens — ${v.groups.length} groups` },
  annotatedImage: { label: () => "Annotated image" },
};
