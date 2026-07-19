import type { Rich } from "@/lib/case-studies/types";
import { renderRich } from "../rich";

/** Body prose — one or more paragraphs of rich text. Under template=web (CS-7b), a
 *  slightly larger, wider editorial measure; mobile is byte-identical. */
export default function RichText({ paragraphs, web = false }: { paragraphs: Rich[]; web?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={
            web
              ? "text-xl text-ink-600 leading-relaxed max-w-[74ch]"
              : "text-lg text-ink-600 leading-relaxed max-w-[68ch]"
          }
        >
          {renderRich(p)}
        </p>
      ))}
    </div>
  );
}
