import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** `.pull` — a quoted statement in the flow, marked by a left object rule.
 *
 *  ---- ⚠ THE ACCEPTANCE TEST FIRED, AND IT PASSED --------------------------------------------
 *
 *  This carried a `dark` prop and picked its colour from it — the one true violation of the rule
 *  that A COMPONENT MAY CHOOSE WHAT KIND OF THING IT IS BUT NOT WHERE IT LIVES. #385 pinned it as
 *  the acceptance test for the ground switch: when `data-ground="dark"` landed, the branch had to
 *  disappear, and if it could not, shape C had failed and that was to be SAID rather than patched.
 *
 *  ⚠ AND THE RESOLUTION NEEDED NO NEW ROLE, WHICH WAS THE SURPRISE. The obvious repair was a
 *  `quote` role resolving per ground. It was unnecessary: the prop was misnamed rather than
 *  misconceived. The variant was a full-bleed quote BAND — a KIND of quote, chosen by
 *  `SectionRenderer` when the quote is a section's sole block — and a band is always dark. So
 *  `on-dark-quote` there was a CONSTANT of the variant, not a choice about the ground.
 *
 *  `SectionHeading`'s `tone` is the same shape and was never a violation: accent-toned or
 *  ink-toned, both following the theme. The difference is that a KIND is a property of the thing
 *  and a GROUND is a property of the place.
 *
 *  ---- ⚠ AND THE BAND VARIANT IS NOW RETIRED, BECAUSE ITS GROUND HAD BEEN GONE FOR A WEEK ------
 *
 *  The reasoning above rests on one premise — "a band is always dark" — and that premise stopped
 *  being true on 2026-08-09, when the `:root[data-ground="dark"]` prefix correctly repaired the
 *  page ground and silently removed the mid-page one. The band kept declaring the dark
 *  vocabulary and the ground under it went light. MEASURED ON PRODUCTION, sanity pair 21.000
 *  first: `on-dark-quote` at 194,194,194 on a 240,240,240 page ground is **1.56** against a 4.5
 *  floor, on three regions across two live case studies. A reader could see the paragraph was
 *  there and could not read it.
 *
 *  ⚠ THE FIX IS THE DELETION RATHER THAN THE FULFILMENT, WHICH IS THE SAME RULING THE ATTRIBUTE
 *  GOT. Restoring a dark ground would ship a design nobody has seen, on two live pages, with the
 *  hero art unmeasured against near-black — a boarded design unit with a mock owed. Deleting the
 *  variant removes the wrong-ground foregrounds entirely, and it is what the direction says
 *  anyway: a sheet set has no dark bands.
 *
 *  ⚠ AND THE VARIANT WAS ALSO A SECOND COPY OF THE SECTION HEADER. It drew its own eyebrow and
 *  `h2` inside `SectionRenderer`, so the three sections that hit it were the only ones the section
 *  rule never reached. Retiring it is what puts them back on the shared component. */
export default function PullQuote({
  text,
  editable = false,
  blockIndex,
}: {
  text: string;
  editable?: boolean;
  blockIndex?: number;
}) {
  const edit = inlineEditProps(editable, blockIndex, "text", "Edit pull quote");
  const aff = editable ? EDIT_AFFORD : "";
  /* ⚠ ONE TREATMENT WHERE THERE WERE THREE, AND TWO OF THE THREE WERE TEMPLATE DRIFT RATHER THAN
     DESIGN. The web branch set 22 to 28px in `accent-text`; the mobile branch set 34px in
     `text-primary`. Same job, same place in the flow, two numbers and two colours because each
     template was authored separately. The BAND's larger size was a real distinction and it goes
     with the band.

     `sheet-h3` is the specification's STUDY role — the level below a sheet opener, which is
     where a quoted statement sits under a section head. The measure is 34ch, which is
     `ClosingLine`'s existing figure for the same kind of line, so this adopts a number rather
     than inventing a third.

     THE LEFT BAR BECOMES AN OBJECT RULE. It was 3px of `accent-500` with a radius — a decorative
     accent that is none of the direction's four sanctioned uses, and a radius on chrome the
     direction retires. A 1px rule at object weight says "this text is set apart" without
     spending colour on it. */
  return (
    <p {...edit} className={`relative sheet-h3 max-w-[34ch] pl-7${aff}`}>
      <span
        aria-hidden="true"
        className="absolute left-0 top-1 bottom-1 w-px bg-[var(--sheet-object)]"
      />
      {text}
    </p>
  );
}
