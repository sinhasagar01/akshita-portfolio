// The two caret primitives the inline canvas needs, shared by the case-study editor and the
// blog editor.
//
// EXTRACTED, NOT REWRITTEN. Both were module-private inside SectionsEditPanel.tsx and both
// are entirely generic — `paragraphCaret` reads the `data-edit-*` attribute contract and
// knows nothing about sections, `placeCaret` walks text nodes to a plain-text offset and
// knows nothing about anything. Moving them byte-identically is what makes the blog canvas
// a configuration of an existing mechanism rather than a second implementation of it, which
// is the distinction #173 drew between sharing a COMBINATOR and duplicating a TABLE.
//
// `fieldSelector` is deliberately NOT here. Its block branch is one template string each
// caller can build inline, and its other branch keys off the section shell's `data-edit`
// — extracting it would drag section concepts into a module blog depends on.
//
// NOT A STRIP-TYPES LEAF, and it cannot be: both functions are DOM algorithms, using
// `window.getSelection`, `document.createRange` and `createTreeWalker`. Ralph cannot reach
// them in plain node, so their proof is the browser-driven gate, not a unit suite. That is
// an honest limit rather than an oversight — the PURE half of the same feature
// (`splitParagraph` / `mergeParagraph`) already lives in paragraph-edits.ts precisely so the
// array math IS unit-testable away from carets.
import type { NodeLike } from "./rich-markers";

/** What `richToMarkers` needs, injected rather than imported.
 *
 *  Same reasoning richToMarkers itself gives for taking `isSafeHref` as a parameter: URL
 *  policy is not this module's to own, `lib/case-studies/href.ts` holds the one definition,
 *  and the caller passes it in. Keeping the injection here means this module adds no second
 *  opinion about what a safe href is. */
type Serialize = (root: NodeLike) => string;

/**
 * A caret sitting in a richText paragraph: which block, which array item, and the marker
 * text on each side of it. Null for anything that is not one.
 *
 * THE ATTRIBUTE CONTRACT IS THE INTERFACE. It reads `data-edit-block-index` and
 * `data-edit-value-path`, both written by `inlineEditProps` at render time, so the mapping
 * from a DOM node back to an array position is emitted by the same expression that emits the
 * content. Nothing counts rendered children, which is the mechanism #178 rejected for
 * deriving its mapping from the renderer's output shape and breaking silently when that
 * shape changed.
 */
export function paragraphCaret(
  el: HTMLElement | null,
  serialize: Serialize
): { blockIndex: number; index: number; before: string; after: string; atStart: boolean } | null {
  const ds = el?.dataset;
  if (!ds?.editValuePath || ds.editBlockIndex === undefined) return null;
  const m = /^paragraphs\.(\d+)$/.exec(ds.editValuePath);
  if (!m) return null;
  const sel = typeof window === "undefined" ? null : window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!el!.contains(range.startContainer)) return null;

  // Serialize each side through the SAME serializer the blur writeback uses, by cloning
  // the two halves into detached elements. Nothing here re-implements marker rules.
  const head = range.cloneRange();
  head.selectNodeContents(el!);
  head.setEnd(range.startContainer, range.startOffset);
  const tail = range.cloneRange();
  tail.selectNodeContents(el!);
  tail.setStart(range.endContainer, range.endOffset);

  const wrap = (frag: DocumentFragment) => {
    const d = document.createElement("div");
    d.appendChild(frag);
    return serialize(d);
  };
  return {
    blockIndex: Number(ds.editBlockIndex),
    index: Number(m[1]),
    before: wrap(head.cloneContents()),
    after: wrap(tail.cloneContents()),
    atStart: range.collapsed && head.toString().length === 0,
  };
}

/**
 * Put the caret at a PLAIN-TEXT offset inside an element.
 *
 * Plain text, not marker text, because the caret lives in the rendered DOM where `**` is
 * bold rather than two characters — `mergeParagraph` returns its join offset through
 * `plainLength` for exactly this reason. Walking text nodes is what makes the offset
 * independent of how many `<b>`/`<a>` elements the paragraph happens to contain.
 */
export function placeCaret(el: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let seen = 0;
  let node: Node | null = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (seen + len >= offset) {
      const range = document.createRange();
      range.setStart(node, Math.max(0, offset - seen));
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    seen += len;
    node = walker.nextNode();
  }
  // Past the end (or an empty paragraph): collapse to the end of the element.
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}
