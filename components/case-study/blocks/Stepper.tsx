import { LINE } from "../styles";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

type Props = {
  steps: { label: string; text: string }[];
  web?: boolean;
  /** CS-7d (extended) — tag label/text as in-place editable in the studio canvas. */
  editable?: boolean;
  blockIndex?: number;
};

/** `.stepper` — process steps in a bordered row; stacks at the mobile breakpoint.
 *  Under template=web (CS-7b), a clean web-native list: each step's label is a serif
 *  accent heading over its text, separated by hairline rules, no bordered grid or dot.
 *  Mobile renders the bordered grid, byte-identically. */
export default function Stepper({ steps, web = false, editable = false, blockIndex }: Props) {
  const aff = editable ? EDIT_AFFORD : "";
  if (web) {
    return (
      <div className="flex flex-col">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`reveal-card grid gap-x-8 gap-y-1 py-6 sm:grid-cols-[minmax(0,14rem)_1fr] ${
              i > 0 ? "border-t" : ""
            }`}
            style={{ borderColor: LINE }}
          >
            <h3
              {...inlineEditProps(editable, blockIndex, `steps.${i}.label`, "Edit step label")}
              /* ⚠ A STAGE NAME, AND THE HOME PAGE ALREADY SHIPPED THE ANSWER. `ProcessSection` draws
                 its stage as `sheet-mono-label` over `sheet-h3`, so a process step's name is the
                 STUDY role — the same construction, one page over.

                 THE ACCENT GOES. A stage name is none of the direction's four sanctioned uses, and
                 the mobile branch below never used it, so the two branches were disagreeing about
                 colour as well as slant. */
              className={`sheet-h3${aff}`}
            >
              {s.label}
            </h3>
            <p
              {...inlineEditProps(editable, blockIndex, `steps.${i}.text`, "Edit step text")}
              className={`text-[1rem] text-text-secondary leading-[1.6] max-w-[56ch]${aff}`}
            >
              {s.text}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-lg border bg-surface lg:grid-cols-4"
      style={{ borderColor: LINE }}
    >
      {steps.map((s, i) => (
        <div
          key={i}
          className={`reveal-card p-6 ${i < steps.length - 1 ? "border-b lg:border-b-0 lg:border-r" : ""}`}
          style={{ borderColor: LINE }}
        >
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-[9px] shrink-0 rounded-full bg-accent" />
            <span
              {...inlineEditProps(editable, blockIndex, `steps.${i}.label`, "Edit step label")}
              /* ⚠ THE SAME STAGE NAME IN A NARROWER BOX, AND IT IS NOT `sheet-h3`. The web branch
                 above sets this label across a full row; here it sits in one cell of a four-column
                 grid, roughly 200px of content at desktop, over a 13.4px sentence. `sheet-h3` clamps
                 on the VIEWPORT rather than the container, so a 200px cell would get the same 31px a
                 full-width row gets, and "Discover" would set at nearly twice its own column's body.

                 A CLAMP IS A VIEWPORT MEASUREMENT AND THIS IS A CONTAINER PROBLEM — which is why the
                 role is right one branch up and wrong here rather than right in both.
                 `sheet-mono-label` is the register that fits a cell this size, and the render is what
                 settled it: a dot, a tracked mono phrase, a sentence, reading as a schedule row.

                 ⚠ AND THE LABELS ARE PHRASES RATHER THAN WORDS, WHICH I ASSUMED WRONG BEFORE LOOKING.
                 They run to `PRODUCT PLANNING AND REQUIREMENT GATHERING` — four to five words, two
                 lines in a 240px cell. That is fine at this register and it would have been absurd at
                 the STUDY role's 31px, so the measurement strengthened the choice rather than
                 changing it. Recorded because the first draft of this note argued from "one word".

                 ⚠ SO THE TWO BRANCHES DELIBERATELY DIVERGE, WHICH IS THE OPPOSITE OF THE LAST THREE
                 UNITS AND IS STATED SO IT IS NOT "FIXED" LATER. The hero and the principle card each
                 had two branches doing ONE job at two sizes for no reason. Here the two branches do
                 one job in two BOXES, and a role that ignores the box is not a shared answer. */
              className={`sheet-mono-label${aff}`}
            >
              {s.label}
            </span>
          </div>
          <p
            {...inlineEditProps(editable, blockIndex, `steps.${i}.text`, "Edit step text")}
            className={`text-[0.84rem] text-text-secondary leading-[1.45] mt-2.5${aff}`}
          >
            {s.text}
          </p>
        </div>
      ))}
    </div>
  );
}
