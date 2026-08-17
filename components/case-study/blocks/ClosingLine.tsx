import { EDIT_AFFORD, inlineEditProps } from "../editable";

/** A warm closing statement. Under template=web (CS-7b) the same line, centered; mobile is
 *  left-aligned. That split is a LAYOUT difference and is kept — it is the only thing the two
 *  branches ever disagreed about.
 *
 *  ⚠ NOT ITALIC AND NO LONGER ACCENT, AND BOTH ARE THE DIRECTION RATHER THAN A PREFERENCE. The
 *  specification's type table has six roles and not one of them is italic, so a slanted line here
 *  was outside the system rather than a variant inside it. And the accent is sanctioned for four
 *  things — the current floor, the readout figures, the outcome column and the resume control — of
 *  which a closing line is none. Four live sites come off `accent-text` here.
 *
 *  THE SPINE'S ONE ITALIC IS THE HERO THESIS AND IT IS UNTOUCHED. `CLAUDE.md` specifies "one
 *  italic thesis sentence" for the hero, so that slant is a written decision and changing it is
 *  the owner's call rather than this unit's.
 *
 *  CS-7d — `editable` tags the plain-string text as in-place editable in the studio canvas; off by
 *  default, so the public render is unchanged. */
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
      <p {...edit} className={`sheet-h3 max-w-[34ch] mx-auto text-center${aff}`}>
        {text}
      </p>
    );
  }
  return (
    <p {...edit} className={`sheet-h3 max-w-[34ch]${aff}`}>
      {text}
    </p>
  );
}
