import type { Rich } from "@/lib/case-studies/types";
import { renderRich } from "../rich";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

type Props = {
  paragraphs: Rich[];
  web?: boolean;
  editable?: boolean;
  blockIndex?: number;
};

/** Body prose — one or more paragraphs of rich text. Under template=web (CS-7b), a
 *  slightly larger, wider editorial measure; mobile is byte-identical.
 *
 *  Each paragraph is its own array item AND its own editable field, addressed as
 *  `paragraphs.<i>`. Enter and Backspace at a boundary are STRUCTURAL — the panel
 *  intercepts them and rewrites the array — so what lands on disk stays one string per
 *  paragraph, never newlines smuggled inside a single item. */
export default function RichText({
  paragraphs,
  web = false,
  editable = false,
  blockIndex,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          {...inlineEditProps(editable, blockIndex, `paragraphs.${i}`, "Edit paragraph", true)}
          className={
            (web
              ? "text-xl text-ink-600 leading-relaxed max-w-[74ch]"
              : "text-lg text-ink-600 leading-relaxed max-w-[68ch]") +
            (editable ? EDIT_AFFORD : "")
          }
        >
          {renderRich(p)}
        </p>
      ))}
    </div>
  );
}
