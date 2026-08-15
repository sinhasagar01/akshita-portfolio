/* ============================================================================================
   THE KIT — THE PARTS THIS SITE IS ACTUALLY BUILT FROM.

   ⚠ THE COUNT IS DERIVED FROM THIS LIST'S LENGTH AND IS NEVER TYPED ANYWHERE. The contract this
   page was drawn from carried TWO figures for the same quantity — `38 parts · 10 new` in the
   section head and thirty entries in its data — and neither had been counted. Two figures, one
   author, and nothing comparing them: the record-and-the-work gap compressed into one component.

   ⚠ AND NINE OF ITS TWENTY "SHIPPING" PARTS DO NOT EXIST. Measured by symbol against this
   repository: `Button`, `Field`, `Field · error`, `Chip`, `Checkbox`, two `Toast` variants,
   `Breadcrumb` and a shared `EmptyState` are declared by no file. Four more — `SegmentedGroup`,
   `SaveBar`, `ListDetailLayout`, `BlogPostRow` — exist ONLY under `/studio`, which is frozen
   against the theme by construction, so mounting them here would put parts that DO NOT MOVE on a
   page whose entire claim is that everything moves. A label saying "these are frozen" would be
   doing the work the demonstration is supposed to do.

   So the kit is the parts that survived both tests, and it is smaller than the drawing. A kit of
   seven real parts is a truer artefact than a kit of thirty with nine fictions in it.

   ---- ⚠ THEMEABILITY IS A RENDER PROPERTY AND THIS FILE CANNOT MEASURE IT --------------------

   The first attempt at this census grepped components for role-token utilities and returned 41 of
   54. It called `SiteHeader`, `HeroSection`, `ProjectCard` and `ReadingVessel` UNTHEMED — four of
   the most obviously themed things on the site — because they draw through `globals.css` classes
   rather than Tailwind utilities. THAT PROBE MEASURED AUTHORING STYLE AND REPORTED IT AS
   THEMEABILITY, which is this repository's signature defect arriving inside the instrument written
   to avoid it.

   The question "does this part move when the palette moves" is answered by mounting it, pressing a
   palette, and reading the pixels. `ralph/tests/paint-sites.mjs` is that instrument and `run.mjs`
   SKIPS IT BY NAME, because it drives a browser. So the census is an output of a render pass, not
   of a build, and the page says so where the count is stated rather than implying a rigour it
   does not have.

   ---- WHAT IS AND IS NOT A PART -------------------------------------------------------------

   A part is a shipped PUBLIC component that mounts standalone from fixture props. That excludes
   three groups, each for a different reason and none of them a judgement about quality:

     providers and renderers   `SectionRenderer`, `LoveProvider`, `GSAPProvider` — they compose
                               other things and have no appearance of their own.
     page-level sections       `HeroSection`, `ContactSection` — real, themed, and a section is
                               not a part. They appear on the board in section 02 instead.
     the fixed and the global  `SiteHeader` and `ReadingVessel`. `SiteHeader` is `fixed inset-x-0`
                               with document-level listeners, so a second instance would overlay
                               the viewport and double every listener — THE PAGE'S OWN NAV IS THE
                               DEMONSTRATION, which is the argument `PaletteConsole` already made
                               and this file inherits rather than re-litigates. `ReadingVessel`
                               is fixed too and scoped to an article it needs to measure.
============================================================================================ */
import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import SectionLabel from "@/components/ui/SectionLabel";
import StatCard from "@/components/case-study/StatCard";
import PrincipleCard from "@/components/case-study/PrincipleCard";
import PullQuote from "@/components/case-study/blocks/PullQuote";
import Stepper from "@/components/case-study/blocks/Stepper";
import GlanceGrid from "@/components/case-study/blocks/GlanceGrid";
import IssueList from "@/components/case-study/blocks/IssueList";
import ClosingLine from "@/components/case-study/blocks/ClosingLine";

/** The groups a part can belong to. A filter offers these plus All, derived from the parts. */
export type KitGroup = "Content" | "Structure" | "Narrative";

export type KitPart = {
  /** The name a visitor reads. */
  name: string;
  /** The symbol a developer imports — the thing that makes this checkable against the repo. */
  symbol: string;
  /** The file it ships from, so a reader can go and look rather than take this on trust. */
  where: string;
  group: KitGroup;
  /** The roles it draws from, for the drawer. Written by hand and reviewable; see the note above
   *  about why a grep cannot produce this. */
  roles: string[];
  /** How a developer uses it. */
  usage: string;
  /**
   * Takes two grid columns.
   *
   * ⚠ THE COST OF "REAL COMPONENTS, NO FACSIMILES", PAID HERE RATHER THAN DODGED. A mock can draw a
   * section heading as three short words in a 240px box. The real one is a display-serif h2 at a
   * page measure, and in a 240px cell it wraps to eight lines and the grid goes ragged.
   *
   * ⚠ THE TEMPTING FIX IS `transform: scale()` AND IT IS THE FACSIMILE RULE WEARING A CSS PROPERTY.
   * A scaled part is not the part — the visitor would be judging type at a size the site never
   * draws, on a page whose entire claim is that this is the shipped system. Giving the part the
   * width it needs shows it truthfully; shrinking it shows a picture of it.
   */
  wide?: boolean;
  /** The mounted part itself. Real and imported — no facsimiles, which is the page's own rule. */
  render: ReactNode;
};

/* ⚠ FIXTURE CONTENT IS THIS SITE'S OWN COPY, NOT LOREM. A part rendered around invented words shows
   how it handles invented words. These lines are from the case studies the site actually ships, at
   the lengths they actually run. */
export const KIT: KitPart[] = [
  {
    name: "Section heading",
    symbol: "SectionHeading",
    wide: true,
    where: "components/ui/SectionHeading.tsx",
    group: "Structure",
    roles: ["text-primary", "accent-text", "text-subtle"],
    usage: '<SectionHeading index="01" title="…" subtext="…" />',
    render: (
      <SectionHeading
        index="01"
        title="Turning rough ideas into products people use"
        subtext="Eight years across enterprise data tools and one consumer turnaround."
      />
    ),
  },
  {
    name: "Section label",
    symbol: "SectionLabel",
    where: "components/ui/SectionLabel.tsx",
    group: "Structure",
    roles: ["text-subtle"],
    usage: "<SectionLabel>Playground · 01</SectionLabel>",
    render: <SectionLabel>Playground · 01 — Palettes</SectionLabel>,
  },
  {
    name: "Stat card",
    symbol: "StatCard",
    where: "components/case-study/StatCard.tsx",
    group: "Content",
    roles: ["surface", "accent-text", "text-primary", "text-subtle"],
    usage: "<StatCard stat={stat} />",
    render: (
      <StatCard
        stat={{
          value: "2.3 → 4.0",
          tag: "store rating",
          body: "What the boAt Crest redesign moved, drawn in whichever palette is pressed.",
        }}
      />
    ),
  },
  {
    name: "Principle card",
    symbol: "PrincipleCard",
    where: "components/case-study/PrincipleCard.tsx",
    group: "Content",
    roles: ["surface-well", "accent-text", "text-primary"],
    usage: "<PrincipleCard principle={p} />",
    render: (
      <PrincipleCard
        principle={{
          index: "02",
          title: "One surface, three personas",
          body: "Analysts, leads and admins reading the same data at different depths.",
        }}
      />
    ),
  },
  {
    name: "Pull quote",
    symbol: "PullQuote",
    wide: true,
    where: "components/case-study/blocks/PullQuote.tsx",
    group: "Narrative",
    roles: ["accent", "text-primary"],
    usage: "<PullQuote text=“…” />",
    render: <PullQuote text="A palette that only recolours a card proves nothing about the system." />,
  },
  {
    name: "Stepper",
    symbol: "Stepper",
    wide: true,
    where: "components/case-study/blocks/Stepper.tsx",
    group: "Narrative",
    roles: ["accent", "border", "text-primary", "text-secondary"],
    usage: "<Stepper steps={steps} />",
    render: (
      <Stepper
        steps={[
          { label: "Discover", text: "Ride-alongs with three analyst personas." },
          { label: "Define", text: "One surface, measured against time to insight." },
          { label: "Deliver", text: "Shipped behind a flag, then to everyone." },
        ]}
      />
    ),
  },
  {
    name: "Glance grid",
    symbol: "GlanceGrid",
    wide: true,
    where: "components/case-study/blocks/GlanceGrid.tsx",
    group: "Content",
    roles: ["accent", "text-primary", "text-secondary"],
    usage: "<GlanceGrid items={items} />",
    render: (
      <GlanceGrid
        items={[
          { label: "Role", value: "Lead product designer" },
          { label: "Platform", value: "Web, internal" },
          { label: "Timeline", value: "2024, nine months" },
        ]}
      />
    ),
  },
  {
    name: "Issue list",
    symbol: "IssueList",
    wide: true,
    where: "components/case-study/blocks/IssueList.tsx",
    group: "Narrative",
    roles: ["rule", "text-primary", "text-secondary"],
    usage: "<IssueList items={items} />",
    render: (
      <IssueList
        items={[
          { title: "Density read as noise", note: "Every row equally loud, so nothing was." },
          { title: "Filters lived three clicks away", note: "The common task was the buried one." },
        ]}
      />
    ),
  },
  {
    name: "Closing line",
    symbol: "ClosingLine",
    where: "components/case-study/blocks/ClosingLine.tsx",
    group: "Narrative",
    roles: ["accent-text", "text-primary"],
    usage: "<ClosingLine text=“…” />",
    render: <ClosingLine text="A rating is a number. Trust is what moved it." />,
  },
];

/** The filter's options, DERIVED from the parts rather than declared beside them — a declared list
 *  goes stale the moment a part changes group, and this one cannot. */
export const KIT_GROUPS: ("All" | KitGroup)[] = [
  "All",
  ...[...new Set(KIT.map((k) => k.group))].sort(),
];

/** The census. Read this; never type the number. */
export const KIT_COUNT = KIT.length;
