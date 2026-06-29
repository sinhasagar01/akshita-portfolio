import type { Metadata } from "next";
import CaseStudyView from "@/components/case-study/CaseStudyView";
import { boatCrest } from "@/lib/case-studies/boat-crest";

export const metadata: Metadata = {
  title: boatCrest.title,
  description: boatCrest.description,
};

export default function BoatCrestPage() {
  return <CaseStudyView study={boatCrest} />;
}
