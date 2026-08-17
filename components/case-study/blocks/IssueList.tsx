import { LINE } from "../styles";

type Props = { items: { title: string; note: string }[] };

/** `.ilist` — numbered issue rows with hairline rules. A SCHEDULE, which is why the index takes the
 *  mono label register: a printed schedule numbers its rows in the lettering face, small and
 *  tracked, and never in a display italic.
 *
 *  ⚠ AND THE INDEX WAS ON THE ACCENT, WHICH IS NONE OF THE SANCTIONED FOUR. It was 17px display
 *  italic in `text-accent` beside a 17px bold title — colour and slant together saying "this is a
 *  number", where register and case say it without spending either. `sheet-mono-label` carries the
 *  mark colour, so the row's hierarchy now rides on things that survive a change of ground.
 *
 *  THE HAIRLINES ARE DELIBERATELY UNTOUCHED. `LINE` is shared by every block in this template, so
 *  moving it to the grammar's three line weights is one change across the whole template rather
 *  than a detail of this file. */
export default function IssueList({ items }: Props) {
  return (
    <ol className="m-0 list-none border-t p-0" style={{ borderColor: LINE }}>
      {items.map((it, i) => (
        <li
          key={i}
          className="reveal-card flex items-baseline gap-4 border-b py-4"
          style={{ borderColor: LINE }}
        >
          <span className="sheet-mono-label w-6 shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span>
            <b className="block text-[1.0625rem] font-bold text-text-primary">{it.title}</b>
            <span className="block text-[0.875rem] text-text-secondary leading-[1.4] mt-0.5">
              {it.note}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
