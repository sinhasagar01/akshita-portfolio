// CS-4 test — the frame schema + template derivation + strict enum sanitizing,
// and the byte-compat guarantee (adding the fields inserts nothing into existing
// content). Run: node --experimental-strip-types ralph/tests/cs4-frame.mjs
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { adaptSections, templateDefaultFrame } from "../../lib/case-studies/adapter.ts";
import { sanitizeSectionsPatch } from "../../lib/studio/sections-format.ts";
import { sanitizeProjectsPatch } from "../../lib/studio/projects-format.ts";
import { readSections, serializeProjectSections } from "../../lib/studio/sections-serialize.ts";
import { serializeProjectEntry } from "../../lib/studio/projects-serialize.ts";

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (e) {
    failures++;
    console.log(`  [FAIL] ${name} — ${e.message}`);
  }
}
const eq = (a, b, msg) => {
  if (a !== b) throw new Error(`${msg ?? ""} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
};

/* ---------------------------------------------------------- the derivation */
console.log("templateDefaultFrame — the single mapping");
check("web -> browser", () => eq(templateDefaultFrame("web"), "browser"));
check("mobile -> phone", () => eq(templateDefaultFrame("mobile"), "phone"));
check("absent -> phone", () => eq(templateDefaultFrame(undefined), "phone"));
check("'' -> phone", () => eq(templateDefaultFrame(""), "phone"));
check("unknown -> phone", () => eq(templateDefaultFrame("tablet"), "phone"));

/* ---------------------------------------------------- the precedence matrix */
const emptyGlow = { text: "", top: "", right: "", bottom: "", left: "", size: "" };
const deviceWith = (frame) => ({
  src: "/x.png", alt: "a", width: null, rotate: null, translateX: null, translateY: null, z: null,
  frame, label: "", dotColor: "",
});
const sectionWith = (frame) => ({
  variant: "default", layout: "stack", id: "", index: "", eyebrow: "", title: "", lead: "", northStar: "",
  glow: emptyGlow,
  blocks: [{ discriminant: "deviceShelf", value: { devices: [deviceWith(frame)], glow: emptyGlow, minHeight: null } }],
});
const frameOf = (sections) => sections[0].blocks[0].devices[0].frame;

console.log("\nadaptSections — precedence: block frame > template default > phone");
check("neither -> phone", () => eq(frameOf(adaptSections([sectionWith("")])), "phone"));
check("template web only -> browser", () => eq(frameOf(adaptSections([sectionWith("")], { template: "web" })), "browser"));
check("template mobile only -> phone", () => eq(frameOf(adaptSections([sectionWith("")], { template: "mobile" })), "phone"));
check("block frame wins over template", () => eq(frameOf(adaptSections([sectionWith("macbook")], { template: "web" })), "macbook"));
check("block frame with no template", () => eq(frameOf(adaptSections([sectionWith("browser")])), "browser"));
check("invalid block frame falls back to template default", () => eq(frameOf(adaptSections([sectionWith("tablet")], { template: "web" })), "browser"));
check("invalid block frame + no template -> phone", () => eq(frameOf(adaptSections([sectionWith("tablet")])), "phone"));

/* --------------------------------------------------- strict enum sanitizing */
const sanSection = (frame) => [{ ...sectionWith(frame) }];
console.log("\nsanitizeSectionsPatch — frame is a strict, omit-when-empty enum");
check("valid frame is kept", () => {
  const r = sanitizeSectionsPatch(sanSection("browser"));
  if (!r.ok) throw new Error(`rejected: ${r.error.message}`);
  eq(r.sections[0].blocks[0].value.devices[0].frame, "browser", "kept frame");
});
check("empty frame is OMITTED (not written)", () => {
  const r = sanitizeSectionsPatch(sanSection(""));
  if (!r.ok) throw new Error(`rejected: ${r.error.message}`);
  const dev = r.sections[0].blocks[0].value.devices[0];
  if ("frame" in dev) throw new Error(`frame should be omitted, got ${JSON.stringify(dev.frame)}`);
});
check("invalid frame is REJECTED", () => {
  const r = sanitizeSectionsPatch(sanSection("tablet"));
  if (r.ok) throw new Error("should have rejected 'tablet'");
});
check("missing frame key is allowed (optional)", () => {
  const s = sectionWith("");
  delete s.blocks[0].value.devices[0].frame;
  const r = sanitizeSectionsPatch([s]);
  if (!r.ok) throw new Error(`rejected: ${r.error.message}`);
});

console.log("\nsanitizeProjectsPatch — template is a strict, omit-when-empty enum");
check("valid template kept", () => {
  const r = sanitizeProjectsPatch({ template: "web" });
  if (!r.ok || r.patch.template !== "web") throw new Error(`expected web, got ${JSON.stringify(r)}`);
});
check("empty template omitted", () => {
  const r = sanitizeProjectsPatch({ template: "" });
  if (!r.ok || "template" in r.patch) throw new Error("empty template should be omitted");
});
check("invalid template rejected", () => {
  const r = sanitizeProjectsPatch({ template: "desktop" });
  if (r.ok) throw new Error("should have rejected 'desktop'");
});

/* ----------------------------------------------------------- byte-compat */
console.log("\nbyte-compat — adding frame/template inserts NOTHING into existing content");
const md5 = (s) => createHash("md5").update(s).digest("hex");
const dir = "content/projects";
for (const file of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
  const raw = readFileSync(`${dir}/${file}`, "utf8");
  // head: re-dump with an empty patch must reproduce the file's head byte-for-byte
  check(`${file}: head round-trip (no template inserted)`, () => {
    const r = serializeProjectEntry(raw, {});
    if (!r.ok) throw new Error(r.error.message);
    eq(md5(r.bytes), md5(raw), "head md5");
    if (/\btemplate:/.test(r.bytes) && !/\btemplate:/.test(raw)) throw new Error("template key inserted");
  });
  // sections: only migrated projects have them; frame must not be inserted
  const sections = readSections(raw);
  if (sections.length > 0) {
    check(`${file}: sections round-trip (no frame inserted)`, () => {
      const r = serializeProjectSections(raw, sections);
      if (!r.ok) throw new Error(r.error.message);
      eq(md5(r.bytes), md5(raw), "sections md5");
      if (/\bframe:/.test(r.bytes)) throw new Error("frame key inserted");
    });
  }
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
