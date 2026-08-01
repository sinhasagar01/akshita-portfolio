// Canvas-vs-live parity harness. DEV ONLY — middleware 404s /dev in production.
//
// WHAT IT PINS. The studio canvas and the public page render through the same
// components; they differ in exactly two flags, `editable` and `noReveal`. Every
// mismatch this project has hit came from one of them changing the LAYOUT rather
// than just adding an affordance:
//
//   - `.reveal-card` sat at opacity 0 with no `.is-revealed` ancestor, so nine block
//     kinds that rendered but were never seen in the canvas.
//   - the Replace-image wrapper inserted a box into the layout chain, collapsing a
//     760px dashboard frame to about 90px.
//
// Both were unseen by every check we had, because those all compared PUBLIC to
// PUBLIC. The missing axis was public-vs-canvas.
//
// WHY BOTH RENDERS SIT ON ONE PAGE. Comparing /studio to /projects/<slug> means
// comparing two different documents at two different scroll positions with two
// different scrollbars — which is how a hand-rolled version of this produced ten
// false positives. Rendering the same section twice in one document, at one width,
// makes the only variable the flags themselves.
//
// The parity script (ralph/tests/parity.mjs) walks the pairs and diffs the geometry
// of corresponding elements.
import { notFound } from "next/navigation";
import { getCaseStudyData } from "@/lib/keystatic";
import { adaptSections } from "@/lib/case-studies/adapter";
import SectionRenderer from "@/components/case-study/SectionRenderer";

export const metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function ParityHarness({ params }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await params;
  const data = await getCaseStudyData(slug);
  if (!data) notFound();

  // preview mode both times: the point is to vary `editable`/`noReveal` alone, not to
  // re-test the adapter's fail-loud behaviour, which its own unit suite covers.
  const sections = adaptSections(data.rawSections, {
    mode: "preview",
    template: data.template,
  });
  const web = data.template === "web";

  return (
    <main className="case-study-bg">
      {sections.map((section, i) => (
        <section key={i} data-parity-pair={i} data-parity-section={section.id ?? `section-${i}`}>
          {/* The two sides carry IDENTICAL wrapper markup on purpose. The walk
              compares elements by position, so one extra <article> on one side
              shifts every subsequent comparison and turns a clean run into hundreds
              of phantom mismatches. Page chrome (container-x, the backdrop) is
              held constant here; it is not what this harness is testing.

              The only variables are the two flags. */}
          <div data-parity-side="live" className="case-study container-x">
            <SectionRenderer section={section} web={web} />
          </div>

          {/* CANVAS — what SectionCanvas renders, minus its scale transform, which is
              a deliberate studio-only zoom rather than a layout difference and would
              otherwise offset every measurement by a constant factor. */}
          <div data-parity-side="canvas" className="case-study canvas-static container-x">
            <SectionRenderer section={section} web={web} noReveal editable />
          </div>
        </section>
      ))}
    </main>
  );
}
