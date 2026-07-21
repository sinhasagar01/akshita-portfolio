# Rich text in /studio — what exists, what is deferred, what is out

The canvas edits prose with **bold**, *italic* and links, and nothing else. That is a
deliberate line, not an oversight, but the reasoning was previously scattered across PR
bodies where it was easy to lose. This is the durable version.

**This doc exists instead of greyed-out toolbar buttons.** A disabled button advertises a
feature to the owner that does not exist and cannot be made to work by clicking harder.
The toolbar shows exactly the marks the model holds — three — and nothing more.
Capability lives here, in writing, where it can be reasoned about.

---

## Shipped

**Bold, everywhere prose is rendered.** Stored as `**bold**` inside a plain string,
parsed by `parseRich`, rendered as `<b>` by `renderRich`, and serialized back from the
contentEditable DOM by `richToMarkers`. The canvas shows real bold, never the asterisks.

**Italic and links.** `*italic*` renders `<em>`; `[text](url)` renders `<a>`. Storage
needed no schema change — `Rich` was already a plain string, so the yaml held these the
day before they parsed.

Two rules are worth knowing. `*` and `**` are kept apart by ORDERING the parse: bold runs
first and consumes its own asterisks, so by the time italic looks there is no `*`
belonging to a `**` left in play. And a run carries ONE mark — `***both***` is not syntax
and is preserved literally rather than half-parsed, which keeps the `{ b: string }` run
shape that boat-crest.ts, About and every existing value already use.

Link hrefs are an ALLOWLIST: `http`, `https`, `mailto`, and site-relative paths. Anything
else is refused in three places — the toolbar says so when you type it, the parser leaves
the marker as literal text, and the renderer degrades it to plain words. `http(s)` links
get `target="_blank"` with `rel="noopener noreferrer"`; a mailto or an in-page anchor does
not, because opening those in a new tab would be wrong.

**richText paragraphs, inline.** Each paragraph is its own array item and its own
editable field (`paragraphs.<i>`). Enter splits the array at the caret into a new item;
Backspace at the start of a paragraph merges it into the one above, removing the item
cleanly rather than leaving an empty string. This was the last block type that forced the
owner off the canvas and into the Inspector.

---

## Deferred, in the order they are worth doing

### Bulleted and numbered lists — real design work

Not an inline marker. A list is block-level structure: items, nesting, ordered versus
unordered. Trying to smuggle it into a run type would produce a marker language that
`parseRich` cannot round-trip and the editor cannot represent honestly.

The right shape is almost certainly a **new block kind** alongside `richText`, with its
own schema entry, form, renderer and empty — the same arc every other block kind went
through — not a new `RichRun`. That makes it a feature, not an extension.

---

## Deliberately out of scope

**Underline, font size, text colour, highlight.**

These carry no semantic meaning in an editorial design system. Type scale, weight and
colour are the design system's job, decided once in the tokens and applied consistently;
handing them to the author per-word is how a considered layout turns into a ransom note.
Bold survives this test because it means emphasis, which is authorial. Colour means
whatever the author felt that afternoon.

Underline additionally reads as a link on the web, so allowing it creates a control that
lies about what it does.

If one of these is ever genuinely needed, the answer is a new semantic run with a
design-system-owned rendering, not a colour picker.
