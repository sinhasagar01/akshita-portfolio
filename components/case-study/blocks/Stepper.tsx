import { LINE } from "../styles";

type Props = { steps: { label: string; text: string }[]; web?: boolean };

/** `.stepper` — process steps in a bordered row; stacks at the mobile breakpoint.
 *  Under template=web (CS-7b), a clean web-native list: each step's label is a serif
 *  accent heading over its text, separated by hairline rules, no bordered grid or dot.
 *  Mobile renders the bordered grid, byte-identically. */
export default function Stepper({ steps, web = false }: Props) {
  if (web) {
    return (
      <div className="flex flex-col">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className={`reveal-card grid gap-x-8 gap-y-1 py-6 sm:grid-cols-[minmax(0,14rem)_1fr] ${
              i > 0 ? "border-t" : ""
            }`}
            style={{ borderColor: LINE }}
          >
            <h3 className="font-display text-2xl font-normal text-accent-600 leading-[1.1]">
              {s.label}
            </h3>
            <p className="text-[1rem] text-ink-600 leading-[1.6] max-w-[56ch]">{s.text}</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-lg border bg-cream-50 lg:grid-cols-4"
      style={{ borderColor: LINE }}
    >
      {steps.map((s, i) => (
        <div
          key={s.label}
          className={`reveal-card p-6 ${i < steps.length - 1 ? "border-b lg:border-b-0 lg:border-r" : ""}`}
          style={{ borderColor: LINE }}
        >
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-[9px] shrink-0 rounded-full bg-accent-500" />
            <span className="font-display italic text-[1.1875rem] text-ink-950">{s.label}</span>
          </div>
          <p className="text-[0.84rem] text-ink-600 leading-[1.45] mt-2.5">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
