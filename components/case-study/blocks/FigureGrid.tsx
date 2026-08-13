import Image from "next/image";
import { ILLUSTRATIONS, isIllustrationId } from "../illustrations";
import type { FigureItem } from "@/lib/case-studies/types";
import { renderRich } from "../rich";
import { LINE } from "../styles";
import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `figureGrid` — plain, frameless illustrations and diagrams (NOT product-in-a-device
 *  screenshots, so it never touches the device/frame system). A single item renders as
 *  one centred captioned figure; two to four render as a responsive card grid. Each
 *  image sits `object-contain` on a cream card so mixed aspects (wide diagrams, square
 *  metric shots) all read tidily. */
export default function FigureGrid({
  heading,
  items,
  editable = false,
  blockIndex,
}: {
  heading?: string;
  items: FigureItem[];
  /** CS-7e — studio inline canvas: make each figure image replaceable. */
  editable?: boolean;
  blockIndex?: number;
}) {
  const single = items.length === 1;
  const aff = editable ? EDIT_AFFORD : "";
  const edit = (path: string, label: string, rich = false) =>
    inlineEditProps(editable, blockIndex, path, label, rich);
  return (
    <div>
      {heading && (
        <h3
          {...edit("heading", "Edit figure grid heading")}
          className={`font-display italic font-normal text-3xl text-text-primary leading-[1.15]${aff}`}
        >
          {heading}
        </h3>
      )}
      <div
        className={
          single
            ? `mx-auto max-w-[760px] ${heading ? "mt-7" : ""}`
            : `grid grid-cols-1 gap-6 sm:grid-cols-2 ${heading ? "mt-7" : ""}`
        }
      >
        {items.map((it, i) => (
          <figure key={i} className={single ? "reveal-card" : "reveal-card flex flex-col"}>
            <Frame
              item={it}
              aspect={single ? "16 / 10" : "4 / 3"}
              sizes={single ? "(max-width: 1023px) 90vw, 760px" : "(max-width: 1023px) 90vw, 380px"}
              editable={editable}
              blockIndex={blockIndex}
              editPath={`items.${i}.image`}
            />
            {(it.title || it.body) && (
              <figcaption className={single ? "mt-5 text-center" : "mt-4"}>
                {it.title && (
                  <div
                    {...edit(`items.${i}.title`, "Edit figure title")}
                    className={`font-display font-normal text-xl text-text-primary leading-[1.15]${aff}`}
                  >
                    {it.title}
                  </div>
                )}
                {it.body && (
                  <div
                    {...edit(`items.${i}.body`, "Edit figure body", true)}
                    className={`text-[0.95rem] text-text-secondary leading-[1.55] ${it.title ? "mt-2" : ""}${aff}`}
                  >
                    {renderRich(it.body)}
                  </div>
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** The framed image cell. Content-path images have no intrinsic dimensions, so the
 *  image fills a fixed-aspect card (`object-contain`, cream backdrop) — CLS-safe and
 *  uniform across mixed source aspects. Adds the studio Replace affordance when editable. */
function Frame({
  item,
  aspect,
  sizes,
  editable,
  blockIndex,
  editPath,
}: {
  item: FigureItem;
  aspect: string;
  sizes: string;
  editable: boolean;
  blockIndex?: number;
  editPath: string;
}) {
  // ADDITIVE ONLY, same rule as DeviceImage: the markers and the button go on the
  // element that is ALREADY position:relative rather than into a new wrapper, so the
  // editable render adds an out-of-flow button and changes no box in the layout.
  return (
    <span
      {...(editable
        ? { "data-edit-block-index": blockIndex, "data-edit-image-path": editPath }
        : {})}
      className="relative block w-full overflow-hidden rounded-xl border bg-surface-well"
      {...(editable || item.image.preview === false
        ? {}
        : { "data-preview-src": item.image.src, "data-preview-alt": item.image.alt })}
      style={{ borderColor: LINE, aspectRatio: aspect }}
    >
      {/* ⚠ THE ILLUSTRATION BRANCH IS ADDITIVE AND SITS INSIDE THE EXISTING BOX. It replaces what is
          PAINTED, never the frame — same rule as the editable affordances, so a figure with an
          illustration and a figure with an image occupy identical geometry and the parity check
          cannot tell them apart by layout. An unknown id falls through to the raster, which is why
          the content keeps `image` alongside. */}
      {item.illustration && isIllustrationId(item.illustration) ? (
        (() => {
          const Art = ILLUSTRATIONS[item.illustration];
          return (
            <span className="absolute inset-0 block p-[6%]">
              <Art />
            </span>
          );
        })()
      ) : (
        <Image src={item.image.src} alt={item.image.alt} fill sizes={sizes} className="object-contain" unoptimized={item.image.unoptimized} />
      )}
      {editable && (
        <button
          type="button"
          data-edit-image-replace
          aria-label="Replace image"
          className="absolute right-2 top-2 z-[20] rounded-full bg-accent px-2.5 py-1 text-[12px] font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
        >
          Replace image
        </button>
      )}
    </span>
  );
}
