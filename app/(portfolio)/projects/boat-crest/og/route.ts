import { boatCrest } from "@/lib/case-studies/boat-crest";
import { renderOgImage } from "@/lib/og";

// Stable OG-card URL for the bespoke route, mirroring the dynamic `[slug]/og` handler.
export async function GET() {
  return renderOgImage({
    eyebrow: "Case study",
    title: boatCrest.title,
    subtitle: boatCrest.thesis,
  });
}
