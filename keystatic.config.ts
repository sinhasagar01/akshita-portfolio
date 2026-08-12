// ⚠ LINE COMMENTS ONLY IN THIS FILE. NEVER A BLOCK COMMENT.
//
// Every collection here declares a `path` whose glob ends in a slash-star, and a comment-stripper
// reads that as a block-comment OPENER. It has no closer of its own, so it pairs with the first
// closer it meets — which means ADDING a well-formed block comment anywhere below re-pairs the
// delimiters and swallows everything between them.
//
// Measured when it happened: one added block comment collapsed this file from 57,245 bytes to 6,845
// under stripping, and two suites went red on assertions about collections nowhere near the edit.
// Nothing was wrong with the schema. The reports were confident and about a different string than
// the one anybody meant.
//
// THE DURABLE FORM, WHICH IS WHY THIS SITS AT THE TOP RATHER THAN IN A COMMIT MESSAGE:
// COMMENT-STRIPPING IS A PARSER, AND A PARSER THAT CANNOT SEE NESTING WILL REPORT CONFIDENTLY ABOUT
// A STRING THAT IS NOT THE ONE YOU MEANT. The trap was already recorded in CLAUDE.md and was walked
// into anyway, because a rule in a document a reader has not opened is not a guard.
import { config, collection, singleton, fields } from "@keystatic/core";
// p4-4biii loads THIS config as a runtime VALUE under `node --experimental-strip-types`,
// which cannot resolve a relative TS module (extensionless fails node; a ".ts" extension
// fails tsc/Next). So the schema-side image bases are declared LOCALLY here rather than
// imported. The RUNTIME single source is lib/studio/collection-image-base.ts (the path
// helpers + upload routes take a base from there); these two mirrors are pinned EQUAL by
// ralph/tests/collection-image-paths.mjs, so they cannot drift. The type is imported
// type-only (erased under strip-types, so it never triggers the resolution).
import type { CollectionImageBase } from "./lib/studio/collection-image-base";

const PROJECTS_IMAGE_BASE: CollectionImageBase = {
  directory: "public/images/projects",
  publicPrefix: "/images/projects",
  publicPath: "/images/projects/",
};
const BLOG_IMAGE_BASE: CollectionImageBase = {
  directory: "public/images/blog",
  publicPrefix: "/images/blog",
  publicPath: "/images/blog/",
};

/** Exported ONLY so ralph/tests/collection-image-paths.mjs can pin these schema-side
 *  mirrors equal to the runtime source (collection-image-base.ts) and fail if they ever
 *  drift. Not consumed by the app — Keystatic reads the default export. */
export const SCHEMA_IMAGE_BASES = { projects: PROJECTS_IMAGE_BASE, blog: BLOG_IMAGE_BASE };

// P4 3(b) — reusable field-shapes for the new `sections` field (below), mirroring
// lib/case-studies/types.ts's ImgSpec/GlowWord. Kept as small helpers (not inlined
// per-block like body's simple fields.image() calls) because they're each a
// multi-field object reused 6+ times verbatim across the block union.
//
// PR 3a — `base` is a REQUIRED parameter (no projects default). The bug this fixes was
// exactly a silent projects default: the blog collection (below) called imgSpecFields()
// and its poster was configured to land under the projects tree with nobody noticing.
// Every call site now names its collection's base explicitly, so a future collection
// cannot inherit the trap. Projects call sites pass PROJECTS_IMAGE_BASE, whose values
// are byte-identical to the strings hardcoded here before this PR.
//
// `translate: [number, number]` has no native Keystatic tuple, so it is split into
// translateX/translateY here — the 3(c) adapter recombines them.
function imgSpecFields(base: CollectionImageBase) {
  return {
    src: fields.image({
      label: "Image",
      directory: base.directory,
      publicPath: base.publicPath,
    }),
    alt: fields.text({ label: "Alt text" }),
    width: fields.number({ label: "Rendered width (px, optional)" }),
    // ⚠ THE SOURCE ASSET'S OWN SIZE, not a rendered one. A static import carries it implicitly; a
    // content path cannot, so without these `DeviceImage` falls back to a canonical phone aspect
    // and renders a wide footer strip in a tall box. Optional — absent keeps the old fallback.
    intrinsicWidth: fields.number({ label: "Source width (px, optional)" }),
    intrinsicHeight: fields.number({ label: "Source height (px, optional)" }),
    rotate: fields.number({ label: "Rotation (degrees, desktop only, optional)" }),
    translateX: fields.number({ label: "Translate X (px, desktop only, optional)" }),
    translateY: fields.number({ label: "Translate Y (px, desktop only, optional)" }),
    z: fields.number({ label: "Stacking order (optional)" }),
    // CS-4 — the device frame the image renders in. OPTIONAL and omit-when-empty:
    // existing content has no `frame` key, and the adapter defaults absent -> phone,
    // so nothing renders differently until CS-5 consumes it. Stored as text (not a
    // select-with-default, which the reader would inject into every image); the enum
    // is enforced strictly by the sanitizer.
    frame: fields.text({ label: "Frame (phone | browser | macbook, optional)" }),
  };
}

function deviceSpecFields(base: CollectionImageBase) {
  return {
    ...imgSpecFields(base),
    label: fields.text({ label: "Theme label (optional)" }),
    dotColor: fields.text({ label: "Dot colour, hex (optional)" }),
  };
}

function glowWordFields() {
  return {
    text: fields.text({ label: "Word" }),
    top: fields.text({ label: "top (CSS value, optional)" }),
    right: fields.text({ label: "right (CSS value, optional)" }),
    bottom: fields.text({ label: "bottom (CSS value, optional)" }),
    left: fields.text({ label: "left (CSS value, optional)" }),
    size: fields.text({ label: "font-size (CSS value, optional)" }),
  };
}

export default config({
  storage: {
    kind: "local",
  },

  ui: {
    brand: {
      name: "Portfolio CMS",
    },
  },

  collections: {
    projects: collection({
      label: "Projects",
      slugField: "title",
      path: "content/projects/*",
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        summary: fields.text({
          label: "Summary",
          description: "One sentence shown on the project card",
          multiline: false,
        }),
        orderIndex: fields.number({
          label: "Order",
          description: "Lower numbers appear first",
          defaultValue: 99,
          validation: { isRequired: true, min: 0, max: 999 },
        }),
        heroImage: fields.image({
          label: "Hero image",
          directory: "public/images/projects",
          publicPath: "/images/projects/",
        }),
        facts: fields.object(
          {
            role: fields.text({ label: "Role" }),
            type: fields.text({ label: "Type" }),
            platform: fields.text({ label: "Platform" }),
            timeline: fields.text({ label: "Timeline" }),
          },
          { label: "Meta facts shown in the case study hero" }
        ),
        // CS-4 — the case-study template that DERIVES the default image frame
        // (web -> browser, mobile -> phone). OPTIONAL and omit-when-empty: absent
        // template -> phone default, so existing content is unaffected. Stored as
        // text (not a select-with-default the reader would inject); the enum is
        // enforced strictly by the sanitizer.
        template: fields.text({ label: "Template (mobile | web, optional)" }),
        // Editorial taxonomy — which filter bucket a study belongs to (PR 1 of the
        // work-section rebuild; nothing reads it yet). DELIBERATELY separate from
        // `template`: template is a RENDER decision (web->browser hero), category is
        // taxonomy, so a future hero redesign can't silently re-bucket the filter.
        // Stored as text like `template` (empty default, so createReader never throws
        // on an entry lacking it); the enum is enforced strictly by the sanitizer.
        category: fields.text({ label: "Category (mobile | web)" }),
        body: fields.blocks(
          {
            heroBlock: {
              label: "Hero block",
              schema: fields.object({
                thesis: fields.text({ label: "Thesis sentence (rendered italic)" }),
              }),
              itemLabel: (props) => `Hero — ${props.fields.thesis.value}`,
            },
            summaryGrid: {
              label: "Summary grid",
              schema: fields.object({
                product: fields.text({ label: "Product" }),
                problem: fields.text({ label: "Problem" }),
                details: fields.text({ label: "Details" }),
                solution: fields.text({ label: "Solution" }),
                result: fields.text({ label: "Result" }),
              }),
              itemLabel: () => "Summary grid",
            },
            impactNumbers: {
              label: "Impact numbers",
              schema: fields.object({
                stat1Number: fields.text({ label: "Stat 1 number" }),
                stat1Label:  fields.text({ label: "Stat 1 label" }),
                stat2Number: fields.text({ label: "Stat 2 number" }),
                stat2Label:  fields.text({ label: "Stat 2 label" }),
                stat3Number: fields.text({ label: "Stat 3 number" }),
                stat3Label:  fields.text({ label: "Stat 3 label" }),
              }),
              itemLabel: () => "Impact numbers",
            },
            context: {
              label: "Context",
              schema: fields.object({
                body: fields.document({
                  label: "Context body",
                  formatting: true,
                }),
              }),
              itemLabel: () => "Context",
            },
            problem: {
              label: "Problem statement",
              schema: fields.object({
                statement: fields.text({ label: "Problem statement" }),
                image: fields.image({
                  label: "Supporting image",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
              }),
              itemLabel: (props) =>
                `Problem — ${props.fields.statement.value}`,
            },
            goals: {
              label: "Goals and North Star",
              schema: fields.object({
                northStar: fields.text({ label: "North Star statement" }),
                goals: fields.array(fields.text({ label: "Goal" }), {
                  label: "Goals",
                  itemLabel: (props) => props.value,
                }),
              }),
              itemLabel: () => "Goals",
            },
            processSteps: {
              label: "Process steps",
              schema: fields.object({
                steps: fields.array(
                  fields.object({
                    phase: fields.text({ label: "Phase name" }),
                    description: fields.text({
                      label: "Description",
                      multiline: true,
                    }),
                  }),
                  {
                    label: "Process phases",
                    itemLabel: (props) => props.fields.phase.value,
                  }
                ),
              }),
              itemLabel: () => "Process steps",
            },
            keyInsights: {
              label: "Key insights",
              schema: fields.object({
                insights: fields.array(
                  fields.object({
                    number: fields.text({ label: "Number or label" }),
                    insight: fields.text({ label: "Insight", multiline: true }),
                  }),
                  {
                    label: "Insights",
                    itemLabel: (props) => props.fields.insight.value,
                  }
                ),
              }),
              itemLabel: () => "Key insights",
            },
            solutionReveal: {
              label: "Solution reveal",
              schema: fields.object({
                headline: fields.text({ label: "Reveal headline" }),
                image: fields.image({
                  label: "Brand visual",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
              }),
              itemLabel: (props) =>
                `Solution — ${props.fields.headline.value}`,
            },
            guidedDesignStep: {
              label: "Guided design step",
              schema: fields.object({
                title: fields.text({ label: "Step title" }),
                caption: fields.text({
                  label: "Caption (2 to 3 sentences)",
                  multiline: true,
                }),
                image: fields.image({
                  label: "Screen or interaction image",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
              }),
              itemLabel: (props) => `Step — ${props.fields.title.value}`,
            },
            imageGallery: {
              label: "Image or gallery",
              schema: fields.object({
                image1: fields.image({
                  label: "Image 1",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
                image2: fields.image({
                  label: "Image 2 (optional)",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
                image3: fields.image({
                  label: "Image 3 (optional)",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
                caption: fields.text({ label: "Caption" }),
              }),
              itemLabel: () => "Image or gallery",
            },
            comparison: {
              label: "Comparison",
              schema: fields.object({
                beforeImage: fields.image({
                  label: "Before image",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
                afterImage: fields.image({
                  label: "After image",
                  directory: "public/images/projects",
                  publicPath: "/images/projects/",
                }),
                caption: fields.text({ label: "Caption" }),
              }),
              itemLabel: () => "Comparison",
            },
            quote: {
              label: "Quote",
              schema: fields.object({
                text: fields.text({ label: "Quote text", multiline: true }),
                attribution: fields.text({ label: "Attribution" }),
              }),
              itemLabel: (props) => `Quote — ${props.fields.text.value}`,
            },
            reflection: {
              label: "Reflection",
              schema: fields.object({
                body: fields.document({
                  label: "Reflection body",
                  formatting: true,
                }),
              }),
              itemLabel: () => "Reflection",
            },
            closingLine: {
              label: "Closing line",
              schema: fields.object({
                line: fields.text({ label: "Closing line" }),
              }),
              itemLabel: (props) => `Close — ${props.fields.line.value}`,
            },
          },
          { label: "Case study body blocks" }
        ),
        // P4 3(b) — the bespoke Section -> Block[] container (lib/case-studies/
        // types.ts), added ADDITIVELY alongside `body` (untouched). Coexists until
        // 3(d) migrates the 3 non-bespoke projects and deletes `body`. Nothing
        // reads this field yet (no adapter, no route change — schema only).
        // Rich fields (body/lead/northStar/paragraphs) are plain multiline text
        // supporting literal **bold** — parsed by the 3(c) adapter, not
        // fields.document (avoids externalizing a .mdoc per instance).
        sections: fields.array(
          fields.object({
            variant: fields.select({
              label: "Variant",
              options: [
                { label: "Hero", value: "hero" },
                { label: "Default", value: "default" },
                { label: "Static", value: "static" },
                { label: "Bare", value: "bare" },
              ],
              defaultValue: "default",
            }),
            id: fields.text({ label: "Anchor id (optional)" }),
            index: fields.text({ label: "Index label, e.g. \"01\" (optional)" }),
            eyebrow: fields.text({ label: "Eyebrow (optional)" }),
            title: fields.text({
              label: "Title (optional)",
              description: "A line break here becomes an explicit line split",
              multiline: true,
            }),
            lead: fields.text({ label: "Lead — supports **bold** (optional)", multiline: true }),
            northStar: fields.text({
              label: "North Star statement — supports **bold** (optional)",
              multiline: true,
            }),
            layout: fields.select({
              label: "Layout",
              options: [
                { label: "Stack", value: "stack" },
                { label: "Split", value: "split" },
              ],
              defaultValue: "stack",
            }),
            glow: fields.object(glowWordFields(), { label: "Glow word" }),
            blocks: fields.blocks(
              {
                heroCover: {
                  label: "Hero cover",
                  schema: fields.object({
                    title: fields.text({ label: "Title" }),
                    thesis: fields.text({ label: "Thesis sentence" }),
                    position: fields.text({ label: "Position statement", multiline: true }),
                    eyebrow: fields.text({ label: "Eyebrow (optional)" }),
                    watermark: fields.text({ label: "Watermark word (optional)" }),
                    ratingChip: fields.object(
                      {
                        stat: fields.text({ label: "Stat, e.g. \"★ 4.2\"" }),
                        rest: fields.text({ label: "Rest of the chip text" }),
                      },
                      { label: "Rating chip (optional)" }
                    ),
                    meta: fields.array(
                      fields.object({
                        label: fields.text({ label: "Label" }),
                        value: fields.text({ label: "Value" }),
                      }),
                      { label: "Meta facts", itemLabel: (props) => props.fields.label.value }
                    ),
                    devices: fields.array(fields.object(deviceSpecFields(PROJECTS_IMAGE_BASE)), {
                      label: "Devices — exactly two, back then front",
                      validation: { length: { min: 2, max: 2 } },
                    }),
                    glow: fields.object(glowWordFields(), { label: "Glow word (optional)" }),
                  }),
                  itemLabel: (props) => `Hero cover — ${props.fields.title.value}`,
                },
                deviceShelf: {
                  label: "Device shelf",
                  schema: fields.object({
                    devices: fields.array(fields.object(deviceSpecFields(PROJECTS_IMAGE_BASE)), { label: "Devices" }),
                    glow: fields.object(glowWordFields(), { label: "Glow word (optional)" }),
                    minHeight: fields.number({ label: "Minimum height, px (optional)" }),
                  }),
                  itemLabel: () => "Device shelf",
                },
                pullQuote: {
                  label: "Pull quote",
                  schema: fields.object({
                    text: fields.text({ label: "Text", multiline: true }),
                  }),
                  itemLabel: (props) => `Pull quote — ${props.fields.text.value}`,
                },
                glanceGrid: {
                  label: "Glance grid",
                  schema: fields.object({
                    items: fields.array(
                      fields.object({
                        label: fields.text({ label: "Label" }),
                        value: fields.text({ label: "Value" }),
                      }),
                      { label: "Items", itemLabel: (props) => props.fields.label.value }
                    ),
                  }),
                  itemLabel: () => "Glance grid",
                },
                issueList: {
                  label: "Issue list",
                  schema: fields.object({
                    items: fields.array(
                      fields.object({
                        title: fields.text({ label: "Title" }),
                        note: fields.text({ label: "Note" }),
                      }),
                      { label: "Items", itemLabel: (props) => props.fields.title.value }
                    ),
                  }),
                  itemLabel: () => "Issue list",
                },
                stepper: {
                  label: "Stepper",
                  schema: fields.object({
                    steps: fields.array(
                      fields.object({
                        label: fields.text({ label: "Label" }),
                        text: fields.text({ label: "Text", multiline: true }),
                      }),
                      { label: "Steps", itemLabel: (props) => props.fields.label.value }
                    ),
                  }),
                  itemLabel: () => "Stepper",
                },
                statCards: {
                  label: "Stat cards",
                  schema: fields.object({
                    heading: fields.text({ label: "Heading (optional)" }),
                    stats: fields.array(
                      fields.object({
                        value: fields.text({ label: "Value" }),
                        suffix: fields.text({ label: "Suffix (optional)" }),
                        body: fields.text({ label: "Body — supports **bold**", multiline: true }),
                        tag: fields.text({ label: "Tag" }),
                        highlighted: fields.checkbox({ label: "Highlighted", defaultValue: false }),
                      }),
                      { label: "Stats", itemLabel: (props) => props.fields.value.value }
                    ),
                  }),
                  itemLabel: () => "Stat cards",
                },
                principleCards: {
                  label: "Principle cards",
                  schema: fields.object({
                    heading: fields.text({ label: "Heading (optional)" }),
                    subhead: fields.text({ label: "Subhead (optional)" }),
                    cards: fields.array(
                      fields.object({
                        index: fields.text({ label: "Index, e.g. \"01\"" }),
                        title: fields.text({ label: "Title" }),
                        body: fields.text({ label: "Body — supports **bold**", multiline: true }),
                      }),
                      { label: "Cards", itemLabel: (props) => props.fields.title.value }
                    ),
                  }),
                  itemLabel: () => "Principle cards",
                },
                figureGrid: {
                  label: "Figure grid",
                  schema: fields.object({
                    heading: fields.text({ label: "Heading (optional)" }),
                    items: fields.array(
                      fields.object({
                        image: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Image" }),
                        // An inline illustration id. Free text here rather than a select because
                        // the ids live in component code and this config is schema-only; the
                        // studio form offers the real list and a gate asserts they agree.
                        illustration: fields.text({ label: "Inline illustration id (optional)" }),
                        title: fields.text({ label: "Title (optional)" }),
                        body: fields.text({ label: "Body (optional) — supports **bold**", multiline: true }),
                      }),
                      { label: "Figures", itemLabel: (props) => props.fields.title.value || "Figure" }
                    ),
                  }),
                  itemLabel: () => "Figure grid",
                },
                featureRows: {
                  label: "Feature rows",
                  schema: fields.object({
                    // ⚠ ONE BLOCK, TWO PRESENTATIONS. `featureStory` was a separate kind carrying
                    // the IDENTICAL fields, so the Add menu offered two entries nothing told apart.
                    // Plain text rather than a select-with-default: a default would inject `variant`
                    // into every existing block, and ABSENT MUST KEEP MEANING "rows". The sanitizer
                    // lists it under `omitEmpty`, so an empty value round-trips to no key at all.
                    variant: fields.text({ label: "Layout (blank = rows, or \"story\")" }),
                    features: fields.array(
                      fields.object({
                        index: fields.text({ label: "Index, e.g. \"01\"" }),
                        category: fields.text({ label: "Category" }),
                        title: fields.text({ label: "Title" }),
                        body: fields.text({ label: "Body — supports **bold**", multiline: true }),
                        image: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Image" }),
                        // ⚠ A REAL CONDITIONAL, NOT FLAT FIELDS. Unlike beforeAfterStory's
                        // rating/after — where the flat pair is genuinely two values — these arms
                        // are MUTUALLY EXCLUSIVE. Flattening them would put a `screenFull` beside a
                        // `screenBody` and let an author fill both, which the render shape cannot
                        // represent. `none` is the default, so a plain feature carries no screen.
                        screen: fields.conditional(
                          fields.select({
                            label: "Auto-scroll screen",
                            options: [
                              { label: "None", value: "none" },
                              { label: "Single screen", value: "full" },
                              { label: "Scrolling body + pinned footer", value: "split" },
                            ],
                            defaultValue: "none",
                          }),
                          {
                            none: fields.empty(),
                            full: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Screen" }),
                            split: fields.object({
                              body: fields.object(
                                { ...imgSpecFields(PROJECTS_IMAGE_BASE), intrinsicHeight: fields.number({ label: "Intrinsic height (px)" }) },
                                { label: "Scrolling body" }
                              ),
                              footer: fields.object(
                                { ...imgSpecFields(PROJECTS_IMAGE_BASE), intrinsicHeight: fields.number({ label: "Intrinsic height (px)" }) },
                                { label: "Pinned footer" }
                              ),
                            }),
                          }
                        ),
                      }),
                      { label: "Features", itemLabel: (props) => props.fields.title.value }
                    ),
                  }),
                  itemLabel: () => "Feature rows",
                },
                beforeAfter: {
                  label: "Before / after",
                  schema: fields.object({
                    pairs: fields.array(
                      fields.object({
                        title: fields.text({ label: "Title" }),
                        tag: fields.text({ label: "Tag" }),
                        before: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Before image" }),
                        after: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "After image" }),
                        changes: fields.array(
                          fields.object({
                            emphasis: fields.text({ label: "Emphasis" }),
                            rest: fields.text({ label: "Rest" }),
                          }),
                          { label: "Changes", itemLabel: (props) => props.fields.emphasis.value }
                        ),
                      }),
                      { label: "Pairs", itemLabel: (props) => props.fields.title.value }
                    ),
                  }),
                  itemLabel: () => "Before / after",
                },
                // The scroll-pinned comparison story. It is `beforeAfter` plus its own card header
                // (index/eyebrow/title/lead), a rating stat, and an `after` that is a two-layer
                // auto-scroller rather than one image.
                //
                // ⚠ `intrinsicHeight` IS NOT `width`/`height`. It is the asset's own pixel height in
                // 1030-space, which `deviceScroller.unitGeo` divides by to get the scroll ratio. A
                // static import carries it intrinsically; a CMS path string cannot, and measuring at
                // runtime is the decode race the scroller documents itself as being free of. So it
                // is authored, and it is a DISTINCT field from the rendered heights on ImgSpec.
                beforeAfterStory: {
                  label: "Before / after (scroll story)",
                  schema: fields.object({
                    index: fields.text({ label: "Index, e.g. \"07\"" }),
                    eyebrow: fields.text({ label: "Eyebrow" }),
                    title: fields.text({ label: "Title" }),
                    lead: fields.text({ label: "Lead — supports **bold**", multiline: true }),
                    ratingFrom: fields.text({ label: "Rating before, e.g. \"2.3\"" }),
                    ratingTo: fields.text({ label: "Rating after, e.g. \"4.2\"" }),
                    pairs: fields.array(
                      fields.object({
                        title: fields.text({ label: "Screen name" }),
                        tag: fields.text({ label: "Tag" }),
                        before: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Before screen" }),
                        afterBody: fields.object(
                          { ...imgSpecFields(PROJECTS_IMAGE_BASE), intrinsicHeight: fields.number({ label: "Intrinsic height (px)" }) },
                          { label: "After — scrolling body" }
                        ),
                        afterFooter: fields.object(
                          { ...imgSpecFields(PROJECTS_IMAGE_BASE), intrinsicHeight: fields.number({ label: "Intrinsic height (px)" }) },
                          { label: "After — pinned footer" }
                        ),
                        changes: fields.array(
                          fields.object({
                            emphasis: fields.text({ label: "Emphasis" }),
                            rest: fields.text({ label: "Rest" }),
                          }),
                          { label: "Changes", itemLabel: (props) => props.fields.emphasis.value }
                        ),
                      }),
                      { label: "Pairs", itemLabel: (props) => props.fields.title.value }
                    ),
                  }),
                  itemLabel: () => "Before / after (scroll story)",
                },
                swatchTokens: {
                  label: "Swatch tokens",
                  schema: fields.object({
                    groups: fields.array(
                      fields.object({
                        tokens: fields.array(
                          fields.conditional(
                            fields.select({
                              label: "Type",
                              options: [
                                { label: "Color", value: "color" },
                                { label: "Font", value: "font" },
                              ],
                              defaultValue: "color",
                            }),
                            {
                              color: fields.object({
                                name: fields.text({ label: "Name" }),
                                value: fields.text({ label: "Value" }),
                                hex: fields.text({ label: "Hex (optional)" }),
                              }),
                              font: fields.object({
                                name: fields.text({ label: "Name" }),
                                note: fields.text({ label: "Note" }),
                              }),
                            }
                          ),
                          { label: "Tokens" }
                        ),
                      }),
                      { label: "Groups" }
                    ),
                  }),
                  itemLabel: () => "Swatch tokens",
                },
                annotatedImage: {
                  label: "Annotated image",
                  schema: fields.object({
                    image: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Image" }),
                    scrawl: fields.object(
                      {
                        text: fields.text({ label: "Text", multiline: true }),
                        top: fields.text({ label: "top (CSS value, optional)" }),
                        right: fields.text({ label: "right (CSS value, optional)" }),
                        bottom: fields.text({ label: "bottom (CSS value, optional)" }),
                        left: fields.text({ label: "left (CSS value, optional)" }),
                      },
                      { label: "Scrawl (optional)" }
                    ),
                    callouts: fields.array(
                      fields.object({
                        title: fields.text({ label: "Title" }),
                        note: fields.text({ label: "Note" }),
                        top: fields.text({ label: "top (CSS value, optional)" }),
                        right: fields.text({ label: "right (CSS value, optional)" }),
                        bottom: fields.text({ label: "bottom (CSS value, optional)" }),
                        left: fields.text({ label: "left (CSS value, optional)" }),
                      }),
                      { label: "Callouts", itemLabel: (props) => props.fields.title.value }
                    ),
                  }),
                  itemLabel: () => "Annotated image",
                },
                richText: {
                  label: "Rich text",
                  schema: fields.object({
                    paragraphs: fields.array(
                      fields.text({ label: "Paragraph — supports **bold**", multiline: true }),
                      { label: "Paragraphs", itemLabel: (props) => props.value }
                    ),
                  }),
                  itemLabel: () => "Rich text",
                },
                closingLine: {
                  label: "Closing line",
                  schema: fields.object({
                    text: fields.text({ label: "Closing line" }),
                  }),
                  itemLabel: (props) => `Closing line — ${props.fields.text.value}`,
                },
                // VE-1 — the 16th kind. The video is an EXTERNALLY HOSTED URL, never a
                // committed binary: P4-1's commit-into-the-repo rule is right for webp
                // stills (small, sharp-normalised, under the GraphQL commit ceiling) and
                // wrong for video on every one of those counts — multi-MB files, no
                // normalise step, permanent history bloat. So `src` is a text field and
                // there is no video-upload pipeline to build. The POSTER is the only
                // binary here, it is an image, and it reuses the content-addressed block
                // image spec unchanged.
                videoEmbed: {
                  label: "Video embed",
                  schema: fields.object({
                    src: fields.text({ label: "Video URL (https://…) — externally hosted" }),
                    poster: fields.object(imgSpecFields(PROJECTS_IMAGE_BASE), { label: "Poster still (optional)" }),
                    caption: fields.text({
                      label: "Caption (optional) — supports **bold**, *italic*, [links](url)",
                      multiline: true,
                    }),
                    // ONE block, two variations. `frame` mirrors the DeviceImage frame
                    // system, so the editor flips a field instead of the content having
                    // to choose between two near-identical kinds.
                    frame: fields.select({
                      label: "Frame",
                      options: [
                        { label: "Browser", value: "browser" },
                        { label: "Plain", value: "plain" },
                      ],
                      defaultValue: "browser",
                    }),
                    aspect: fields.text({ label: "Aspect ratio, e.g. 1.7778 (optional)" }),
                    eyebrow: fields.text({ label: "Eyebrow (optional)" }),
                    title: fields.text({ label: "Title (optional)" }),
                  }),
                  itemLabel: (props) =>
                    `Video — ${props.fields.title.value || props.fields.src.value || "no source"}`,
                },
              },
              { label: "Blocks" }
            ),
          }),
          {
            label: "Sections",
            itemLabel: (props) =>
              props.fields.title.value || props.fields.eyebrow.value || "Section",
          }
        ),
      },
    }),

    experience: collection({
      label: "Experience",
      slugField: "company",
      path: "content/experience/*",
      schema: {
        company: fields.slug({ name: { label: "Company" } }),
        title: fields.text({ label: "Role title" }),
        startDate: fields.text({
          label: "Start date",
          description: "Format as Month Year, e.g. Aug 2022",
        }),
        endDate: fields.text({
          label: "End date",
          description: "Write Present if current",
        }),
        // ⚠ `description` WAS HERE AND IS DELETED — IT HAD NO CONSUMER FOR ITS ENTIRE LIFE.
        // `ExperienceSection` is the live renderer and never read it; `ExperienceEntry`, the one
        // component that would have, was imported by nothing. Empty in every revision of all five
        // entries across six commits, so no sentence is lost. If role descriptions are wanted they
        // are a DESIGN CHANGE to the experience row — where bullets sit in a row that is currently
        // one line per role — not five blanks to fill.
        //
        // ⚠ LINE COMMENTS, NOT A BLOCK, AND NO DELIMITER WRITTEN OUT. The `path:` glob above ends
        // with a slash-star inside a STRING, which ralph's `code()` helper reads as a comment
        // opener. A block comment here contributes a closer that pairs with it and swallows the
        // schema between them — `bespoke-blocks` G5 caught exactly that, twice: once for the block
        // comment, and again when this note tried to EXPLAIN the delimiter by writing it.
        location: fields.text({
          label: "Location",
          description: "City, e.g. Bengaluru. Overrides the city parsed from the company name.",
        }),
        orderIndex: fields.number({
          label: "Order (most recent first)",
          defaultValue: 0,
          validation: { isRequired: true, min: 0, max: 99 },
        }),
      },
    }),

    // Blog — PR 1 of the blog arc: SCHEMA AND READ PATH ONLY. The collection ships
    // EMPTY (zero entries), nothing writes to it (no sanitizer, serializer, or route
    // arm), and nothing renders it (no /blog route). It exists so the read seam in
    // lib/keystatic.ts + lib/blog/select.ts has a collection to read, exactly as #159
    // added the projects `category` field before anything consumed it.
    //
    // EVERY TEXT FIELD IS `fields.text` WITH NO defaultValue, so the reader coalesces
    // an absent value to "" and createReader can never throw on an entry authored
    // before a field existed — the #159 posture. Real validation (the status enum, the
    // ISO date shape, the topic set) lives in the sanitizer when the write path lands.
    //
    // `status` GOVERNS PUBLIC VISIBILITY and FAILS CLOSED: getBlogPosts filters
    // `=== "published"`, so "" / "draft" / any unknown value never renders. This is
    // DELIBERATELY the opposite of `category` (#159), whose "" meant "visible under
    // All". category DESCRIBES a post; status governs whether it exists publicly, so a
    // typo'd or legacy "" must hide, not leak an unfinished post.
    blog: collection({
      label: "Blog",
      slugField: "title",
      path: "content/blog/*",
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        dek: fields.text({
          label: "Dek",
          description: "One line shown under the title on the post and the card",
          multiline: false,
        }),
        // AUTHORED ISO DATE (YYYY-MM-DD), stored as text. Blog is the first collection
        // that needs a SORTABLE date (featured = newest): experience models dates as
        // free display text ("Aug 2022", "Present") and projects sort by orderIndex, so
        // neither is a precedent. ISO text sorts lexically newest-first and keeps the
        // "cannot throw / no injected default" property; the editor PR can swap in a
        // date picker without churning the stored shape.
        date: fields.text({
          label: "Publish date",
          description: "Format as YYYY-MM-DD, e.g. 2026-07-24. Posts sort newest first.",
        }),
        // Authored taxonomy, like projects `category`. Stored as TEXT even though the set is now
        // CLOSED (PR D): a `fields.select` would inject a default into every entry the reader
        // parses, and studio is the sole editor, so the set is enforced where editing happens —
        // the sanitizer refuses a non-member at save, validate-blog-post requires a member at
        // publish, and the editor is a dropdown over BLOG_TOPICS. The reader still reads a plain
        // string, defensively, exactly as it reads `status`.
        topic: fields.text({ label: "Topic" }),
        status: fields.text({ label: "Status (draft | published)" }),
        // Entry hero. Reuses the projects heroImage CONVENTION (fields.image with an
        // explicit directory + publicPath) but its OWN directory, so blog heroes never
        // collide with project heroes. NOTE: the write-path derivation hero-image-path.ts
        // is still hardcoded to `projects` — a later PR's problem, tracked with the other
        // write-path hardcodings, not fixed here (nothing writes yet).
        heroImage: fields.image({
          label: "Hero image",
          directory: "public/images/blog",
          publicPath: "/images/blog/",
        }),
        // A post is a FLAT array of blocks (no section shell — a post has no named
        // chapters). Only the FOUR kinds that exist are declared: heading, richText,
        // pullQuote, videoEmbed. Their schemas are copied VERBATIM from the projects
        // `sections[].blocks` union (and reuse the same imgSpecFields() helper for the
        // video poster) so the shapes stay byte-identical — the future shared block
        // layer depends on that. A single-image `imageBlock` is NET-NEW (a kind to build
        // or figureGrid to repurpose) and is the editor PR's call, not declared here.
        //
        // PR 3a FIXED the poster mis-scope: imgSpecFields now takes a REQUIRED base and
        // the poster below passes BLOG_IMAGE_BASE, so a blog poster lands under
        // public/images/blog, not the projects tree. Blog entry heroes use the same blog
        // base via the parameterized hero-image-path; the blog hero UPLOAD (its commit
        // serializer) is still PR 3b.
        blocks: fields.blocks(
          {
            richText: {
              label: "Rich text",
              schema: fields.object({
                paragraphs: fields.array(
                  fields.text({ label: "Paragraph — supports **bold**", multiline: true }),
                  { label: "Paragraphs", itemLabel: (props) => props.value }
                ),
              }),
              itemLabel: () => "Rich text",
            },
            // BLOG PR 2 — the declared schema delta. A post's only structural break is a
            // subheading; the article design renders it as an <h2>. Plain text on purpose
            // (matching pullQuote's single-field object shape): headings carry no inline
            // marks in the design, and a `level` select would be speculative (the design
            // uses only h2) and would reintroduce the reader-injects-a-default concern the
            // rest of this config avoids. Adding a level later is additive and safe.
            heading: {
              label: "Heading",
              schema: fields.object({
                text: fields.text({ label: "Heading" }),
              }),
              itemLabel: (props) => `Heading — ${props.fields.text.value}`,
            },
            pullQuote: {
              label: "Pull quote",
              schema: fields.object({
                text: fields.text({ label: "Text", multiline: true }),
              }),
              itemLabel: (props) => `Pull quote — ${props.fields.text.value}`,
            },
            // THE INLINE FIGURE. Re-adding, not inventing: blog-article.html drew two of
            // these and #171 struck them out because "imageBlock is net-new and needs the
            // block-image upload path, which is hardcoded to projects". #172 made that path
            // take a REQUIRED per-collection base, so the blocker expired.
            //
            // DELIBERATELY NOT imgSpecFields(BLOG_IMAGE_BASE). That combinator carries
            // width, rotate, translateX, translateY, z and frame, which exist because a
            // case-study image is COMPOSED on a free canvas. A figure in a 68ch prose column
            // is PLACED, not composed, and BlogProse would read none of those six. Six
            // authorable fields no reader shows is the videoEmbed.poster condition six times
            // over — the exact thing this PR exists to clear. Blog owning its own image
            // shape is consistent with owning its registry, its validator table and its
            // splice.
            //
            // BOTH CHECKBOXES MEAN THE READER INJECTS A DEFAULT into every block of this
            // kind, which the rest of this config avoids. Acceptable here ONLY because the
            // kind is NEW: there is no existing content to migrate, so no file gains a key
            // on save. Do not copy this reasoning to a field added to an existing kind.
            imageBlock: {
              label: "Image",
              schema: fields.object({
                src: fields.image({
                  label: "Image",
                  directory: BLOG_IMAGE_BASE.directory,
                  publicPath: BLOG_IMAGE_BASE.publicPath,
                }),
                // Optional AT SAVE, enforced AT PUBLISH — see validate-blog-post. A block is
                // born with src: null and alt: "", so refusing empty here would make the
                // kind unaddable, exactly as videoSrc's own comment reasons.
                alt: fields.text({ label: "Alt text" }),
                // An inline diagram id. Free text here rather than a select because the
                // ids live in component code and this config is schema-only; the studio form
                // offers the real list and a gate asserts they agree.
                diagram: fields.text({ label: "Inline diagram id (optional)" }),
                // DISTINCT FROM ALT, and they serve different readers. `alt` replaces the
                // image for someone who cannot see it; `caption` sits under it and tells
                // someone who can what it MEANS. Markers, like videoEmbed.caption. Alt takes
                // none — marker syntax in an alt attribute is read aloud literally.
                caption: fields.text({
                  label: "Caption (optional) — supports **bold**, *italic*, [links](url)",
                  multiline: true,
                }),
                // The ONLY geometry knob, and a boolean because the design offers exactly
                // two placements. blog-article.html, locked: "Figures may break wider than
                // the measure; nothing else does."
                wide: fields.checkbox({
                  label: "Break wider than the text column",
                  defaultValue: false,
                }),
                // Without this, an author facing the publish gate types "image" into alt to
                // clear it, which is worse than empty because it is confidently wrong to a
                // screen reader. A decorative image renders alt="" — the correct HTML, not
                // an omitted attribute.
                decorative: fields.checkbox({
                  label: "Decorative — no alt text needed",
                  defaultValue: false,
                }),
              }),
              itemLabel: (props) => `Image — ${props.fields.alt.value || "no alt text"}`,
            },
            videoEmbed: {
              label: "Video embed",
              schema: fields.object({
                src: fields.text({ label: "Video URL (https://…) — externally hosted" }),
                // PR 3a — THE LIVE MIS-SCOPE FIX. Before this PR the blog poster called
                // imgSpecFields() with no base and inherited the projects tree; it now
                // names BLOG_IMAGE_BASE explicitly, so a blog poster lands under
                // public/images/blog. No migration — no blog post has a poster yet.
                poster: fields.object(imgSpecFields(BLOG_IMAGE_BASE), { label: "Poster still (optional)" }),
                caption: fields.text({
                  label: "Caption (optional) — supports **bold**, *italic*, [links](url)",
                  multiline: true,
                }),
                frame: fields.select({
                  label: "Frame",
                  options: [
                    { label: "Browser", value: "browser" },
                    { label: "Plain", value: "plain" },
                  ],
                  defaultValue: "browser",
                }),
                aspect: fields.text({ label: "Aspect ratio, e.g. 1.7778 (optional)" }),
                eyebrow: fields.text({ label: "Eyebrow (optional)" }),
                title: fields.text({ label: "Title (optional)" }),
              }),
              itemLabel: (props) =>
                `Video — ${props.fields.title.value || props.fields.src.value || "no source"}`,
            },
          },
          { label: "Blocks" }
        ),
      },
    }),
  },

  singletons: {
    siteSettings: singleton({
      label: "Site settings",
      path: "content/site-settings",
      schema: {
        // The public site's palette, as content. First in the order because it governs every
        // other field's rendering rather than sitting in one section.
        //
        // ⚠ `text` RATHER THAN `select`, DELIBERATELY. A select would put the valid list in the
        // schema, and this config is schema-ONLY — nothing renders it, so the list would buy no
        // author affordance while giving the reader a second opinion about validity. An unknown
        // value must fall closed to `cream`, not throw and take a public page down with it. The
        // one list lives in lib/theme.ts, the sanitizer refuses anything outside it at write
        // time, and resolveTheme() is the last word at read time.
        theme: fields.text({
          label: "Theme",
          description: "The public palette. Set from /studio, never by hand.",
        }),
        heroCopy: fields.text({
          label: "Hero copy",
          description: "The large italic headline on the home page",
        }),
        // ⚠ ONE ARRAY, NOT EIGHT FLAT KEYS PLUS A PARALLEL ONE. This replaced `tab1Label`
        // through `tab4Line`. The contract's hero gives each tab a headline, a support line,
        // three callout labels and three figures, and the only two shapes available were a
        // second array joined to the flat fields BY INDEX, or one object per tab. The first is
        // two places describing one tab, which this repo deletes on sight.
        // `processStages` below is the precedent, down to the itemLabel.
        heroTabs: fields.array(
          fields.object({
            label: fields.text({
              label: "Tab name",
              description: "Keep it short, it renders as a tab label. The script backdrop word derives from it.",
            }),
            headline: fields.text({
              label: "Headline",
              description: "The serif line shown when this tab is active",
              multiline: true,
            }),
            support: fields.text({
              label: "Support line",
              description: "The smaller sentence under the headline. Optional.",
              multiline: true,
            }),
            // ⚠ THE CALLOUT ANCHORS ARE NOT HERE, DELIBERATELY. Each callout's line meets the
            // panel edge at a fixed height, and those heights are LAYOUT — an author picks a
            // label, not a y-position. They live beside the component as a constant.
            callouts: fields.array(fields.text({ label: "Callout" }), {
              label: "Callouts",
              description: "Three short labels drawn beside the artwork. Optional.",
              itemLabel: (props) => props.value,
            }),
            stats: fields.array(
              fields.object({
                value: fields.text({ label: "Figure" }),
                unit: fields.text({ label: "Unit" }),
              }),
              {
                label: "Figures",
                description: "Three numbers with their units. Optional.",
                itemLabel: (props) => `${props.fields.value.value} ${props.fields.unit.value}`.trim(),
              }
            ),
          }),
          {
            label: "Hero tabs",
            description: "The four tabs on the home page hero",
            itemLabel: (props) => props.fields.label.value,
          }
        ),
        heroRoleLabel: fields.text({
          label: "Hero role label",
          description: "The small uppercase label under the signature",
        }),
        heroScrollCue: fields.text({
          label: "Hero scroll cue",
          description: "The scroll prompt text at the bottom of the hero",
        }),
        // ⚠ BLOCK COMMENTS ARE FORBIDDEN IN THIS FILE AND THIS IS WHY — LINE COMMENTS ONLY.
        // Three `path:` values here end in a glob whose slash-star ralph's comment-stripper reads
        // as an OPENER, and the file ships with three of them unclosed. Adding a block comment
        // hands those strays a closer to pair with: two block comments here took the stripped file
        // from 42,394 characters to 5,310 and turned two unrelated suites red. The record already
        // said "never write the glob"; the other half is that nothing may add a closer either.
        //
        // ⚠ THE HERO ILLUSTRATION, WHICH WAS THE ONE HOMEPAGE IMAGE WITH NO CMS FIELD AT ALL. The
        // ash hero shipped with the illustration hardcoded in `HeroSection.tsx`, so it could not be
        // seen or replaced from /studio — the owner found it missing. It is OPTIONAL, and the
        // renderer falls back to that same shipped asset, so every existing settings file renders
        // byte-identically with the key absent.
        heroFigure: fields.image({
          label: "Hero illustration",
          directory: "public/images/hero",
          publicPath: "/images/hero/",
          description: "The cut-out illustration in the hero's right panel. Transparent PNG or WebP.",
        }),
        // ⚠ RELABELLED, NOT MOVED. This read "Hero and About photo" and has not been the hero's
        // image since the ash rebuild — the hero draws `heroFigure` above. A label naming two
        // surfaces when it feeds one is how an author edits the wrong field.
        photo: fields.image({
          label: "About portrait",
          directory: "public/images",
          publicPath: "/images/",
          description: "The portrait in the About section.",
        }),
        aboutCopy: fields.text({
          label: "About bio",
          description: "A short paragraph shown in the About section on the home page",
          multiline: true,
        }),
        aboutNote: fields.text({
          label: "About note line",
          description: "Italic terracotta sentence shown below the bio paragraph",
        }),
        aboutFocusChips: fields.array(
          fields.text({ label: "Focus area" }),
          { label: "Focus chips", itemLabel: (props) => props.value }
        ),
        aboutSubtext: fields.text({
          label: "About subtext",
          description: "The line under the About heading",
        }),
        aboutPhotoCaption: fields.text({
          label: "About photo caption",
          description: "The caption over the About photo",
        }),
        processStages: fields.array(
          fields.object({
            name: fields.text({ label: "Stage name" }),
            description: fields.text({ label: "Description" }),
            tags: fields.array(fields.text({ label: "Tag" }), {
              label: "Tags",
              itemLabel: (props) => props.value,
            }),
          }),
          {
            label: "Process stages",
            description: "The four Process stages shown on the home page",
            itemLabel: (props) => props.fields.name.value,
          }
        ),
        email: fields.text({ label: "Contact email" }),
        // Item 10 — arbitrary owner-managed links (label + url), replacing the old
        // fixed resumeUrl/linkedinUrl/dribbbleUrl/behanceUrl fields. Array order is
        // the render order in the header + footer. Mirrors the processStages array.
        links: fields.array(
          fields.object({
            label: fields.text({ label: "Label" }),
            url: fields.url({ label: "URL" }),
          }),
          {
            label: "Links",
            description: "Social and web links shown in the header and footer",
            itemLabel: (props) => props.fields.label.value,
          }
        ),
      },
    }),

    skills: singleton({
      label: "Skills",
      path: "content/skills",
      schema: {
        categories: fields.array(
          fields.object({
            category: fields.text({ label: "Category name" }),
            // ⚠ LINE COMMENTS IN THIS FILE, NEVER A BLOCK COMMENT — AND THAT IS A HARD RULE.
            // This config contains THREE `path:` values whose glob ends in a slash-star, which
            // ralph's comment-stripper reads as a comment OPENER. The file therefore carries five
            // openers against two closers, permanently unbalanced.
            //
            // ⚠ SO ADDING A BLOCK COMMENT HERE DOES NOT ADD A COMMENT — IT RE-PAIRS A STRAY OPENER
            // HUNDREDS OF LINES ABOVE. A block comment written at this exact spot closed the
            // `content/blog/` glob at line 840 and deleted everything between them from the
            // stripped text: `bespoke-blocks`, `canvas-head` and `hero-figure-field` all went red
            // naming schema fields that were plainly still in the file.
            //
            // A SKILL IS AN OBJECT BECAUSE THE GLOW WORD BELONGS TO IT, not beside it. The homepage
            // draws a large ghost word behind the pills and swaps it on hover; that word was an
            // 18-entry map hardcoded in `SkillsBody.tsx`, so a skill added through the editor
            // produced a pill whose hover did nothing, with no error and nothing to read.
            //
            // The rejected shape was a parallel list of skill-to-word pairs beside the strings. It
            // keeps the chip editor unchanged and buys a second list that can drift from the first.
            // One skill, one row, both fields.
            items: fields.array(
              fields.object({
                name: fields.text({ label: "Skill" }),
                glow: fields.text({
                  label: "Glow word",
                  description:
                    "The word that fades in behind the pills on hover. Left empty, the pill "
                    + "simply leaves the previous word in place.",
                }),
              }),
              {
                label: "Skills in this category",
                itemLabel: (props) => props.fields.name.value,
              }
            ),
          }),
          {
            label: "Skill categories",
            itemLabel: (props) => props.fields.category.value,
          }
        ),
      },
    }),
  },
});
