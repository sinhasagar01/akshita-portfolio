// Phase-1 T2 test — experience form: description round-trips, preserved on save.
// Run: node --experimental-strip-types ralph/tests/task2.mjs
//
// T2 originally pinned description as LOCKED. #117 unlocked it deliberately, because
// the site renders it as the role's bullet lines and /studio had no input for it, so
// the copy could not be written at all. What still matters — and is what this suite
// now pins — is that description SURVIVES: it is byte-identical when some other field
// is edited, and it round-trips exactly when it is the field being edited.
//
// Plain JS (kept out of the app tsc program). Imports the REAL experience
// sanitizer + transform and replicates the exact serializeExperience pipeline
// (load -> transformExperiencePatch -> dump with quotingType '"'). Asserts:
//  (1) the sanitizer ACCEPTS description (string only) and still rejects company /
//      orderIndex / unknown, and accepts title/startDate/endDate,
//  (2) editing title/dates leaves description BYTE-IDENTICAL and orderIndex intact,
//  (3) a no-op reproduces the file byte-for-byte,
//  (4) a real content/experience file preserves description + orderIndex.
import { readFileSync } from "node:fs";
import { load, dump } from "js-yaml";
import {
  sanitizeExperiencePatch,
  transformExperiencePatch,
} from "../../lib/studio/experience-format.ts";

let failures = 0;
function check(name, cond, detail = "") {
  const status = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

// Mirror serializeExperience (commit-collection-entry.ts) exactly.
function serialize(raw, patch) {
  const loaded = load(raw) ?? {};
  const result = transformExperiencePatch(loaded, patch);
  return dump(result.value, { quotingType: '"' });
}

console.log("T2.1 sanitizer accepts description; still rejects company/orderIndex/unknown");
{
  // #117 UNLOCKED description on purpose. Phase-1 T2 refused the key outright, but
  // ExperienceEntry renders it as the role's bullet lines and the panel drew no input
  // for it, so those lines could not be written from /studio at all — every entry's
  // description was "" as a direct result. It is now an ordinary editable string.
  // company and orderIndex stay refused for their own reasons: company is the entry
  // slug (editing it renames the file) and reorder owns orderIndex.
  const r1 = sanitizeExperiencePatch({ description: "Led the redesign." });
  check(
    "description accepted (unlocked by #117)",
    r1.ok === true && r1.patch.description === "Led the redesign.",
    r1.ok ? `patch: ${JSON.stringify(r1.patch)}` : r1.error.message
  );

  const r2 = sanitizeExperiencePatch({ title: "T", description: "x" });
  check("mixed patch with description accepted",
    r2.ok === true && r2.patch.title === "T" && r2.patch.description === "x",
    r2.ok ? `patch: ${JSON.stringify(r2.patch)}` : r2.error.message);

  // The type guard still has to hold for the newly editable field.
  const r2b = sanitizeExperiencePatch({ description: 42 });
  check("non-string description rejected", r2b.ok === false && /must be a string/i.test(r2b.error.message),
    r2b.ok ? "was accepted" : r2b.error.message);

  const r3 = sanitizeExperiencePatch({ company: "x" });
  check("company still rejected", r3.ok === false && /slug/i.test(r3.error.message));

  const r4 = sanitizeExperiencePatch({ orderIndex: 5 });
  check("orderIndex still rejected", r4.ok === false && /ordering/i.test(r4.error.message));

  const r5 = sanitizeExperiencePatch({ bogus: "x" });
  check("unknown key rejected", r5.ok === false && /unknown/i.test(r5.error.message));

  const r6 = sanitizeExperiencePatch({ title: "T", startDate: "Jan 2020", endDate: "Present" });
  check("title/startDate/endDate accepted", r6.ok === true);
  if (r6.ok) {
    const keys = Object.keys(r6.patch).sort().join(",");
    check("patch has only title,startDate,endDate", keys === "endDate,startDate,title", `got: ${keys}`);
  }
}

// Deterministic canonical record (built via dump so it round-trips), with a
// NON-EMPTY description to prove real content is preserved, not just "".
const record = {
  company: "Acme Corp, Bengaluru",
  title: "Senior Designer",
  startDate: "Jan 2020",
  endDate: "Present",
  description: "Led the end to end redesign of the mobile app.",
  orderIndex: 3,
};
const raw = dump(record, { quotingType: '"' });
const descLine = "description: Led the end to end redesign of the mobile app.";
const orderLine = "orderIndex: 3";

console.log("T2.2 editing title/dates preserves description + orderIndex byte-identical");
{
  const out = serialize(raw, { title: "Principal Designer", endDate: "Dec 2024" });
  check("description line byte-identical", out.includes(descLine + "\n") || out.endsWith(descLine),
    "description changed/dropped");
  check("orderIndex line byte-identical", out.includes(orderLine),
    "orderIndex changed/dropped");
  check("title updated", /title: Principal Designer/.test(out) && !/Senior Designer/.test(out));
  check("endDate updated", /endDate: Dec 2024/.test(out) && !/endDate: Present/.test(out));
  check("company untouched", out.includes("company: Acme Corp, Bengaluru"));
}

console.log("T2.2b editing description writes through, and nothing else moves");
{
  // The capability #117 added. Nothing pinned it, which is how the locked-era
  // expectation above survived unnoticed for so long.
  const next = "Rebuilt the design system and shipped it across four squads.";
  const out = serialize(raw, { description: next });
  check("description updated", out.includes(`description: ${next}`) && !out.includes(descLine));
  check("orderIndex still byte-identical", out.includes(orderLine));
  check("company untouched", out.includes("company: Acme Corp, Bengaluru"));
  check("title untouched", out.includes("title: Senior Designer"));
  // A newline-bearing description is the real shape: the site splits it into bullet
  // lines, so it must survive the dump/parse round trip intact.
  const multi = "Led the redesign.\nGrew the team from 2 to 6.";
  const back = load(serialize(raw, { description: multi }));
  check("multi-line description round-trips exactly", back.description === multi,
    JSON.stringify(back.description));
}

console.log("T2.3 no-op reproduces the record byte-for-byte");
{
  const out = serialize(raw, {});
  check("no-op equals input", out === raw);
}

console.log("T2.4 real content/experience/kaha-technologies.yaml preserves description + orderIndex");
{
  const realRaw = readFileSync(new URL("../../content/experience/kaha-technologies.yaml", import.meta.url), "utf8");
  const descMatch = realRaw.match(/^description:.*$/m)?.[0] ?? "";
  const orderMatch = realRaw.match(/^orderIndex:.*$/m)?.[0] ?? "";
  const out = serialize(realRaw, { title: "Edited Title" });
  check("real description line preserved", descMatch !== "" && out.includes(descMatch), `desc: ${descMatch}`);
  check("real orderIndex line preserved", orderMatch !== "" && out.includes(orderMatch), `order: ${orderMatch}`);
  check("real title updated", /title: Edited Title/.test(out));
}

console.log(`\nT2 result: ${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
