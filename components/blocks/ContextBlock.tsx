import Container from "@/components/layout/Container";
import Grid from "@/components/layout/Grid";
import SectionWrapper from "@/components/layout/SectionWrapper";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/motion/Reveal";
import CaseStudyDocumentRenderer from "@/components/blocks/CaseStudyDocumentRenderer";
import type { ContextBlockData } from "@/lib/keystatic";

type Props = { data: ContextBlockData["value"] };

export default function ContextBlock({ data }: Props) {
  if (!data.body.length) return null;

  return (
    <SectionWrapper className="">
      <Container>
        <Grid cols={12}>
          <Reveal className="col-span-4 md:col-span-3">
            <SectionLabel>Context</SectionLabel>
          </Reveal>
          <Reveal delay={0.05} className="col-span-4 md:col-span-8 md:col-start-5">
            <CaseStudyDocumentRenderer document={data.body as Parameters<typeof CaseStudyDocumentRenderer>[0]["document"]} />
          </Reveal>
        </Grid>
      </Container>
    </SectionWrapper>
  );
}
