import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `.pull` — left-bar italic pull quote. Under template=web (CS-7b) the Bold-gallery
 *  serif quote: `dark` renders it on the dark band (on-dark-quote), otherwise the
 *  inline light serif (accent). Mobile keeps the left-bar quote, byte-identically.
 *
 *  ---- ⚠ THIS `dark` BRANCH IS THE ACCEPTANCE TEST FOR THE GROUND SWITCH ---------------------
 *
 *  It is the one true violation of the rule that a COMPONENT MUST NOT CHOOSE: the context should
 *  select which values a token name resolves to, and the component should read one name. Here the
 *  component reads two, and picks by the ground.
 *
 *  ⚠ AND IT CANNOT BE FIXED YET, WHICH IS WHY IT IS RECORDED RATHER THAN FORCED. The mechanism it
 *  needs does not exist: the dark hero band is applied INLINE, `style={{ backgroundColor:
 *  var(--color-band-dark) }}` in `SectionRenderer`, with no context attribute to hang a per-ground
 *  override on. Collapsing the branches today would repaint the band's quote, because
 *  `on-dark-quote` and `accent-600` are genuinely different colours and both are correct where they
 *  are.
 *
 *  ⚠ SO WHEN THE GROUND SWITCH LANDS, THIS COLOUR BRANCH MUST DISAPPEAR. If it cannot, shape C has
 *  failed and that should be SAID rather than patched — the owner named that trigger when the
 *  ruling was made. The SIZE difference between the branches is a separate question: the two web
 *  variants also differ in type scale, and that is a layout variant rather than a ground fact.
 *
 *  `SectionHeading`'s `tone` prop looks like the same defect and is NOT one — it means accent-toned
 *  or ink-toned, both follow the theme, and six call sites use it deliberately. The difference is
 *  that `tone` chooses a DESIGN AXIS and `dark` chooses a GROUND.
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
