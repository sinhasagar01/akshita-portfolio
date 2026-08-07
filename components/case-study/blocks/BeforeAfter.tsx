import type { BeforeAfterPair } from "@/lib/case-studies/types";
import DeviceImage, { isWideFrame } from "../DeviceImage";
import { LINE } from "../styles";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `.bacard` — before→after device pairs with a change list; alternates side. */
export default function BeforeAfter({
  pairs,
  editable = false,
  blockIndex,
}: {
  pairs: BeforeAfterPair[];
  /** CS-7e — studio inline canvas: make each before/after image replaceable. */
  editable?: boolean;
  blockIndex?: number;
}) {
  const aff = editable ? EDIT_AFFORD : "";
  const edit = (path: string, label: string) => inlineEditProps(editable, blockIndex, path, label);
  return (
    <div className="flex flex-col gap-[18px]">
      {pairs.map((p, i) => {
        // CS-6c — two wide (browser / MacBook) frames plus a change list can't share
        // one row, so a wide pair stacks: the before/after sit side-by-side at
        // half-width above the change list. A phone pair keeps the beside-text row
        // byte-identically.
        const wide = isWideFrame(p.after.frame) || isWideFrame(p.before.frame);
        return (
        <div
          key={i}
          className={
            wide
              ? "reveal-card flex flex-col items-center gap-9 rounded-xl border bg-surface p-8"
              : `reveal-card flex flex-col items-center gap-9 rounded-xl border bg-surface p-8 lg:flex-row lg:items-center lg:gap-12 ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`
          }
          style={{ borderColor: LINE }}
        >
          {/* Before → After pair */}
          <div
            className={
              wide
                ? "flex w-full items-start justify-center gap-6"
                : "flex shrink-0 items-center justify-center gap-4"
            }
          >
            <figure
              className={
                wide
                  ? "flex min-w-0 flex-1 flex-col items-center gap-2"
                  : "flex flex-col items-center gap-2"
              }
            >
              <figcaption className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-text-subtle">
                Before
              </figcaption>
              <DeviceImage
                image={p.before}
                className="grayscale-[0.2]"
                editable={editable}
                blockIndex={blockIndex}
                editPath={`pairs.${i}.before`}
              />
            </figure>
            <span aria-hidden="true" className="text-accent-500 text-2xl font-display">
              →
            </span>
            <figure
              className={
                wide
                  ? "flex min-w-0 flex-1 flex-col items-center gap-2"
                  : "flex flex-col items-center gap-2"
              }
            >
              <figcaption className="text-eyebrow tracking-[0.14em] uppercase font-semibold text-accent-500">
                After
              </figcaption>
              <DeviceImage
                image={p.after}
                editable={editable}
                blockIndex={blockIndex}
                editPath={`pairs.${i}.after`}
              />
            </figure>
          </div>

          {/* Change list */}
          <div className={wide ? "w-full" : "flex-1"}>
            <h3
              {...edit(`pairs.${i}.title`, "Edit pair title")}
              className={`font-display font-normal text-2xl text-text-primary leading-[1.1]${aff}`}
            >
              {p.title}
            </h3>
            <p
              {...edit(`pairs.${i}.tag`, "Edit pair tag")}
              className={`text-eyebrow tracking-[0.14em] uppercase font-semibold text-text-subtle mt-1.5${aff}`}
            >
              {p.tag}
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {p.changes.map((c, ci) => (
                <li key={ci} className="flex items-baseline gap-2.5">
                  <span aria-hidden="true" className="mt-1.5 size-[6px] shrink-0 rounded-full bg-accent-500" />
                  <span className="text-[0.95rem] text-text-secondary leading-[1.5]">
                    <b
                      {...edit(`pairs.${i}.changes.${ci}.emphasis`, "Edit change emphasis")}
                      className={`font-bold text-text-primary${aff}`}
                    >
                      {c.emphasis}
                    </b>{" "}
                    {/* Wrapped ONLY when editable, so the public markup keeps `rest`
                        as the bare text node it is today. */}
                    {editable ? (
                      <span
                        {...edit(`pairs.${i}.changes.${ci}.rest`, "Edit change text")}
                        className={aff}
                      >
                        {c.rest}
                      </span>
                    ) : (
                      c.rest
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        );
      })}
    </div>
  );
}
