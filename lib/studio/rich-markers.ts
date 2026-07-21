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
  /** Anchors only — read through getAttribute when present, else this. */
  href?: string;
  getAttribute?: (name: string) => string | null;
};

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/** Elements the browser produces for bold. execCommand emits <b> in some engines and
 *  <strong> in others, and `renderRich` itself renders <b>, so both must map back. */
const BOLD = new Set(["B", "STRONG"]);

/** Elements the browser produces for italic. execCommand emits <i> in some engines and
 *  <em> in others, and `renderRich` renders <em>, so all three map back. */
const ITALIC = new Set(["I", "EM"]);

/** Elements that imply a line break when flattened. contentEditable turns Enter into
 *  a <div> or <br> depending on engine; both mean a newline in the stored string. */
const BREAK = new Set(["BR", "DIV", "P"]);

/** The href an anchor carries, however the node exposes it. */
function hrefOf(node: NodeLike): string {
  return (node.getAttribute?.("href") ?? node.href ?? "").trim();
}

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
export function richToMarkers(
  root: NodeLike,
  /**
   * Whether a link's href may be written as a marker. INJECTED rather than imported:
   * this module is deliberately a leaf so the marker suite runs in plain node, and URL
   * policy is not the serializer's to own — `lib/case-studies/href.ts` holds the one
   * definition and the panel passes it in.
   *
   * The default FAILS CLOSED. A caller that forgets flattens links to their text, which
   * is merely lossy; the alternative default would write unchecked hrefs into the yaml.
   */
  isSafeHref: (href: string) => boolean = () => false
): string {
  // `marked` covers bold AND italic: the model allows one mark per run, so a mark nested
  // in any other mark emits its text only rather than a second marker pair.
  const walk = (node: NodeLike, marked: boolean): string => {
    if (node.nodeType === TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== ELEMENT_NODE) return "";

    const isBold = BOLD.has(node.nodeName);
    const isItalic = ITALIC.has(node.nodeName);
    if (isBold || isItalic) {
      const inner = plainText(node);
      // Empty mark -> keep the whitespace, drop the markers. `****` and `**` are both
      // preserved literally by parseRich, so emitting one would surface as asterisks.
      if (inner.trim() === "") return inner;
      if (marked) return inner;
      return isBold ? `**${inner}**` : `*${inner}*`;
    }

    if (node.nodeName === "A") {
      const inner = plainText(node);
      const href = hrefOf(node);
      // A link with no text, no href, or an href the parser would refuse round-trips as
      // plain text — writing a marker parseRich then rejects would put literal brackets
      // on the live site.
      if (inner.trim() === "" || !isSafeHref(href)) return inner;
      // Brackets and parens inside the text would break the marker on the way back, so a
      // link whose own text carries them stays plain rather than becoming unparseable.
      if (/[\][()]/.test(inner)) return inner;
      return marked ? inner : `[${inner}](${href})`;
    }

    let out = "";
    const kids = node.childNodes;
    for (let i = 0; i < (kids?.length ?? 0); i++) {
      const child = kids![i];
      if (child.nodeType === ELEMENT_NODE && BREAK.has(child.nodeName) && out !== "") out += "\n";
      out += walk(child, marked || isBold || isItalic);
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
