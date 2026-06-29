import type { Block } from "@/lib/case-studies/types";
import HeroCover from "./blocks/HeroCover";
import DeviceShelf from "./blocks/DeviceShelf";
import PullQuote from "./blocks/PullQuote";
import GlanceGrid from "./blocks/GlanceGrid";
import IssueList from "./blocks/IssueList";
import Stepper from "./blocks/Stepper";
import StatCards from "./blocks/StatCards";
import PrincipleCards from "./blocks/PrincipleCards";
import FeatureRows from "./blocks/FeatureRows";
import WorkStory from "./blocks/WorkStory";
import BeforeAfter from "./blocks/BeforeAfter";
import SwatchTokens from "./blocks/SwatchTokens";
import AnnotatedImage from "./blocks/AnnotatedImage";
import RichText from "./blocks/RichText";
import ClosingLine from "./blocks/ClosingLine";

/** Dispatch one block to its layout component. Mirrors CaseStudyBlockRenderer. */
export default function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "heroCover":
      return <HeroCover data={block} />;
    case "deviceShelf":
      return <DeviceShelf devices={block.devices} glow={block.glow} minHeight={block.minHeight} />;
    case "pullQuote":
      return <PullQuote text={block.text} />;
    case "glanceGrid":
      return <GlanceGrid items={block.items} />;
    case "issueList":
      return <IssueList items={block.items} />;
    case "stepper":
      return <Stepper steps={block.steps} />;
    case "statCards":
      return <StatCards heading={block.heading} stats={block.stats} />;
    case "principleCards":
      return <PrincipleCards heading={block.heading} subhead={block.subhead} cards={block.cards} />;
    case "featureRows":
      return <FeatureRows features={block.features} />;
    case "featureStory":
      return <WorkStory features={block.features} />;
    case "beforeAfter":
      return <BeforeAfter pairs={block.pairs} />;
    case "swatchTokens":
      return <SwatchTokens groups={block.groups} />;
    case "annotatedImage":
      return <AnnotatedImage image={block.image} scrawl={block.scrawl} callouts={block.callouts} />;
    case "richText":
      return <RichText paragraphs={block.paragraphs} />;
    case "closingLine":
      return <ClosingLine text={block.text} />;
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}
