import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** A warm italic closing statement. Under template=web (CS-7b), the Bold-gallery
 *  closing: the same serif line, centered. Mobile is left-aligned, byte-identically.
 *  CS-7d — `editable` tags the plain-string text as in-place editable in the studio
 *  canvas; off by default, so the public render is byte-identical. */
export default function ClosingLine({
  text,
  web = false,
  editable = false,
  blockIndex,
}: {
  text: string;
  web?: boolean;
  editable?: boolean;
  blockIndex?: number;
}) {
  const edit = inlineEditProps(editable, blockIndex, "text", "Edit closing line");
  const aff = editable ? EDIT_AFFORD : "";
  if (web) {
    return (
      <p
        {...edit}
        className={`font-display italic font-normal text-[34px] text-accent-text leading-[1.3] max-w-[34ch] mx-auto text-center${aff}`}
      >
        {text}
      </p>
    );
  }
  return (
    <p
      {...edit}
      className={`font-display italic font-normal text-[34px] text-accent-text leading-[1.3] max-w-[34ch]${aff}`}
    >
      {text}
    </p>
  );
}
