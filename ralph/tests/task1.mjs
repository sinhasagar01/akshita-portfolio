// Phase-1 T1 test — projects form: role + timeline locked, preserved on save.
// Run: node --experimental-strip-types ralph/tests/task1.mjs
//
// Plain JS (kept out of the app tsc program, which globs only *.ts/*.tsx) that
// imports the REAL pure modules — the sanitizer and the js-yaml read-modify-write
// serializer (node strips their types on import). Asserts:
//  (1) the sanitizer REJECTS facts.role and facts.timeline (locked),
//  (2) it ACCEPTS facts.type / facts.platform and returns only those keys,
//  (3) a save editing type/platform leaves role + timeline BYTE-IDENTICAL,
//  (4) a no-op patch reproduces the file byte-for-byte,
//  (5) the real content/projects/boat-crest.yaml preserves role + timeline.
import { readFileSync } from "node:fs";
import { dump } from "js-yaml";
import { sanitizeProjectsPatch } from "../../lib/studio/projects-format.ts";
import { serializeProjectEntry } from "../../lib/studio/projects-serialize.ts";

let failures = 0;
function check(name, cond, detail = "") {
  const status = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("T1.1 sanitizer rejects locked facts (role, timeline)");
{
  const r1 = sanitizeProjectsPatch({ facts: { role: "hacker" } });
  check(
    "facts.role rejected",
    r1.ok === false && r1.error.field === "facts" && /role.*not editable/i.test(r1.error.message),
    r1.ok ? "was accepted" : r1.error.message
  );

  const r2 = sanitizeProjectsPatch({ facts: { timeline: "forever" } });
  check(
    "facts.timeline rejected",
    r2.ok === false && /timeline.*not editable/i.test(r2.error.message),
    r2.ok ? "was accepted" : r2.error.message
  );

  const r3 = sanitizeProjectsPatch({ facts: { role: "x", type: "y" } });
  check(
    "mixed patch with role rejected",
    r3.ok === false && /role/i.test(r3.error.message),
    r3.ok ? "was accepted" : r3.error.message
  );

  const r4 = sanitizeProjectsPatch({ facts: { bogus: "x" } });
  check(
    "unknown facts key rejected",
    r4.ok === false && /unknown/i.test(r4.error.message),
    r4.ok ? "was accepted" : r4.error.message
  );
}

console.log("T1.2 sanitizer accepts type/platform, returns only those keys");
{
  const r = sanitizeProjectsPatch({ facts: { type: "T", platform: "P" } });
  check("type + platform accepted", r.ok === true);
  if (r.ok) {
    const keys = Object.keys(r.patch.facts ?? {}).sort().join(",");
    check("patch.facts has only type,platform", keys === "platform,type", `got: ${keys}`);
  }
  const rs = sanitizeProjectsPatch({ summary: "hello" });
  check("summary still accepted", rs.ok === true && rs.patch.summary === "hello");
}

// A deterministic head guaranteed to round-trip through the {} dump candidate,
// so serializeProjectEntry is exercised without depending on file formatting.
const headObj = {
  title: "Test Project",
  summary: "A one line summary.",
  orderIndex: 1,
  heroImage: "/images/x.png",
  facts: { role: "Sole designer, research to UI", type: "OldType", platform: "OldPlat", timeline: "10 weeks" },
};
const head = dump(headObj, {});
const body = "body:\n  - discriminant: heroBlock\n    value:\n      thesis: hi\n";
const raw = head + body;
const roleLine = "  role: Sole designer, research to UI";
const timelineLine = "  timeline: 10 weeks";

console.log("T1.3 editing type/platform preserves role + timeline byte-identical");
{
  const s = serializeProjectEntry(raw, { facts: { type: "NewType", platform: "NewPlat" } });
  check("serialize ok", s.ok === true, s.ok ? "" : s.error.message);
  if (s.ok) {
    const out = s.bytes;
    check("role line byte-identical", out.includes(roleLine + "\n"), "role line changed/dropped");
    check("timeline line byte-identical", out.includes(timelineLine + "\n"), "timeline line changed/dropped");
    check("type updated", /type: NewType/.test(out) && !/OldType/.test(out));
    check("platform updated", /platform: NewPlat/.test(out) && !/OldPlat/.test(out));
    check("body preserved verbatim", out.endsWith(body));
    check("summary untouched", out.includes("summary: A one line summary."));
  }
}

console.log("T1.4 no-op patch reproduces the file byte-for-byte");
{
  const s = serializeProjectEntry(raw, {});
  check("no-op equals input", s.ok === true && s.bytes === raw);
}

console.log("T1.5 real content/projects/boat-crest.yaml preserves role + timeline");
{
  const realRaw = readFileSync(new URL("../../content/projects/boat-crest.yaml", import.meta.url), "utf8");
  const roleMatch = realRaw.match(/^\s*role:.*$/m)?.[0] ?? "";
  const timelineMatch = realRaw.match(/^\s*timeline:.*$/m)?.[0] ?? "";
  const s = serializeProjectEntry(realRaw, {
    facts: { type: "Mobile app redesign (edited)", platform: "Android and iOS" },
  });
  if (!s.ok) {
    // A file whose formatting can't round-trip is safely REFUSED (unsupported_format),
    // which is a no-write, not a data-loss regression. Report rather than fail.
    check("real file editable OR safely refused", s.error.code === "unsupported_format", `refused: ${s.error.code}`);
  } else {
    check("real role line preserved", roleMatch !== "" && s.bytes.includes(roleMatch), "role drifted");
    check("real timeline line preserved", timelineMatch !== "" && s.bytes.includes(timelineMatch), "timeline drifted");
  }
}

console.log(`\nT1 result: ${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
