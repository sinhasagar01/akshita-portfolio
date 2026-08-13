// Blank comment bodies before a source scan, preserving every offset and every newline.
//
// ---- ⚠ WHY THIS IS SHARED AT THE SECOND CONSUMER ---------------------------------------------
//
// `cascade-public` had two scanners and only its CSS one stripped comments, so a comment naming an
// element and its class was counted as the element. That was the SEVENTH instance of a comment
// being read as the thing it describes.
//
// ⚠ THE EIGHTH ARRIVED ONE UNIT LATER, IN A SUITE WRITTEN AFTER THE FIX. `collection-dispatch`
// asserts that three ternaries are gone from `commit-collection-entry.ts` — and the comments
// explaining their removal QUOTE them, so two of the three rows failed against prose describing
// their own success.
//
// EIGHT INSTANCES ACROSS FOUR YEARS OF THIS REPO AND TWO IN CONSECUTIVE UNITS IS NOT A DISCIPLINE
// PROBLEM. The rule "never spell a construct in a comment" has been written down repeatedly and
// keeps being broken by the person who wrote it, usually while explaining the previous breach. A
// scanner that reads prose as code will always find something eventually; the only repair that has
// ever held is the mechanism.
//
// ---- ⚠ BLANKED, NEVER DELETED ----------------------------------------------------------------
//
// Callers compute line numbers from match indices. Deleting characters shifts every reported line
// after the first comment in a file, so every non-newline character becomes a space and every
// newline survives. `cascade-public` A0c asserts that identity, and a mutation replacing blanking
// with deletion turns it red.

/**
 * @param {string} src
 * @returns {string} the same length, the same newlines, comment bodies replaced by spaces.
 */
export function blankCommentBodies(src) {
  return (
    src
      // Block comments, which also covers the JSX `{ /* … */ }` form — the braces survive and
      // match nothing.
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
      /* A line comment only where the slashes are not preceded by a colon or a word character, so
         `https://` and a protocol-relative URL are left alone. `cascade-public` A0c asserts that
         case, because blanking a URL's line would take any class sitting after an href with it. */
      .replace(/(^|[^:\w])(\/\/[^\n]*)/g, (m, pre, c) => pre + c.replace(/[^\n]/g, " "))
  );
}
