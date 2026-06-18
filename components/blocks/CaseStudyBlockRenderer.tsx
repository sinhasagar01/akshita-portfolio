import type { CaseStudyBlock } from "@/lib/keystatic";
import HeroBlock from "@/components/blocks/HeroBlock";
import SummaryGridBlock from "@/components/blocks/SummaryGridBlock";
import ImpactNumbersBlock from "@/components/blocks/ImpactNumbersBlock";
import ContextBlock from "@/components/blocks/ContextBlock";
import ProblemBlock from "@/components/blocks/ProblemBlock";
import GoalsBlock from "@/components/blocks/GoalsBlock";
import ProcessStepsBlock from "@/components/blocks/ProcessStepsBlock";
import KeyInsightsBlock from "@/components/blocks/KeyInsightsBlock";
import SolutionRevealBlock from "@/components/blocks/SolutionRevealBlock";
import GuidedDesignStepBlock from "@/components/blocks/GuidedDesignStepBlock";
import ImageGalleryBlock from "@/components/blocks/ImageGalleryBlock";
import ComparisonBlock from "@/components/blocks/ComparisonBlock";
import QuoteBlock from "@/components/blocks/QuoteBlock";
import ReflectionBlock from "@/components/blocks/ReflectionBlock";
import ClosingLineBlock from "@/components/blocks/ClosingLineBlock";

type Props = { block: CaseStudyBlock };

export default function CaseStudyBlockRenderer({ block }: Props) {
  switch (block.discriminant) {
    case "heroBlock":
      return <HeroBlock data={block.value} />;
    case "summaryGrid":
      return <SummaryGridBlock data={block.value} />;
    case "impactNumbers":
      return <ImpactNumbersBlock data={block.value} />;
    case "context":
      return <ContextBlock data={block.value} />;
    case "problem":
      return <ProblemBlock data={block.value} />;
    case "goals":
      return <GoalsBlock data={block.value} />;
    case "processSteps":
      return <ProcessStepsBlock data={block.value} />;
    case "keyInsights":
      return <KeyInsightsBlock data={block.value} />;
    case "solutionReveal":
      return <SolutionRevealBlock data={block.value} />;
    case "guidedDesignStep":
      return <GuidedDesignStepBlock data={block.value} />;
    case "imageGallery":
      return <ImageGalleryBlock data={block.value} />;
    case "comparison":
      return <ComparisonBlock data={block.value} />;
    case "quote":
      return <QuoteBlock data={block.value} />;
    case "reflection":
      return <ReflectionBlock data={block.value} />;
    case "closingLine":
      return <ClosingLineBlock data={block.value} />;
    default:
      return null;
  }
}
