import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `.pull` — left-bar italic pull quote. Under template=web (CS-7b) the Bold-gallery
 *  serif quote: the BAND variant renders on the dark quote band, otherwise the inline
 *  light serif (accent). Mobile keeps the left-bar quote, byte-identically.
 *
 *
 *  ---- ⚠ THE ACCEPTANCE TEST FIRED, AND IT PASSED --------------------------------------------
 *
 *  This carried a `dark` prop and picked its colour from it — the one true violation of the rule
 *  that A COMPONENT MAY CHOOSE WHAT KIND OF THING IT IS BUT NOT WHERE IT LIVES. #385 pinned it as
 *  the acceptance test for the ground switch: when `data-ground="dark"` landed, the branch had to
 *  disappear, and if it could not, shape C had failed and that was to be SAID rather than patched.
 *
 *  ⚠ AND THE RESOLUTION NEEDED NO NEW ROLE, WHICH WAS THE SURPRISE. The obvious repair was a
 *  `quote` role resolving per ground. It is unnecessary: the prop was misnamed rather than
 *  misconceived. This variant is a full-bleed quote BAND — a KIND of quote, chosen by
 *  `SectionRenderer` when the quote is a section's sole block — and a band is always dark. So
 *  `on-dark-quote` here is a CONSTANT of the variant, not a choice about the ground, exactly as
 *  `HeroCover`'s on-dark names are constants because HeroCover has only one ground.
 *
 *  A COMPONENT WITH ONLY ONE GROUND IS NOT CHOOSING. Renaming `dark` to `band` is what makes that
 *  legible, and the size difference between the variants — a band quote is set larger than an
 *  inline one — is a layout fact that was never a ground fact.
 *
 *  `SectionHeading`'s `tone` is the same shape and was never a violation: accent-toned or
 *  ink-toned, both following the theme. The difference is that a KIND is a property of the thing
 *  and a GROUND is a property of the place.
 */

/** `.pull` — left-bar italic pull quote. Under template=web (CS-7b) the Bold-gallery
 *  serif quote: the BAND variant renders on the dark quote band, otherwise the inline
 *  light serif (accent). Mobile keeps the left-bar quote, byte-identically.
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
  band = false,
  editable = false,
  blockIndex,
}: {
  text: string;
  web?: boolean;
  band?: boolean;
  editable?: boolean;
  blockIndex?: number;
}) {
  const edit = inlineEditProps(editable, blockIndex, "text", "Edit pull quote");
  const aff = editable ? EDIT_AFFORD : "";
  if (web && band) {
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
        className={`font-display italic font-normal text-[clamp(1.375rem,2.4vw,1.75rem)] text-accent-text leading-[1.3] max-w-[760px]${aff}`}
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
