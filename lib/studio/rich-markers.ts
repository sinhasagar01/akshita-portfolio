// The inverse of `parseRich` — turn an edited contentEditable subtree back into the
// marker string the yaml stores.
//
// WHY IT EXISTS. Rich fields (a section's lead, a stat's body, a richText paragraph)
// were the one thing the canvas could not edit, because contentEditable renders the
// markers away: you see bold, not `**bold**`. That made the PROSE of a case study —
// most of its words — form-only, which is backwards. This closes the loop by walking
// the DOM the browser produced and writing the markers back.
//
// WHAT THE MODEL SUPPORTS, and it is deliberately narrow: `parseRich` recognises
// `**bold**` and nothing else, and `Rich` is `string | (string | {b:string})[]` — no
// italic, no link, no lists. So this emits `**bold**` and flattens everything else to
// plain text. Emitting a marker the parser does not read would put text in the yaml
// that renders literally on the public site.
//
// Anything pasted in — a <span style>, a <font>, a heading, a list — is therefore
// FLATTENED to its text. That is the sanitiser: the yaml can only ever receive the
// characters the schema can hold.
//
// Dependency-free and structurally typed against the DOM (not `typeof window`), so
// the same function the browser calls is unit-exercisable in plain node.

/** The bits of a DOM node this walk touches. Lets node tests build a fake tree. */
export type NodeLike = {
  nodeType: number;
  nodeName: string;
  textContent?: string | null;
  childNodes?: ArrayLike<NodeLike>;
};

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/** Elements the browser produces for bold. execCommand emits <b> in some engines and
 *  <strong> in others, and `renderRich` itself renders <b>, so both must map back. */
const BOLD = new Set(["B", "STRONG"]);

/** Elements that imply a line break when flattened. contentEditable turns Enter into
 *  a <div> or <br> depending on engine; both mean a newline in the stored string. */
const BREAK = new Set(["BR", "DIV", "P"]);

function plainText(node: NodeLike): string {
  if (node.nodeType === TEXT_NODE) return node.textContent ?? "";
  let out = "";
  const kids = node.childNodes;
  for (let i = 0; i < (kids?.length ?? 0); i++) {
    const child = kids![i];
    if (child.nodeType === ELEMENT_NODE && BREAK.has(child.nodeName) && out !== "") out += "\n";
    out += plainText(child);
  }
  return out;
}

/**
 * Serialize an edited subtree to its marker string.
 *
 * Bold is emitted only when it actually wraps text: a browser readily leaves an empty
 * <b> behind after a deletion, and `****` is preserved literally by `parseRich`, so an
 * empty one would surface as four asterisks on the live site.
 *
 * Nested bold collapses — `**a **b** c**` has no meaning in the model, and the parser
 * is non-greedy, so it would re-read as something the editor never showed.
 */
export function richToMarkers(root: NodeLike): string {
  const walk = (node: NodeLike, insideBold: boolean): string => {
    if (node.nodeType === TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== ELEMENT_NODE) return "";

    if (BOLD.has(node.nodeName)) {
      const inner = plainText(node);
      if (inner.trim() === "") return inner; // empty bold -> keep the whitespace, drop the markers
      // Already inside bold: emit the text only, so markers cannot nest.
      return insideBold ? inner : `**${inner}**`;
    }

    let out = "";
    const kids = node.childNodes;
    for (let i = 0; i < (kids?.length ?? 0); i++) {
      const child = kids![i];
      if (child.nodeType === ELEMENT_NODE && BREAK.has(child.nodeName) && out !== "") out += "\n";
      out += walk(child, insideBold || BOLD.has(node.nodeName));
    }
    return out;
  };

  let out = "";
  const kids = root.childNodes;
  for (let i = 0; i < (kids?.length ?? 0); i++) {
    const child = kids![i];
    if (child.nodeType === ELEMENT_NODE && BREAK.has(child.nodeName) && out !== "") out += "\n";
    out += walk(child, false);
  }
  return out;
}
