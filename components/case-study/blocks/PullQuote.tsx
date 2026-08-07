import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `.pull` — left-bar italic pull quote. Under template=web (CS-7b) the Bold-gallery
 *  serif quote: `dark` renders it on the dark band (on-dark-quote), otherwise the
 *  inline light serif (accent). Mobile keeps the left-bar quote, byte-identically.
 *  CS-7d — `editable` tags the plain-string text as in-place editable in the studio
 *  canvas (inert markers + contentEditable); off by default, so public is unchanged. */
export default function PullQuote({
  text,
  web = false,
  dark = false,
  editable = false,
  blockIndex,
}: {
  text: string;
  web?: boolean;
  dark?: boolean;
  editable?: boolean;
  blockIndex?: number;
}) {
  const edit = inlineEditProps(editable, blockIndex, "text", "Edit pull quote");
  const aff = editable ? EDIT_AFFORD : "";
  if (web && dark) {
    return (
      <p
        {...edit}
        className={`font-display italic font-normal text-[clamp(1.5rem,2.6vw,1.875rem)] text-on-dark-quote leading-[1.35] max-w-[720px]${aff}`}
      >
        {text}
      </p>
    );
  }
  if (web) {
    return (
      <p
        {...edit}
        className={`font-display italic font-normal text-[clamp(1.375rem,2.4vw,1.75rem)] text-accent-600 leading-[1.3] max-w-[760px]${aff}`}
      >
        {text}
      </p>
    );
  }
  return (
    <p
      {...edit}
      className={`relative font-display italic font-normal text-[34px] text-text-primary leading-[1.22] max-w-[880px] pl-7${aff}`}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-sm bg-accent-500"
      />
      {text}
    </p>
  );
}
