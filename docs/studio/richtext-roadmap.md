# Rich text in /studio — what exists, what is deferred, what is out

The canvas edits prose with **bold** and nothing else. That is a deliberate line, not an
oversight, but the reasoning was previously scattered across PR bodies where it was easy
to lose. This is the durable version.

**This doc exists instead of greyed-out toolbar buttons.** A disabled Italic button
advertises a feature to the owner that does not exist and cannot be made to work by
clicking harder. The toolbar shows one button, Bold, because one mark is what the model
holds. Capability lives here, in writing, where it can be reasoned about.

---

## Shipped

**Bold, everywhere prose is rendered.** Stored as `**bold**` inside a plain string,
parsed by `parseRich`, rendered as `<b>` by `renderRich`, and serialized back from the
contentEditable DOM by `richToMarkers`. The canvas shows real bold, never the asterisks.

**richText paragraphs, inline.** Each paragraph is its own array item and its own
editable field (`paragraphs.<i>`). Enter splits the array at the caret into a new item;
Backspace at the start of a paragraph merges it into the one above, removing the item
cleanly rather than leaving an empty string. This was the last block type that forced the
owner off the canvas and into the Inspector.

---

## Deferred, in the order they are worth doing

### Italic and link — cheap, and cheaper than it looks

The storage already fits. `Rich` is a plain string, so the yaml can hold `*italic*` or
`[text](url)` today without touching Keystatic or the schema. Earlier notes said "no
model", which read as a storage constraint; it is not one. What is missing is only
parser, renderer and serializer support.

Four files: `parseRich` (read the marker), `RichRun` (a run type per mark),
`renderRich` (emit `<em>` / `<a>`), `richToMarkers` (write it back). Plus a toolbar
button each.

The real cost is not the code, it is the proof. These change PUBLIC output, so the
canvas-vs-live parity check and the byte-identical rendered-DOM diff both have to be
re-run and re-argued, and links add questions bold never had: does an external link get
`rel="noopener"`, does it open in a new tab, what happens to a link whose text is edited
away. Bounded, but not a one-line change.

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
