// THE LISTBOX WIRING GATE — proves the custom select wires what the native one gave free.
// Run: node --experimental-strip-types ralph/tests/listbox-a11y.mjs
//
// WHAT THIS CAN AND CANNOT DO. ralph is source inspection, so this proves the HANDLERS, ARIA and
// classes are WIRED. It does NOT prove they WORK — that a real ArrowDown moves the active option,
// that :focus-visible lights on a real Tab (#209: programmatic focus does not), that the panel
// clips or flips, that contrast clears. Those are behavioural and run in a real, authenticated
// studio browser with real key events. This gate is the half CI can hold: if a handler or an aria
// attribute is deleted, this fails on the next run rather than after a keyboard user hits it.
//
// The native `<select>` this replaces gave all of the below for free; each row here is one thing
// the component now owns. A deleted line is a silent regression to a keyboard or screen-reader
// user, which is exactly the failure a source gate is cheap enough to prevent.
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? "  [PASS] " : "  [FAIL] ") + name + (ok ? "" : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
};
const src = readFileSync(new URL("../../components/studio/ListboxField.tsx", import.meta.url), "utf8");
const has = (re) => re.test(src);
// Comment-stripped, for STRUCTURAL counts (e.g. how many real <button> tags) so a `<button>`
// mentioned in prose does not inflate the count.
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

/* ---------------------------------------------- A. THE KEYBOARD, KEY BY KEY (section B of the plan)
 * The native select gave arrows, Home, End, Enter, Space, Escape and open-on-key. Each is asserted
 * by name so dropping one is loud. */
t("A1 ArrowDown moves the active option", has(/case "ArrowDown":[\s\S]*?setActive/), true);
t("A2 ArrowUp moves the active option", has(/case "ArrowUp":[\s\S]*?setActive/), true);
t("A3 Home jumps to the first option", has(/case "Home":[\s\S]*?setActive\(0\)/), true);
t("A4 End jumps to the last option", has(/case "End":[\s\S]*?setActive\(len - 1\)/), true);
t("A5 Enter and Space commit the active option", has(/case "Enter":\s*case " ": e\.preventDefault\(\); commit\(active\)/), true);
t("A6 Escape closes and returns focus to the trigger", has(/case "Escape":[\s\S]*?setOpen\(false\); triggerRef\.current\?\.focus\(\)/), true);
t("A7 a CLOSED trigger opens on ArrowDown/ArrowUp/Enter/Space",
  has(/if \(!open\) \{[\s\S]*?e\.key === "ArrowDown" \|\| e\.key === "ArrowUp" \|\| e\.key === "Enter" \|\| e\.key === " "[\s\S]*?openNow\(\)/), true);
t("A8 arrows WRAP (modulo), matching StudioSearch", has(/\(a \+ 1\) % len/) && has(/\(a - 1 \+ len\) % len/), true);

/* ---------------------------------------------- B. THE ARIA CONTRACT
 * role, state, and the active-descendant relationship the platform managed. */
t("B1 the trigger is a combobox with a listbox popup", has(/role="combobox"/) && has(/aria-haspopup="listbox"/), true);
t("B2 aria-expanded tracks open", has(/aria-expanded=\{open\}/), true);
t("B3 aria-controls points at the listbox", has(/aria-controls=\{listId\}/), true);
t("B4 the trigger is NAMED with aria-labelledby (a <label> does not name a <button>)", has(/aria-labelledby=\{labelId\}/), true);
t("B5 active-descendant points at the active option when open",
  has(/aria-activedescendant=\{open \? optId\(active\) : undefined\}/), true);
t("B6 the panel is a listbox and rows are options with aria-selected",
  has(/role="listbox"/) && has(/role="option"/) && has(/aria-selected=\{selected\}/), true);

/* ---------------------------------------------- C. FOCUS STAYS ON THE TRIGGER (select-only combobox)
 * Options must be NON-FOCUSABLE divs so the trigger is the only tab stop and "focus returns on
 * close" holds by construction. The one and only <button> is the trigger. */
t("C1 there is exactly ONE <button> — the trigger; options are non-focusable divs",
  (code.match(/<button/g) ?? []).length, 1);
t("C2 focus is restored to the trigger on commit and on Escape (>= 2 sites)",
  (src.match(/triggerRef\.current\?\.focus\(\)/g) ?? []).length >= 2, true);

/* ---------------------------------------------- D. THE CAPPED PANEL'S CONSEQUENCE (plan A)
 * A capped, scrollable panel means arrows must scroll the active option into view — the native
 * select did this for free. INSTANT scroll (no behavior arg) so it is not script motion the
 * reduced-motion reset cannot reach. */
t("D1 the active option is scrolled into view, instantly (block:nearest, no behavior)",
  has(/scrollIntoView\(\{ block: "nearest" \}\)/), true);
t("D2 the panel caps its height to the measured room and scrolls (dynamic maxHeight + overflow-y-auto)",
  has(/setMaxH\(/) && has(/style=\{\{ maxHeight: maxH \}\}/) && has(/overflow-y-auto/), true);

/* ---------------------------------------------- E. THE FLIP (plan A — no portal)
 * Measures the nearest scrolling ancestor and opens upward when there is no room below. */
t("E1 the flip measures the scrolling ancestor's room and sets direction",
  has(/overflowY/) && has(/setFlip\(/), true);
t("E2 the flip is applied to the panel (bottom-full when flipped, top-full otherwise)",
  has(/flip \? "bottom-full/) && has(/"top-full/), true);

/* ---------------------------------------------- F. THE CHECK, NOT THE 3px BAR (plan D)
 * The selected option carries a check and ground+1, never the selection-language left bar. */
t("F1 the selected row uses ground+1 (bg-cream-100), not a border-l accent bar",
  has(/bg-cream-100/) && !has(/border-l-\[?3px|border-l-accent/), true);
t("F2 the selected row shows an accent check (opacity toggled on selected)",
  has(/text-accent-500 \$\{selected \? "opacity-100" : "opacity-0"\}/), true);

/* ---------------------------------------------- G. THE SPLIT RULE IS WRITTEN DOWN (plan E)
 * Two select shapes in one studio is a cost; the rule that keeps it a decision rather than drift
 * must live in BOTH headers, with a named migration trigger — a decision nobody can find is drift
 * waiting to happen. Also the type-ahead drop is recorded as a TRIGGER, not a count. */
const fields = readFileSync(new URL("../../components/studio/blocks/fields.tsx", import.meta.url), "utf8");
/* G1-G3 USED TO PIN THE BY-ROLE SPLIT FROM BOTH SIDES, and they failed when #251 deleted it —
 * which is the correct behaviour for an assertion whose subject is a DECISION. They are rewritten
 * rather than removed: the reversal now has to be recorded as carefully as the rule was, because
 * a deleted rule with no trace is indistinguishable from drift.
 *
 * The split was reversed by the CONDITION IT NAMED ("if they begin to look wrong beside it"), so
 * what these assert now is that the reversal says so, that the reasoning it replaced survives
 * beside it, and that the accepted cost carries an ACTIONABLE remedy. */
t("G1 the deleted split is recorded as a reversal, with the original reasoning kept beside it",
  /SPLIT[\s\S]{0,80}DELETED/i.test(src) && /KEPT BECAUSE THE REASONING WAS SOUND/i.test(src), true);
t("G2 …and it names the condition that fired, so this reads as the rule working rather than drift",
  /NAMED ITS OWN UNDOING/i.test(src) && /begin[\s\S]{0,12}to look wrong beside it/i.test(src), true);
/* The remedy has to be RUNNABLE, not described. "restore it from the parent sha" is a sentence;
 * `git show <sha>:<path>` is a command. This asserts the concrete form, because the whole point
 * of the trigger is that whoever meets it months later does not have to reconstruct anything. */
t("G3 the accepted cost has an EXECUTABLE restore path — a trigger whose remedy is a rebuild is one nobody acts on",
  /PLATFORM PICKER ON TOUCH/i.test(src)
    && /git show [0-9a-f]{7,40}:components\/studio\/blocks\/fields\.tsx/.test(src), true);
t("G3b SelectField is GONE rather than left unused — zero consumers is the shape this project deletes",
  /export function SelectField/.test(fields), false);
t("G4 the type-ahead drop is recorded as a TRIGGER (scrolling), not a count",
  /visible without scrolling/i.test(src), true);

console.log(`\nlistbox-a11y result: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
