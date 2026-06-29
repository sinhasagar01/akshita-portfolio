import { LINE } from "../styles";

type Props = { steps: { label: string; text: string }[] };

/** `.stepper` — process steps in a bordered row; stacks at the mobile breakpoint. */
export default function Stepper({ steps }: Props) {
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
