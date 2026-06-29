import type { Rich } from "@/lib/case-studies/types";
import { renderRich } from "../rich";

/** Body prose — one or more paragraphs of rich text. */
export default function RichText({ paragraphs }: { paragraphs: Rich[] }) {
  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-lg text-ink-600 leading-relaxed max-w-[68ch]"
        >
          {renderRich(p)}
        </p>
      ))}
    </div>
  );
}
