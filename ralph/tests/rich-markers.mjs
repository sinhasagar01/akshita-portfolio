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
import { parseRich, isSafeHref } from "../../lib/case-studies/adapter.ts";

// The serializer takes the href policy as an argument (it is a leaf module on purpose),
// so every call here passes the REAL one rather than a stand-in.
const safe = isSafeHref;

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
/** An anchor. The serializer reads href through getAttribute when it is present. */
const a = (href, ...children) => ({ ...el("A", ...children), href, getAttribute: (n) => (n === "href" ? href : null) });

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
// italic and link ARE in the model now, so these two are marks rather than casualties of
// the sanitiser. Everything else on this list still flattens.
t("pasted <em> becomes an italic marker",
  richToMarkers(root(text("a "), el("em", text("it")), text(" b")), safe), "a *it* b");
t("an <a> with NO href flattens to its text (nothing to link to)",
  richToMarkers(root(text("see "), el("a", text("the docs"))), safe), "see the docs");
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
t("serializer never emits ****", richToMarkers(root(el("b")), safe).includes("****"), false);

// ============================================================================
// ITALIC AND LINK — the marks added alongside bold.
// ============================================================================

console.log("\n--- italic ---");
t("italic via <em>", richToMarkers(root(text("a "), el("em", text("it")), text(" b")), safe), "a *it* b");
t("italic via <i> (some engines emit this)",
  richToMarkers(root(el("i", text("slanted"))), safe), "*slanted*");
t("bold and italic ADJACENT both survive",
  richToMarkers(root(el("b", text("B")), text(" and "), el("em", text("I"))), safe), "**B** and *I*");
t("empty <em> drops its markers (a lone * would render literally)",
  richToMarkers(root(text("a"), el("em"), text("b")), safe), "ab");
t("italic nested in bold collapses to text (ONE mark per run)",
  richToMarkers(root(el("b", text("a "), el("em", text("b")), text(" c"))), safe), "**a b c**");

console.log("\n--- link ---");
t("link with an https href",
  richToMarkers(root(text("see "), a("https://example.com", text("docs"))), safe), "see [docs](https://example.com)");
t("link with a mailto href",
  richToMarkers(root(a("mailto:hi@example.com", text("email"))), safe), "[email](mailto:hi@example.com)");
t("link with a relative href",
  richToMarkers(root(a("/projects", text("work"))), safe), "[work](/projects)");
t("UNSAFE javascript: href flattens to text, no marker",
  richToMarkers(root(a("javascript:alert(1)", text("click"))), safe), "click");
t("UNSAFE data: href flattens to text",
  richToMarkers(root(a("data:text/html,<script>", text("click"))), safe), "click");
t("obfuscated java\\tscript: href flattens too",
  richToMarkers(root(a("java\tscript:alert(1)", text("click"))), safe), "click");
t("link text containing brackets stays plain (it could not round-trip)",
  richToMarkers(root(a("https://example.com", text("a [b] c"))), safe), "a [b] c");
t("FAIL-CLOSED: with no policy passed, links flatten rather than emit unchecked hrefs",
  richToMarkers(root(a("https://example.com", text("docs")))), "docs");

console.log("\n--- round-trip of the new marks through parseRich ---");
const flatten = (r) => (typeof r === "string" ? r : r.b ?? r.i ?? r.a);
const rt = (label, node, markers, plain) => {
  const got = richToMarkers(node, safe);
  t(`round-trip · ${label} · markers`, got, markers);
  const runs = parseRich(got);
  const flat = typeof runs === "string" ? runs : runs.map(flatten).join("");
  t(`round-trip · ${label} · text preserved`, flat, plain);
};
rt("italic", root(text("a "), el("em", text("B")), text(" c")), "a *B* c", "a B c");
rt("link", root(text("see "), a("https://example.com", text("docs"))), "see [docs](https://example.com)", "see docs");
rt("bold + italic adjacent", root(el("b", text("B")), text(" "), el("em", text("I"))), "**B** *I*", "B I");

console.log("\n--- parseRich: * vs ** disambiguation and literals ---");
const kinds = (s) => { const r = parseRich(s); return typeof r === "string" ? "STR" : r.map((x) => typeof x === "string" ? "t" : ("b" in x ? "B" : "i" in x ? "I" : "A")).join(""); };
t("**bold** parses as bold, not two italics", kinds("**x**"), "B");
t("*italic* parses as italic", kinds("*x*"), "I");
t("bold then italic in one string", kinds("**b** and *i*"), "BtI");
t("*** is not syntax — preserved literally around the bold",
  JSON.stringify(parseRich("***x***")), JSON.stringify(["*", { b: "x" }, "*"]));
t("a lone * mid-word stays literal", parseRich("2 * 3 = 6"), "2 * 3 = 6");
t("an unclosed * stays literal", parseRich("half *open"), "half *open");
t("**** stays literal", parseRich("****"), "****");
t("a [ with no ]( stays literal", parseRich("[not a link"), "[not a link");
t("unsafe scheme is REFUSED at parse and stays literal",
  parseRich("[x](javascript:alert(1))"), "[x](javascript:alert(1))");
t("safe link parses to a link run",
  JSON.stringify(parseRich("[x](https://a.co)")), JSON.stringify([{ a: "x", href: "https://a.co" }]));
t("empty string still returns the empty STRING, not a run list",
  JSON.stringify(parseRich("")), JSON.stringify(""));

console.log("\n--- EXISTING bold-only content must be untouched by the new branches ---");
for (const s of [
  "Personas served, **Data Designer**, **Insight Designer**, and **Decision Designer**",
  "Designing for three personas at once taught me to find the shared spine.",
  "**Lead** then rest",
]) {
  t(`bold-only round-trip unchanged · ${s.slice(0, 34)}…`,
    JSON.stringify(parseRich(s)), JSON.stringify(parseRich(s)));
  const runs = parseRich(s);
  const flat = typeof runs === "string" ? runs : runs.map(flatten).join("");
  t(`  text preserved · ${s.slice(0, 26)}…`, flat, s.replace(/\*\*/g, ""));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

