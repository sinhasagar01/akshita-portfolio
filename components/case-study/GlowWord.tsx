import type { GlowWord as GlowWordType } from "@/lib/case-studies/types";
import SheetStamp, { cornerOf } from "./SheetStamp";

/** The authored word behind a section, a hero, or a device shelf — now drawn as the STAMP device
 *  rather than as a giant slanted watermark.
 *
 *  ⚠ THE FILE KEEPS ITS NAME AND THE DEVICE DOES NOT, WHICH IS DELIBERATE IN BOTH DIRECTIONS. Three
 *  call sites pass `word={…}` from a schema field called `glow`, so renaming this would rename a
 *  content field and its consumers for no gain — the field is what an author fills in, and `glow` is
 *  still an honest name for "the faint word for this section". What changed is how it is DRAWN, and
 *  that lives in `SheetStamp`, which is named for what it is.
 *
 *  ⚠ AND IT HAS A THIRD CONSUMER WITH AN EMPTY POPULATION, WHICH IS WORTH KNOWING BEFORE SOMEBODY
 *  READS TWO AS ALL. `DeviceShelf` accepts a `glow` and NO content authors one — measured across all
 *  four studies: 15 section words, 4 hero words, 0 shelf words. So the shelf route is live code over
 *  an empty set, and the first shelf word anybody writes renders as a stamp with no further edit.
 *  That is the good half of routing three sites through one device.
 *
 *  WHAT THE STAMP DROPS FROM THIS COMPONENT, AND WHY EACH IS SAFE TO DROP:
 *
 *    `size`     an authored clamp per word, five values across nine words. A stamp is one size
 *               everywhere, so the field stops being read. It stays in the SCHEMA rather than being
 *               deleted, because removing a content field is a migration and this is not one.
 *    offsets    the MAGNITUDES only. They were tuned for a word that hangs off the edge; the SIDES
 *               survive and pick the corner. See `cornerOf`.
 *    `GLOW`     `accent-500` at 10% — a RUNG at an alpha. The stamp takes `etch`, the pigment role
 *               built for exactly this, which also keeps the accent inside its sanctioned four. */
export default function GlowWord({ word }: { word: GlowWordType }) {
  return <SheetStamp text={word.text} corner={cornerOf(word)} />;
}
