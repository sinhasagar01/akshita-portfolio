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
import { TextField, TextArea, CheckField, NumberField, BlockImageField, ItemRows, TabGroup, DisclosureGroup, SelectField, inputCls, inputErrorCls, labelCls } from "./fields";
import { isHttpUrl } from "@/lib/case-studies/adapter";

// CS-6a — the per-image frame picker options. "" is a real choice ("Default"),
// omit-when-empty in the sanitizer so it falls back to the template default then
// phone (CS-4 precedence). The concrete values write that frame explicitly.
const FRAME_OPTIONS = ["", "phone", "browser", "macbook"] as const;
type FrameOption = (typeof FRAME_OPTIONS)[number];
const FRAME_LABELS: Record<FrameOption, string> = {
  "": "Default (from template)",
  phone: "Phone",
  browser: "Browser",
  macbook: "MacBook",
};
import { BLOCK_EMPTIES, emptyDevice, emptyImg, emptyGlow } from "./empties";

export type BlockFormProps<K extends SectionBlockKind> = {
  value: RawValue<K>;
  onChange: (next: RawValue<K>) => void;
  /** The panel's save-on-blur. */
  onBlur?: () => void;
  /** P4 4(b)-iv — the project slug, threaded to the image fields so an upload lands
   *  under this project's directory. The client still never names the FILE: it posts
   *  the slug and the bytes, and the server hashes and derives the path. */
  slug: string;
  /** PR 3a — which collection's image tree an upload lands in ("projects" | "blog").
   *  Threaded parallel to `slug` and REQUIRED, so a host that renders these forms must
   *  state it (SectionsEditPanel passes "projects"; the blog editor passes "blog" in
   *  PR 3c). A required prop, not an ambient default: the mis-scope this PR fixes came
   *  from a silent projects default nobody had to state. */
  collection: string;
};

type Entry<K extends SectionBlockKind> = {
  /** The row heading in the editor's block list. Falls back to the kind's label
   *  when the block has no text worth showing. */
  label: (value: RawValue<K>) => string;
  Form: ComponentType<BlockFormProps<K>>;
  /**
   * P4 4(b)-iii — the initial value for a newly added block. Deferred from PR A
   * deliberately, because until block-add existed it would have been fourteen
   * hand-written values with no consumer and no proof, drifting from the schema.
   *
   * Typed `RawValue<K>`, so a missing or wrong-typed key is a COMPILE error rather
   * than a save-time rejection. Every key the schema declares must be present with
   * its empty spelling — "" for text, null for a number or an image, false for a
   * checkbox — because the sanitizer requires them all.
   */
  empty: () => RawValue<K>;
};

/**
 * The kinds that HAVE an editor — now ALL of them.
 *
 * VE-1 and VE-2 kept `videoEmbed` out of this set with an `Exclude`, because the block
 * existed in the schema and rendered but had no form yet, and the tables below are
 * exhaustive by construction, so a form-less kind would have refused to compile. VE-3
 * builds the form, so the Exclude is gone and this is simply `SectionBlockKind` again —
 * every kind is editable, the tables demand a `videoEmbed` entry, and because the
 * add-block picker maps over BLOCK_REGISTRY's keys the block is now offered.
 *
 * The alias is kept (rather than replaced everywhere with SectionBlockKind) only so the
 * panel's existing references still read as "the editable kinds"; they are the same set.
 */
export type EditableBlockKind = SectionBlockKind;

/** Kind -> human name, for the block list and the not-editable-yet note. */
export const BLOCK_LABELS: { [K in EditableBlockKind]: string } = {
  heroCover: "Hero cover",
  deviceShelf: "Device shelf",
  pullQuote: "Pull quote",
  glanceGrid: "Glance grid",
  issueList: "Issue list",
  stepper: "Stepper",
  statCards: "Stat cards",
  principleCards: "Principle cards",
  figureGrid: "Figure grid",
  featureRows: "Feature rows",
  beforeAfter: "Before / after",
  swatchTokens: "Swatch tokens",
  annotatedImage: "Annotated image",
  richText: "Rich text",
  closingLine: "Closing line",
  videoEmbed: "Video embed",
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

/* ------------------------------------------------------------ tier 3 forms */

type RawImg = RawValue<"annotatedImage">["image"];
type RawDevice = RawValue<"deviceShelf">["devices"][number];

/**
 * The image geometry shared by every image-bearing kind: a READ-ONLY src, an
 * editable alt, and the five nullable numbers.
 *
 * `src` has no input and no writer — the only thing that renders it is
 * ReadOnlyImage, which cannot emit one. `alt` is editable on purpose: it is text,
 * it is real accessibility work, and it is independent of the binary.
 */
function ImgSpecFields<T extends RawImg>({
  value,
  set,
  onBlur,
  focusRef,
  slug,
  collection,
  imageLabel = "Image",
}: {
  value: T;
  set: (next: T) => void;
  onBlur?: () => void;
  focusRef?: (el: HTMLElement | null) => void;
  slug: string;
  collection: string;
  imageLabel?: string;
}) {
  return (
    <>
      {/* Content — the image asset and its alt text (real accessibility copy). */}
      <TabGroup group="content">
        <BlockImageField
          label={imageLabel}
          src={value.src}
          slug={slug} collection={collection}
          // The upload/clear commits the blob and hands back the path; the src edit
          // then rides the ordinary save, so `sections` keeps its single writer.
          onChange={(src) => set({ ...value, src })}
        />
        <TextField
          label="Alt text"
          value={value.alt}
          onChange={(alt) => set({ ...value, alt })}
          onBlur={onBlur}
          inputRef={focusRef}
        />
      </TabGroup>
      {/* Style — the frame picker (always visible: "Default" is a meaningful choice,
          not an empty knob to hide) plus the image geometry. The geometry is optional
          and collapses behind one reveal; the frame does not. */}
      <TabGroup group="style">
        <SelectField
          label="Frame"
          value={
            (FRAME_OPTIONS as readonly string[]).includes(value.frame)
              ? (value.frame as FrameOption)
              : ""
          }
          options={FRAME_OPTIONS}
          optionLabel={(v) => FRAME_LABELS[v]}
          onChange={(frame) => set({ ...value, frame })}
          onBlur={onBlur}
          hint="How this image renders. Default follows the case study's template."
        />
        <DisclosureGroup revealLabel="Sizing & position">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Width, px" value={value.width} onChange={(width) => set({ ...value, width })} onBlur={onBlur} optional />
            <NumberField label="Rotate, deg" value={value.rotate} onChange={(rotate) => set({ ...value, rotate })} onBlur={onBlur} optional />
            <NumberField label="Translate X, px" value={value.translateX} onChange={(translateX) => set({ ...value, translateX })} onBlur={onBlur} optional />
            <NumberField label="Translate Y, px" value={value.translateY} onChange={(translateY) => set({ ...value, translateY })} onBlur={onBlur} optional />
            <NumberField label="Stacking order" value={value.z} onChange={(z) => set({ ...value, z })} onBlur={onBlur} optional />
          </div>
        </DisclosureGroup>
      </TabGroup>
    </>
  );
}

function DeviceFields({
  value,
  set,
  onBlur,
  focusRef,
  slug,
  collection,
}: {
  value: RawDevice;
  set: (next: RawDevice) => void;
  onBlur?: () => void;
  focusRef?: (el: HTMLElement | null) => void;
  slug: string;
  collection: string;
}) {
  return (
    <>
      <ImgSpecFields value={value} set={set} onBlur={onBlur} focusRef={focusRef} slug={slug} collection={collection} imageLabel="Screen" />
      {/* Theme label is copy (Content); the dot colour is appearance (Style). */}
      <TabGroup group="content">
        <TextField label="Theme label" value={value.label} onChange={(label) => set({ ...value, label })} onBlur={onBlur} />
      </TabGroup>
      <TabGroup group="style">
        <TextField label="Dot colour, hex" value={value.dotColor} onChange={(dotColor) => set({ ...value, dotColor })} onBlur={onBlur} />
      </TabGroup>
    </>
  );
}

/** The glow word — the same shape as the section shell's own glow, one level down. */
function GlowFields<T extends { text: string; top: string; right: string; bottom: string; left: string; size: string }>({
  value,
  set,
  onBlur,
}: {
  value: T;
  set: (next: T) => void;
  onBlur?: () => void;
}) {
  return (
    // The glow word is pure appearance — the whole group lives under Style.
    <TabGroup group="style" className="">
      <div className="rounded-md border border-ink-950/8 bg-cream-100 p-3">
        <span className="mb-2 block text-[10px] uppercase tracking-eyebrow text-ink-400">
          Glow word (optional)
        </span>
        {/* The whole glow word is optional, so its inputs collapse behind one reveal. */}
        <DisclosureGroup revealLabel="Glow settings">
          <TextField label="Text" value={value.text} onChange={(text) => set({ ...value, text })} onBlur={onBlur} optional />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Top (CSS)" value={value.top} onChange={(top) => set({ ...value, top })} onBlur={onBlur} optional />
            <TextField label="Right (CSS)" value={value.right} onChange={(right) => set({ ...value, right })} onBlur={onBlur} optional />
            <TextField label="Bottom (CSS)" value={value.bottom} onChange={(bottom) => set({ ...value, bottom })} onBlur={onBlur} optional />
            <TextField label="Left (CSS)" value={value.left} onChange={(left) => set({ ...value, left })} onBlur={onBlur} optional />
          </div>
          <TextField label="Size (CSS)" value={value.size} onChange={(size) => set({ ...value, size })} onBlur={onBlur} optional />
        </DisclosureGroup>
      </div>
    </TabGroup>
  );
}

const DeviceShelfForm: ComponentType<BlockFormProps<"deviceShelf">> = ({ value, onChange, onBlur, slug, collection }) => (
  <>
    <ItemRows
      items={value.devices}
      onChange={(devices) => onChange({ ...value, devices })}
      empty={emptyDevice}
      addLabel="Add device"
      itemNoun="Device"
      rowLabel={(d, i) => d.label.trim() || `Device ${i + 1}`}
    >
      {({ item, set, focusRef }) => (
        <DeviceFields value={item} set={set} onBlur={onBlur} focusRef={focusRef} slug={slug} collection={collection} />
      )}
    </ItemRows>
    <TabGroup group="style">
      <NumberField
        label="Minimum height, px"
        value={value.minHeight}
        onChange={(minHeight) => onChange({ ...value, minHeight })}
        onBlur={onBlur}
      />
    </TabGroup>
    <GlowFields value={value.glow} set={(glow) => onChange({ ...value, glow })} onBlur={onBlur} />
  </>
);

const FeatureRowsForm: ComponentType<BlockFormProps<"featureRows">> = ({ value, onChange, onBlur, slug, collection }) => (
  <ItemRows
    items={value.features}
    onChange={(features) => onChange({ ...value, features })}
    empty={() => ({
      index: "",
      category: "",
      title: "",
      body: "",
      image: { src: null, alt: "", width: null, rotate: null, translateX: null, translateY: null, z: null, frame: "" },
    })}
    addLabel="Add feature"
    itemNoun="Feature"
    rowLabel={(f, i) => f.title.trim() || `Feature ${i + 1}`}
  >
    {({ item, set, focusRef }) => (
      <>
        <TabGroup group="content">
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Index" value={item.index} onChange={(index) => set({ ...item, index })} onBlur={onBlur} inputRef={focusRef} />
            <TextField label="Category" value={item.category} onChange={(category) => set({ ...item, category })} onBlur={onBlur} />
          </div>
          <TextField label="Title" value={item.title} onChange={(title) => set({ ...item, title })} onBlur={onBlur} />
          <TextArea label="Body — **bold** for emphasis" value={item.body} onChange={(body) => set({ ...item, body })} onBlur={onBlur} rows={2} />
        </TabGroup>
        <ImgSpecFields value={item.image} set={(image) => set({ ...item, image })} onBlur={onBlur} slug={slug} collection={collection} />
      </>
    )}
  </ItemRows>
);

const FigureGridForm: ComponentType<BlockFormProps<"figureGrid">> = ({ value, onChange, onBlur, slug, collection }) => (
  <>
    <TextField
      label="Heading (optional)"
      value={value.heading}
      onChange={(heading) => onChange({ ...value, heading })}
      onBlur={onBlur}
    />
    <ItemRows
      items={value.items}
      onChange={(items) => onChange({ ...value, items })}
      empty={() => ({ image: emptyImg(), title: "", body: "" })}
      addLabel="Add figure"
      itemNoun="Figure"
      rowLabel={(it, i) => it.title.trim() || `Figure ${i + 1}`}
    >
      {({ item, set, focusRef }) => (
        <>
          <TabGroup group="content">
            <TextField label="Title (optional)" value={item.title} onChange={(title) => set({ ...item, title })} onBlur={onBlur} inputRef={focusRef} />
            <TextArea label="Body (optional) — **bold** for emphasis" value={item.body} onChange={(body) => set({ ...item, body })} onBlur={onBlur} rows={2} />
          </TabGroup>
          <ImgSpecFields value={item.image} set={(image) => set({ ...item, image })} onBlur={onBlur} slug={slug} collection={collection} />
        </>
      )}
    </ItemRows>
  </>
);

const AnnotatedImageForm: ComponentType<BlockFormProps<"annotatedImage">> = ({ value, onChange, onBlur, slug, collection }) => (
  <>
    <ImgSpecFields value={value.image} set={(image) => onChange({ ...value, image })} onBlur={onBlur} slug={slug} collection={collection} />
    <div className="rounded-md border border-ink-950/8 bg-cream-100 p-3">
      <span className="mb-2 block text-[10px] uppercase tracking-eyebrow text-ink-400">
        Scrawl (optional)
      </span>
      <div className="flex flex-col gap-2">
        <TabGroup group="content">
          <TextArea label="Text" value={value.scrawl.text} onChange={(text) => onChange({ ...value, scrawl: { ...value.scrawl, text } })} onBlur={onBlur} rows={2} />
        </TabGroup>
        <TabGroup group="style">
          <DisclosureGroup revealLabel="Scrawl position">
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Top (CSS)" value={value.scrawl.top} onChange={(top) => onChange({ ...value, scrawl: { ...value.scrawl, top } })} onBlur={onBlur} optional />
              <TextField label="Right (CSS)" value={value.scrawl.right} onChange={(right) => onChange({ ...value, scrawl: { ...value.scrawl, right } })} onBlur={onBlur} optional />
              <TextField label="Bottom (CSS)" value={value.scrawl.bottom} onChange={(bottom) => onChange({ ...value, scrawl: { ...value.scrawl, bottom } })} onBlur={onBlur} optional />
              <TextField label="Left (CSS)" value={value.scrawl.left} onChange={(left) => onChange({ ...value, scrawl: { ...value.scrawl, left } })} onBlur={onBlur} optional />
            </div>
          </DisclosureGroup>
        </TabGroup>
      </div>
    </div>
    <ItemRows
      items={value.callouts}
      onChange={(callouts) => onChange({ ...value, callouts })}
      empty={() => ({ title: "", note: "", top: "", right: "", bottom: "", left: "" })}
      addLabel="Add callout"
      itemNoun="Callout"
      rowLabel={(c, i) => c.title.trim() || `Callout ${i + 1}`}
    >
      {({ item, set, focusRef }) => (
        <>
          <TabGroup group="content">
            <TextField label="Title" value={item.title} onChange={(title) => set({ ...item, title })} onBlur={onBlur} inputRef={focusRef} />
            <TextField label="Note" value={item.note} onChange={(note) => set({ ...item, note })} onBlur={onBlur} />
          </TabGroup>
          {/* CSS-value text, not numbers — plain strings, so the empties rule
              covers them and the null rule does not apply. */}
          <TabGroup group="style">
            <DisclosureGroup revealLabel="Callout position">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Top (CSS)" value={item.top} onChange={(top) => set({ ...item, top })} onBlur={onBlur} optional />
                <TextField label="Right (CSS)" value={item.right} onChange={(right) => set({ ...item, right })} onBlur={onBlur} optional />
                <TextField label="Bottom (CSS)" value={item.bottom} onChange={(bottom) => set({ ...item, bottom })} onBlur={onBlur} optional />
                <TextField label="Left (CSS)" value={item.left} onChange={(left) => set({ ...item, left })} onBlur={onBlur} optional />
              </div>
            </DisclosureGroup>
          </TabGroup>
        </>
      )}
    </ItemRows>
  </>
);

const HeroCoverForm: ComponentType<BlockFormProps<"heroCover">> = ({ value, onChange, onBlur, slug, collection }) => (
  <>
    {/* Content — all the hero copy, the rating chip, and the meta facts. */}
    <TabGroup group="content">
    <TextField label="Title" value={value.title} onChange={(title) => onChange({ ...value, title })} onBlur={onBlur} />
    <TextArea label="Thesis sentence" value={value.thesis} onChange={(thesis) => onChange({ ...value, thesis })} onBlur={onBlur} rows={2} />
    <TextArea label="Position statement" value={value.position} onChange={(position) => onChange({ ...value, position })} onBlur={onBlur} rows={2} />
    <DisclosureGroup revealLabel="Eyebrow & watermark">
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => onChange({ ...value, eyebrow })} onBlur={onBlur} optional />
        <TextField label="Watermark word" value={value.watermark} onChange={(watermark) => onChange({ ...value, watermark })} onBlur={onBlur} optional />
      </div>
    </DisclosureGroup>
    <div className="rounded-md border border-ink-950/8 bg-cream-100 p-3">
      <span className="mb-2 block text-[10px] uppercase tracking-eyebrow text-ink-400">
        Rating chip (optional)
      </span>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Stat" value={value.ratingChip.stat} onChange={(stat) => onChange({ ...value, ratingChip: { ...value.ratingChip, stat } })} onBlur={onBlur} />
        <TextField label="Rest" value={value.ratingChip.rest} onChange={(rest) => onChange({ ...value, ratingChip: { ...value.ratingChip, rest } })} onBlur={onBlur} />
      </div>
    </div>
    <ItemRows
      items={value.meta}
      onChange={(meta) => onChange({ ...value, meta })}
      empty={() => ({ label: "", value: "" })}
      addLabel="Add meta fact"
      itemNoun="Fact"
      rowLabel={(m, i) => m.label.trim() || `Fact ${i + 1}`}
    >
      {({ item, set, focusRef }) => (
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Label" value={item.label} onChange={(label) => set({ ...item, label })} onBlur={onBlur} inputRef={focusRef} />
          <TextField label="Value" value={item.value} onChange={(v) => set({ ...item, value: v })} onBlur={onBlur} />
        </div>
      )}
    </ItemRows>
    </TabGroup>
    {/* Devices are mixed (alt/label are Content; geometry/dot colour are Style) —
        DeviceFields splits them, so the two-device shelf shows under both tabs.
        fixedLength: the schema validates exactly two, and the adapter re-validates
        when narrowing to its tuple — a third device would throw at SSG. Reorder
        stays, because it swaps back and front, which is meaningful. */}
    <ItemRows
      items={value.devices}
      onChange={(devices) => onChange({ ...value, devices })}
      empty={emptyDevice}
      addLabel="Add device"
      itemNoun="Device"
      noAdd
      noRemove
      addNote="This block takes exactly two devices."
      rowLabel={(_, i) => (i === 0 ? "Device 1 (back)" : "Device 2 (front)")}
    >
      {({ item, set, focusRef }) => (
        <DeviceFields value={item} set={set} onBlur={onBlur} focusRef={focusRef} slug={slug} collection={collection} />
      )}
    </ItemRows>
    <GlowFields value={value.glow} set={(glow) => onChange({ ...value, glow })} onBlur={onBlur} />
  </>
);

/** The first DOUBLY nested array: pairs[] each holding their own changes[]. */
const BeforeAfterForm: ComponentType<BlockFormProps<"beforeAfter">> = ({ value, onChange, onBlur, slug, collection }) => (
  <ItemRows
    items={value.pairs}
    onChange={(pairs) => onChange({ ...value, pairs })}
    empty={() => ({ title: "", tag: "", before: emptyImg(), after: emptyImg(), changes: [] })}
    addLabel="Add pair"
    itemNoun="Pair"
    rowLabel={(p, i) => p.title.trim() || `Pair ${i + 1}`}
  >
    {({ item, set, focusRef }) => (
      <>
        <TabGroup group="content">
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Title" value={item.title} onChange={(title) => set({ ...item, title })} onBlur={onBlur} inputRef={focusRef} />
            <TextField label="Tag" value={item.tag} onChange={(tag) => set({ ...item, tag })} onBlur={onBlur} />
          </div>
        </TabGroup>
        <ImgSpecFields value={item.before} set={(before) => set({ ...item, before })} onBlur={onBlur} slug={slug} collection={collection} imageLabel="Before image" />
        <ImgSpecFields value={item.after} set={(after) => set({ ...item, after })} onBlur={onBlur} slug={slug} collection={collection} imageLabel="After image" />
        <TabGroup group="content">
          <ItemRows
            items={item.changes}
            onChange={(changes) => set({ ...item, changes })}
            empty={() => ({ emphasis: "", rest: "" })}
            addLabel="Add change"
            itemNoun="Change"
            rowLabel={(c, i) => c.emphasis.trim() || `Change ${i + 1}`}
          >
            {({ item: ch, set: setCh, focusRef: chFocus }) => (
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Emphasis" value={ch.emphasis} onChange={(emphasis) => setCh({ ...ch, emphasis })} onBlur={onBlur} inputRef={chFocus} />
                <TextField label="Rest" value={ch.rest} onChange={(rest) => setCh({ ...ch, rest })} onBlur={onBlur} />
              </div>
            )}
          </ItemRows>
        </TabGroup>
      </>
    )}
  </ItemRows>
);

/* ------------------------------------------- swatchTokens — the nested union
 *
 * The deepest shape in the schema: groups[] -> tokens[] -> a `{ discriminant, value }`
 * union. That is LITERALLY the same shape as a block, one level down, so it gets a
 * MINI-REGISTRY mirroring BLOCK_REGISTRY rather than a switch: exhaustive by
 * construction over the derived inner union, so a third token kind is a compile
 * error here exactly as a 15th block kind is below.
 *
 * The type select is READ-ONLY. Switching color <-> font would replace the value's
 * SHAPE, not edit a field — that is "change block kind" one level down, and a
 * decided non-feature. Rendering it read-only says so rather than silently
 * offering a control that would discard the token's contents.                    */

type RawToken = RawValue<"swatchTokens">["groups"][number]["tokens"][number];
type TokenKind = RawToken["discriminant"];
type TokenValue<K extends TokenKind> = Extract<RawToken, { discriminant: K }>["value"];

type TokenEntry<K extends TokenKind> = {
  label: string;
  Form: ComponentType<{
    value: TokenValue<K>;
    onChange: (next: TokenValue<K>) => void;
    onBlur?: () => void;
    focusRef?: (el: HTMLElement | null) => void;
  }>;
};

const TOKEN_REGISTRY: { [K in TokenKind]: TokenEntry<K> } = {
  color: {
    label: "Colour",
    Form: ({ value, onChange, onBlur, focusRef }) => (
      <>
        <TextField label="Name" value={value.name} onChange={(name) => onChange({ ...value, name })} onBlur={onBlur} inputRef={focusRef} />
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Value" value={value.value} onChange={(v) => onChange({ ...value, value: v })} onBlur={onBlur} />
          <TextField label="Hex (optional)" value={value.hex} onChange={(hex) => onChange({ ...value, hex })} onBlur={onBlur} />
        </div>
      </>
    ),
  },
  font: {
    label: "Font",
    Form: ({ value, onChange, onBlur, focusRef }) => (
      <>
        <TextField label="Name" value={value.name} onChange={(name) => onChange({ ...value, name })} onBlur={onBlur} inputRef={focusRef} />
        <TextField label="Note" value={value.note} onChange={(note) => onChange({ ...value, note })} onBlur={onBlur} />
      </>
    ),
  },
};

function TokenFields({
  token,
  set,
  onBlur,
  focusRef,
}: {
  token: RawToken;
  set: (next: RawToken) => void;
  onBlur?: () => void;
  focusRef?: (el: HTMLElement | null) => void;
}) {
  const entry = TOKEN_REGISTRY[token.discriminant];
  // Same correlation the block lookup has: the table is keyed by discriminant and
  // each Form is typed to its own kind's value, which the lookup cannot express to
  // the compiler. Asserted once, here.
  const Form = entry.Form as ComponentType<{
    value: RawToken["value"];
    onChange: (next: RawToken["value"]) => void;
    onBlur?: () => void;
    focusRef?: (el: HTMLElement | null) => void;
  }>;
  return (
    <>
      {/* READ-ONLY: switching the type would replace the value's shape. */}
      <div className="flex items-center gap-2">
        <span className="text-eyebrow uppercase tracking-eyebrow text-ink-400">Type</span>
        <span className="rounded-full border border-ink-950/15 px-2 py-0.5 text-[10px] text-ink-600">
          {entry.label}
        </span>
        <span className="text-[10px] text-text-subtle">Fixed — a token's type can't be changed here</span>
      </div>
      <Form
        value={token.value}
        onChange={(value) => set({ ...token, value } as RawToken)}
        onBlur={onBlur}
        focusRef={focusRef}
      />
    </>
  );
}

const SwatchTokensForm: ComponentType<BlockFormProps<"swatchTokens">> = ({ value, onChange, onBlur }) => (
  <ItemRows
    items={value.groups}
    onChange={(groups) => onChange({ ...value, groups })}
    empty={() => ({ tokens: [] })}
    addLabel="Add group"
    itemNoun="Group"
    rowLabel={(_, i) => `Group ${i + 1}`}
  >
    {({ item, set }) => (
      <ItemRows
        items={item.tokens}
        onChange={(tokens) => set({ ...item, tokens })}
        // A new token defaults to a colour, matching the schema's own
        // defaultValue. Its value carries every key the shape declares.
        empty={() => ({ discriminant: "color", value: { name: "", value: "", hex: "" } }) as RawToken}
        addLabel="Add token"
        itemNoun="Token"
        rowLabel={(t, i) => t.value.name.trim() || `Token ${i + 1}`}
      >
        {({ item: token, set: setToken, focusRef }) => (
          <TokenFields token={token} set={setToken} onBlur={onBlur} focusRef={focusRef} />
        )}
      </ItemRows>
    )}
  </ItemRows>
);

// VE-3 — the videoEmbed form.
//
// The video is a URL, not an upload (VE-1's locked decision), so `src` is a text field
// with the SAME http(s) rule the sanitiser and renderer enforce, surfaced here as an
// inline error the moment a non-empty value is not a usable URL. EMPTY is allowed and
// silent: a block is born without a source and the publish gate — not this form — is
// what refuses to ship one. Everything else reuses machinery that already exists: the
// poster rides ImgSpecFields' content-addressed upload, the caption is a marker textarea
// (the same **bold** *italic* [link](url) the inline canvas edit reads), and the frame
// is a plain select defaulting to the browser chrome.
const VideoEmbedForm: ComponentType<BlockFormProps<"videoEmbed">> = ({ value, onChange, onBlur, slug, collection }) => {
  const srcInvalid = value.src.trim() !== "" && !isHttpUrl(value.src);
  return (
    <>
      <TabGroup group="content">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Video URL — externally hosted (https://…)</span>
          <input
            type="text"
            value={value.src}
            onChange={(e) => onChange({ ...value, src: e.target.value })}
            onBlur={onBlur}
            aria-invalid={srcInvalid}
            placeholder="https://…"
            className={srcInvalid ? inputErrorCls : inputCls}
          />
          {srcInvalid ? (
            <span role="alert" className="text-[10px] text-danger-600">
              Must be an http:// or https:// URL. The video is hosted elsewhere, not uploaded.
            </span>
          ) : (
            <span className="text-[10px] text-text-subtle">
              Leave blank while drafting. Publish refuses a video with no source.
            </span>
          )}
        </label>
        <TextArea
          label="Caption (optional) — **bold**, *italic*, [links](url)"
          value={value.caption}
          onChange={(caption) => onChange({ ...value, caption })}
          onBlur={onBlur}
          rows={2}
        />
        <TextField label="Eyebrow (optional)" value={value.eyebrow} onChange={(eyebrow) => onChange({ ...value, eyebrow })} onBlur={onBlur} optional />
        <TextField label="Title (optional)" value={value.title} onChange={(title) => onChange({ ...value, title })} onBlur={onBlur} optional />
      </TabGroup>
      <TabGroup group="style">
        <SelectField
          label="Frame"
          value={value.frame === "plain" ? "plain" : "browser"}
          options={VIDEO_FRAME_OPTIONS}
          optionLabel={(v) => VIDEO_FRAME_LABELS[v]}
          onChange={(frame) => onChange({ ...value, frame })}
          onBlur={onBlur}
          hint="Browser puts the video in window chrome; plain is a bare card."
        />
        <TextField label="Aspect ratio, e.g. 1.7778 (optional)" value={value.aspect} onChange={(aspect) => onChange({ ...value, aspect })} onBlur={onBlur} optional />
        <DisclosureGroup revealLabel="Poster still (optional)">
          <ImgSpecFields value={value.poster} set={(poster) => onChange({ ...value, poster })} onBlur={onBlur} slug={slug} collection={collection} imageLabel="Poster still" />
        </DisclosureGroup>
      </TabGroup>
    </>
  );
};

const VIDEO_FRAME_OPTIONS = ["browser", "plain"] as const;
const VIDEO_FRAME_LABELS: Record<(typeof VIDEO_FRAME_OPTIONS)[number], string> = {
  browser: "Browser",
  plain: "Plain",
};

/* ---------------------------------------------------------------- the table */

export const BLOCK_REGISTRY: { [K in EditableBlockKind]: Entry<K> } = {
  // tier 1
  closingLine: { empty: BLOCK_EMPTIES.closingLine, label: (v) => firstLine(v.text, "Closing line"), Form: ClosingLineForm },
  pullQuote: { empty: BLOCK_EMPTIES.pullQuote, label: (v) => firstLine(v.text, "Pull quote"), Form: PullQuoteForm },
  videoEmbed: {
    empty: BLOCK_EMPTIES.videoEmbed,
    label: (v) => firstLine(v.title, v.src.trim() || "Video embed"),
    Form: VideoEmbedForm,
  },
  richText: { empty: BLOCK_EMPTIES.richText,
    label: (v) => firstLine(v.paragraphs[0] ?? "", "Rich text"),
    Form: RichTextForm,
      },
  glanceGrid: { empty: BLOCK_EMPTIES.glanceGrid, label: (v) => `Glance grid — ${v.items.length} items`, Form: GlanceGridForm },
  issueList: { empty: BLOCK_EMPTIES.issueList, label: (v) => `Issue list — ${v.items.length} items`, Form: IssueListForm },
  stepper: { empty: BLOCK_EMPTIES.stepper, label: (v) => `Stepper — ${v.steps.length} steps`, Form: StepperForm },
  // tier 2
  statCards: { empty: BLOCK_EMPTIES.statCards,
    label: (v) => firstLine(v.heading, `Stat cards — ${v.stats.length} stats`),
    Form: StatCardsForm,
      },
  principleCards: { empty: BLOCK_EMPTIES.principleCards,
    label: (v) => firstLine(v.heading, `Principle cards — ${v.cards.length} cards`),
    Form: PrincipleCardsForm,
      },
  figureGrid: { empty: BLOCK_EMPTIES.figureGrid,
    label: (v) => firstLine(v.heading, `Figure grid — ${v.items.length} ${v.items.length === 1 ? "figure" : "figures"}`),
    Form: FigureGridForm,
      },
  // tier 3
  heroCover: { empty: BLOCK_EMPTIES.heroCover,
    label: (v) => firstLine(v.title, "Hero cover"),
    Form: HeroCoverForm,
    // devices is the schema's ONLY length constraint ({min:2,max:2}), so an empty
    // heroCover is born with two devices — `devices: []` would be rejected by
    // arrayOfLen the moment it was saved.
  },
  deviceShelf: { empty: BLOCK_EMPTIES.deviceShelf, label: (v) => `Device shelf — ${v.devices.length} devices`, Form: DeviceShelfForm },
  featureRows: { empty: BLOCK_EMPTIES.featureRows, label: (v) => `Feature rows — ${v.features.length} features`, Form: FeatureRowsForm },
  beforeAfter: { empty: BLOCK_EMPTIES.beforeAfter, label: (v) => `Before / after — ${v.pairs.length} pairs`, Form: BeforeAfterForm },
  swatchTokens: { empty: BLOCK_EMPTIES.swatchTokens, label: (v) => `Swatch tokens — ${v.groups.length} groups`, Form: SwatchTokensForm },
  annotatedImage: { empty: BLOCK_EMPTIES.annotatedImage,
    label: (v) => firstLine(v.callouts[0]?.title ?? "", "Annotated image"),
    Form: AnnotatedImageForm,
  },
};

