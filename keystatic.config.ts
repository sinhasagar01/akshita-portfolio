import { config, collection, singleton, fields } from "@keystatic/core";

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
        positioningLine: fields.text({
          label: "Positioning line",
          description: "The supporting sentence below the hero",
          multiline: true,
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
        discoverText: fields.text({
          label: "Process step 1 — Discover",
          description: "One line describing what Discover means in practice",
        }),
        defineText: fields.text({
          label: "Process step 2 — Define",
          description: "One line describing what Define means in practice",
        }),
        developText: fields.text({
          label: "Process step 3 — Develop",
          description: "One line describing what Develop means in practice",
        }),
        deliverText: fields.text({
          label: "Process step 4 — Deliver",
          description: "One line describing what Deliver means in practice",
        }),
        resumeUrl: fields.url({
          label: "Resume URL",
          description: "Direct link to the PDF resume",
        }),
        email: fields.text({ label: "Contact email" }),
        linkedinUrl: fields.url({ label: "LinkedIn URL" }),
        dribbbleUrl: fields.url({ label: "Dribbble URL" }),
        behanceUrl: fields.url({ label: "Behance URL" }),
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
