// Unit suite for richToMarkers — the contentEditable-to-marker serializer.
//
// Run: node --experimental-strip-types ralph/tests/rich-markers.mjs
//
// The load-bearing property is ROUND-TRIP with parseRich: whatever the editor writes
// must parse back to what the editor showed. A serializer that emits a marker the
// parser does not read puts literal asterisks on the live site, which is worse than
// not supporting the mark at all.
//
// No jsdom: richToMarkers is structurally typed, so the fake tree below is enough and
// the suite stays dependency-free like the rest of ralph/tests.
import { richToMarkers } from "../../lib/studio/rich-markers.ts";
import { parseRich } from "../../lib/case-studies/adapter.ts";

const text = (s) => ({ nodeType: 3, nodeName: "#text", textContent: s });
const el = (name, ...children) => ({
  nodeType: 1,
  nodeName: name.toUpperCase(),
  childNodes: children,
  get textContent() {
    return children.map((c) => c.textContent ?? "").join("");
  },
});
const root = (...children) => el("DIV", ...children);

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = got === want;
  console.log((ok ? "✓ " : "✗ FAIL ") + name + (ok ? "" : `\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};

// --- the marker the model supports -----------------------------------------
t("plain text passes through", richToMarkers(root(text("Hello world."))), "Hello world.");
t("bold via <strong>", richToMarkers(root(text("a "), el("strong", text("b")), text(" c"))), "a **b** c");
t("bold via <b> (what renderRich itself emits)",
  richToMarkers(root(text("a "), el("b", text("b")), text(" c"))), "a **b** c");
t("bold at the start", richToMarkers(root(el("b", text("Lead")), text(" then rest"))), "**Lead** then rest");
t("two separate bolds",
  richToMarkers(root(el("b", text("one")), text(" and "), el("b", text("two")))), "**one** and **two**");

// --- the hazard the task calls out: an edit that does not touch bold --------
{
  // "Enterprise **AI** is hard" — the user types " really" into the trailing run.
  const before = root(text("Enterprise "), el("b", text("AI")), text(" is hard"));
  const after  = root(text("Enterprise "), el("b", text("AI")), text(" is really hard"));
  t("untouched bold survives a mid-paragraph edit",
    richToMarkers(after), "Enterprise **AI** is really hard");
  t("  and the bold is still bold before the edit",
    richToMarkers(before), "Enterprise **AI** is hard");
}

// --- paste sanitisation: nothing but bold may reach the yaml ---------------
t("pasted <span style> flattens to text",
  richToMarkers(root(text("a "), el("span", text("styled")), text(" b"))), "a styled b");
t("pasted <font> flattens", richToMarkers(root(el("font", text("colored")))), "colored");
t("pasted <em> flattens (italic is NOT in the model)",
  richToMarkers(root(text("a "), el("em", text("it")), text(" b"))), "a it b");
t("pasted <a href> flattens to its text (links are NOT in the model)",
  richToMarkers(root(text("see "), el("a", text("the docs")))), "see the docs");
t("pasted heading flattens", richToMarkers(root(el("h2", text("Title")))), "Title");
t("bold INSIDE a pasted span still becomes a marker",
  richToMarkers(root(el("span", text("x "), el("b", text("y"))))), "x **y**");

// --- degenerate shapes the browser really produces -------------------------
t("empty stays empty", richToMarkers(root()), "");
t("empty text node stays empty", richToMarkers(root(text(""))), "");
t("empty <b> drops its markers (**** would render literally)",
  richToMarkers(root(text("a"), el("b"), text("b"))), "ab");
t("whitespace-only <b> keeps the space, drops the markers",
  richToMarkers(root(text("a"), el("b", text(" ")), text("b"))), "a b");
t("nested bold collapses (the parser is non-greedy; nesting has no meaning)",
  richToMarkers(root(el("b", text("a "), el("b", text("b")), text(" c")))), "**a b c**");
t("<br> becomes a newline", richToMarkers(root(text("one"), el("br"), text("two"))), "one\ntwo");
t("<div> line becomes a newline",
  richToMarkers(root(text("one"), el("div", text("two")))), "one\ntwo");

// --- ROUND-TRIP: what the editor writes must parse back to what it showed ---
const roundTrips = (label, node, expectedMarkers) => {
  const markers = richToMarkers(node);
  t(`round-trip · ${label} · markers`, markers, expectedMarkers);
  // and parseRich must read them back into the same runs the canvas rendered
  const runs = parseRich(markers);
  const flat = typeof runs === "string" ? runs : runs.map((r) => (typeof r === "string" ? r : r.b)).join("");
  t(`round-trip · ${label} · text preserved`, flat, plainOf(node));
};
function plainOf(node) {
  if (node.nodeType === 3) return node.textContent ?? "";
  let out = "";
  for (const c of node.childNodes ?? []) {
    if (c.nodeType === 1 && ["BR", "DIV", "P"].includes(c.nodeName) && out !== "") out += "\n";
    out += plainOf(c);
  }
  return out;
}
roundTrips("plain", root(text("Just prose.")), "Just prose.");
roundTrips("one bold", root(text("a "), el("b", text("B")), text(" c")), "a **B** c");
roundTrips("bold only", root(el("b", text("All bold"))), "**All bold**");

// parseRich's own documented edge: `****` and an unclosed `**` stay literal. The
// serializer must never MANUFACTURE either of those from an empty element.
t("serializer never emits ****", richToMarkers(root(el("b"))).includes("****"), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
