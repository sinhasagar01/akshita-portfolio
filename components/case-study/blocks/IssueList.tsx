import { LINE } from "../styles";

type Props = { items: { title: string; note: string }[] };

/** `.ilist` — numbered issue rows with hairline rules. */
export default function IssueList({ items }: Props) {
  return (
    <ol className="m-0 list-none border-t p-0" style={{ borderColor: LINE }}>
      {items.map((it, i) => (
        <li
          key={i}
          className="reveal-card flex items-baseline gap-4 border-b py-4"
          style={{ borderColor: LINE }}
        >
          <span className="font-display italic text-accent-500 text-[1.0625rem] w-6 shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <b className="block text-[1.0625rem] font-bold text-ink-950">{it.title}</b>
            <span className="block text-[0.875rem] text-ink-600 leading-[1.4] mt-0.5">
              {it.note}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
