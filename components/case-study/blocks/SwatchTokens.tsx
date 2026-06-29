import { Fragment } from "react";
import type { TokenGroup } from "@/lib/case-studies/types";
import { LINE } from "../styles";

/**
 * `.toks` — swatch and type chips. Colour values are literal product-palette hex
 * (boAt Red, semantic metric colours), intentionally NOT mapped to site tokens.
 */
export default function SwatchTokens({ groups }: { groups: TokenGroup[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-5">
      {groups.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && (
            <span aria-hidden="true" className="hidden h-8 w-px sm:block" style={{ background: LINE }} />
          )}
          {group.tokens.map((t, ti) =>
            t.type === "color" ? (
              <div key={ti} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="size-[34px] shrink-0 rounded-[10px]"
                  style={{ background: t.value, boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4)" }}
                />
                <span>
                  <b className="text-[0.9rem] font-bold text-ink-950">{t.name}</b>
                  {t.hex && (
                    <span className="ml-1.5 font-mono text-[0.78rem] text-text-subtle">{t.hex}</span>
                  )}
                </span>
              </div>
            ) : (
              <div key={ti}>
                <b className="text-[0.9rem] font-bold text-ink-950">{t.name}</b>
                <span className="ml-1.5 text-[0.78rem] text-text-subtle">{t.note}</span>
              </div>
            ),
          )}
        </Fragment>
      ))}
    </div>
  );
}
