import type { Block } from "@/lib/case-studies/types";
import HeroCover from "./blocks/HeroCover";
import DeviceShelf from "./blocks/DeviceShelf";
import PullQuote from "./blocks/PullQuote";
import GlanceGrid from "./blocks/GlanceGrid";
import IssueList from "./blocks/IssueList";
import Stepper from "./blocks/Stepper";
import StatCards from "./blocks/StatCards";
import PrincipleCards from "./blocks/PrincipleCards";
import FigureGrid from "./blocks/FigureGrid";
import FeatureRows from "./blocks/FeatureRows";
import WorkStory from "./blocks/WorkStory";
import BeforeAfter from "./blocks/BeforeAfter";
import BeforeAfterStory from "./blocks/BeforeAfterStory";
import SwatchTokens from "./blocks/SwatchTokens";
import AnnotatedImage from "./blocks/AnnotatedImage";
import RichText from "./blocks/RichText";
import VideoEmbed from "./blocks/VideoEmbed";
import ClosingLine from "./blocks/ClosingLine";

/** Dispatch one block to its layout component — the one block dispatch every
 *  case study renders through (P4 3(d) deleted the legacy generic renderer).
 *  CS-7b — `web` (template=web) is threaded in here so each block can opt into its
 *  Bold-gallery treatment; the per-block treatments wire it into their cases as they
 *  land. Absent/false → the existing mobile render, byte-identical. */
export default function BlockRenderer({
  block,
  web = false,
  editable = false,
  blockIndex,
  heroGlow,
}: {
  block: Block;
  web?: boolean;
  /** CS-7d — studio inline canvas: opt the block's plain-string text into in-place
   *  editing. `blockIndex` is the block's position in its section, which the studio
   *  maps to the stable block id for setBlockValue. Off by default → public unchanged. */
  editable?: boolean;
  blockIndex?: number;
  /** The per-study behind-the-phones hero glow theme, only consumed by heroCover. */
  heroGlow?: "pulse" | "signal";
}) {
  switch (block.kind) {
    case "heroCover":
      return <HeroCover data={block} editable={editable} blockIndex={blockIndex} heroGlow={heroGlow} />;
    case "deviceShelf":
      return (
        <DeviceShelf
          devices={block.devices}
          glow={block.glow}
          minHeight={block.minHeight}
          web={web}
          editable={editable}
          blockIndex={blockIndex}
        />
      );
    case "pullQuote":
      return <PullQuote text={block.text} web={web} editable={editable} blockIndex={blockIndex} />;
    case "glanceGrid":
      return <GlanceGrid items={block.items} web={web} editable={editable} blockIndex={blockIndex} />;
    case "issueList":
      return <IssueList items={block.items} />;
    case "stepper":
      return <Stepper steps={block.steps} web={web} editable={editable} blockIndex={blockIndex} />;
    case "statCards":
      return <StatCards heading={block.heading} stats={block.stats} web={web} editable={editable} blockIndex={blockIndex} />;
    case "principleCards":
      return <PrincipleCards heading={block.heading} subhead={block.subhead} cards={block.cards} web={web} editable={editable} blockIndex={blockIndex} />;
    case "figureGrid":
      return (
        <FigureGrid
          heading={block.heading}
          items={block.items}
          editable={editable}
          blockIndex={blockIndex}
        />
      );
    /* ⚠ ONE CASE, DISPATCHED ON THE VARIANT. `featureStory` was a separate case carrying the
       identical payload. `variant` is absent on every `featureRows` written before this, so the
       `=== "story"` test — rather than `=== "rows"` — is what makes ABSENT mean rows. Inverting it
       would silently restyle the three shipped blocks across the other three case studies. */
    case "featureRows":
      return block.variant === "story" ? (
        <WorkStory features={block.features} editable={editable} blockIndex={blockIndex} />
      ) : (
        <FeatureRows features={block.features} editable={editable} blockIndex={blockIndex} />
      );
    case "beforeAfter":
      return <BeforeAfter pairs={block.pairs} editable={editable} blockIndex={blockIndex} />;
    case "beforeAfterStory":
      return (
        <BeforeAfterStory
          index={block.index}
          eyebrow={block.eyebrow}
          title={block.title}
          lead={block.lead}
          rating={block.rating}
          pairs={block.pairs}
        />
      );
    case "swatchTokens":
      return <SwatchTokens groups={block.groups} />;
    case "annotatedImage":
      return (
        <AnnotatedImage
          image={block.image}
          scrawl={block.scrawl}
          callouts={block.callouts}
          editable={editable}
          blockIndex={blockIndex}
        />
      );
    case "richText":
      return <RichText paragraphs={block.paragraphs} web={web} editable={editable} blockIndex={blockIndex} />;
    case "closingLine":
      return <ClosingLine text={block.text} web={web} editable={editable} blockIndex={blockIndex} />;
    case "videoEmbed":
      return (
        <VideoEmbed
          src={block.src}
          poster={block.poster}
          caption={block.caption}
          frame={block.frame}
          aspect={block.aspect}
          eyebrow={block.eyebrow}
          title={block.title}
        />
      );
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}
