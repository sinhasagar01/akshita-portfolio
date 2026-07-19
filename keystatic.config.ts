import { config, collection, singleton, fields } from "@keystatic/core";

// P4 3(b) — reusable field-shapes for the new `sections` field (below), mirroring
// lib/case-studies/types.ts's ImgSpec/GlowWord. Kept as small helpers (not inlined
// per-block like body's simple fields.image() calls) because they're each a
// multi-field object reused 6+ times verbatim across the block union.
//
// `translate: [number, number]` has no native Keystatic tuple, so it is split into
// translateX/translateY here — the 3(c) adapter recombines them.
function imgSpecFields() {
  return {
    src: fields.image({
      label: "Image",
      directory: "public/images/projects",
      publicPath: "/images/projects/",
    }),
    alt: fields.text({ label: "Alt text" }),
    width: fields.number({ label: "Rendered width (px, optional)" }),
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

function deviceSpecFields() {
  return {
    ...imgSpecFields(),
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
        body: fields.blocks(
          {
            heroBlock: {
              label: "Hero block",
              schema: fields.object({
                thesis: fields.text({ label: "Thesis sentence (rendered italic)" }),
              }),
              itemLabel: (props: any) => `Hero — ${props.fields.thesis.value}`,
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
              itemLabel: (props: any) =>
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
              itemLabel: (props: any) =>
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
              itemLabel: (props: any) => `Step — ${props.fields.title.value}`,
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
              itemLabel: (props: any) => `Quote — ${props.fields.text.value}`,
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
              itemLabel: (props: any) => `Close — ${props.fields.line.value}`,
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
                    devices: fields.array(fields.object(deviceSpecFields()), {
                      label: "Devices — exactly two, back then front",
                      validation: { length: { min: 2, max: 2 } },
                    }),
                    glow: fields.object(glowWordFields(), { label: "Glow word (optional)" }),
                  }),
                  itemLabel: (props: any) => `Hero cover — ${props.fields.title.value}`,
                },
                deviceShelf: {
                  label: "Device shelf",
                  schema: fields.object({
                    devices: fields.array(fields.object(deviceSpecFields()), { label: "Devices" }),
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
                  itemLabel: (props: any) => `Pull quote — ${props.fields.text.value}`,
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
                featureRows: {
                  label: "Feature rows",
                  schema: fields.object({
                    features: fields.array(
                      fields.object({
                        index: fields.text({ label: "Index, e.g. \"01\"" }),
                        category: fields.text({ label: "Category" }),
                        title: fields.text({ label: "Title" }),
                        body: fields.text({ label: "Body — supports **bold**", multiline: true }),
                        image: fields.object(imgSpecFields(), { label: "Image" }),
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
                        before: fields.object(imgSpecFields(), { label: "Before image" }),
                        after: fields.object(imgSpecFields(), { label: "After image" }),
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
                    image: fields.object(imgSpecFields(), { label: "Image" }),
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
                  itemLabel: (props: any) => `Closing line — ${props.fields.text.value}`,
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
        description: fields.text({
          label: "Short description",
          multiline: true,
        }),
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
  },

  singletons: {
    siteSettings: singleton({
      label: "Site settings",
      path: "content/site-settings",
      schema: {
        heroCopy: fields.text({
          label: "Hero copy",
          description: "The large italic headline on the home page",
        }),
        tab1Label: fields.text({
          label: "Hero tab 1 name",
          description: "Keep it short, it renders as a tab label. The script backdrop word derives from it.",
        }),
        tab1Line: fields.text({
          label: "Hero tab 1 line",
          description: "The serif line shown when tab 1 is active",
          multiline: true,
        }),
        tab2Label: fields.text({
          label: "Hero tab 2 name",
          description: "Keep it short, it renders as a tab label. The script backdrop word derives from it.",
        }),
        tab2Line: fields.text({
          label: "Hero tab 2 line",
          description: "The serif line shown when tab 2 is active",
          multiline: true,
        }),
        tab3Label: fields.text({
          label: "Hero tab 3 name",
          description: "Keep it short, it renders as a tab label. The script backdrop word derives from it.",
        }),
        tab3Line: fields.text({
          label: "Hero tab 3 line",
          description: "The serif line shown when tab 3 is active",
          multiline: true,
        }),
        tab4Label: fields.text({
          label: "Hero tab 4 name",
          description: "Keep it short, it renders as a tab label. The script backdrop word derives from it.",
        }),
        tab4Line: fields.text({
          label: "Hero tab 4 line",
          description: "The serif line shown when tab 4 is active",
          multiline: true,
        }),
        heroRoleLabel: fields.text({
          label: "Hero role label",
          description: "The small uppercase label under the signature",
        }),
        heroScrollCue: fields.text({
          label: "Hero scroll cue",
          description: "The scroll prompt text at the bottom of the hero",
        }),
        photo: fields.image({
          label: "Hero and About photo",
          directory: "public/images",
          publicPath: "/images/",
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
            items: fields.array(fields.text({ label: "Skill" }), {
              label: "Skills in this category",
              itemLabel: (props) => props.value,
            }),
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
