// Phase-1 T3 test — Currently-badge selection logic.
// Run: node --experimental-strip-types ralph/tests/task3.mjs
//
// Plain JS (kept out of the app tsc program). Imports the REAL pure selection
// helper that ExperienceSection uses (single source of truth). Asserts the
// behavioral rule:
//  (i)   an entry with endDate="Present" is current -> it is the feature,
//  (ii)  an entry with endDate="" (empty/whitespace) is current,
//  (iii) when ALL entries have real end dates, NO entry is current -> feature is
//        null, so NO badge shows (anti-regression: the old code force-badged
//        experience[0]); all entries fall under Previously.
// Case (iv) "the homepage still renders" is verified by build + browser, below.
import { isCurrentRole, selectCurrentExperience } from "../../components/sections/experience-current.ts";

let failures = 0;
function check(name, cond, detail = "") {
  const status = cond ? "PASS" : "FAIL";
  if (!cond) failures++;
  console.log(`  [${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("T3.0 isCurrentRole matches empty/whitespace OR Present (case-insensitive)");
{
  check('""  is current', isCurrentRole("") === true);
  check('"   " (whitespace) is current', isCurrentRole("   ") === true);
  check('"Present" is current', isCurrentRole("Present") === true);
  check('"present" is current', isCurrentRole("present") === true);
  check('"  PRESENT  " is current', isCurrentRole("  PRESENT  ") === true);
  check('"Jan 2024" is NOT current', isCurrentRole("Jan 2024") === false);
  check('"Presently" is NOT current', isCurrentRole("Presently") === false);
}

const e = (slug, endDate) => ({ slug, endDate, company: `${slug} Co`, title: "Role", startDate: "Jan 2020" });

console.log("T3.i endDate=Present -> that entry is the feature (Currently)");
{
  const list = [e("a", "Jan 2024"), e("b", "Present"), e("c", "Dec 2019")];
  const { feature, previous } = selectCurrentExperience(list);
  check("feature is the Present entry", feature?.slug === "b", `got: ${feature?.slug ?? "null"}`);
  check("previous excludes the feature", previous.length === 2 && !previous.some((x) => x.slug === "b"));
}

console.log('T3.ii endDate="" -> that entry is current');
{
  const list = [e("a", "Jan 2024"), e("b", ""), e("c", "Dec 2019")];
  const { feature } = selectCurrentExperience(list);
  check("feature is the empty-endDate entry", feature?.slug === "b", `got: ${feature?.slug ?? "null"}`);
}

console.log("T3.iii ALL real end dates -> NO current entry -> NO badge (anti-regression)");
{
  const list = [e("a", "Jan 2024"), e("b", "Jun 2025"), e("c", "Dec 2019")];
  const { feature, previous } = selectCurrentExperience(list);
  check("feature is null (no forced experience[0])", feature === null, `got: ${feature?.slug ?? "null"}`);
  check("ALL entries render under Previously", previous.length === 3);
  check("anti-regression: feature is NOT experience[0]", feature !== list[0]);
}

console.log("T3.iv (informational) first-current wins when multiple are current");
{
  const list = [e("a", "Jan 2024"), e("b", "Present"), e("c", "")];
  const { feature } = selectCurrentExperience(list);
  check("first current entry is the feature", feature?.slug === "b", `got: ${feature?.slug ?? "null"}`);
}

console.log(`\nT3 result: ${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);
