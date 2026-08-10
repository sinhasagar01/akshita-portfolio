// The deploy-status route's DECISION TABLE — which inputs may claim the site is live.
//
// ⚠ THE HANDLER IS NOT IMPORTED, AND THAT IS A LIMIT RATHER THAN A CHOICE. It pulls `next/headers`,
// which needs a request scope no gate has. What is exercised is the table the handler implements,
// read from its own source so the two cannot drift — and the ONE property that matters is stated as
// a count rather than a shape: `ready` must appear only where Vercel's own READY is mapped.
//
// ⚠ FAIL QUIET, NOT FAIL OPEN — #175. Without a credential this route cannot know whether the site
// is live, so every absent-or-broken path answers `unavailable` and the toast keeps the weaker true
// claim. The token-present path needs a real credential and is NOT driven here; it is UNVERIFIED
// and boarded as owner-only configuration.
import { readFileSync } from "node:fs";
/* ⚠ THE HANDLER IS NOT IMPORTED — it pulls next/headers, which needs a request scope. What is
   exercised instead is the DECISION TABLE the handler implements, read from its own source so the
   two cannot drift: which inputs produce `unavailable`, and whether any produce `ready`. */
const src = readFileSync(new URL("../../app/api/studio/deploy-status/route.ts", import.meta.url), "utf8");
let pass=0, fail=0;
const t=(n,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);console.log((ok?"  [PASS] ":"  [FAIL] ")+n+(ok?"":`\n     got ${JSON.stringify(g)}\n     want ${JSON.stringify(w)}`));ok?pass++:fail++;};

console.log("  the credential branches, read from the handler");
t("no token or no projectId -> unavailable/no_credential",
  /if \(!token \|\| !projectId\) \{[\s\S]{0,160}?state: "unavailable", reason: "no_credential"/.test(src), true);
t("a non-ok API response -> unavailable, NOT error (error means the DEPLOY failed)",
  /if \(!res\.ok\)[\s\S]{0,420}?state: "unavailable", reason: `api_\$\{res\.status\}`/.test(src), true);
t("an unreachable API -> unavailable/unreachable", /catch \{[\s\S]{0,120}?state: "unavailable", reason: "unreachable"/.test(src), true);
t("no sha -> unavailable/no_sha", /state: "unavailable", reason: "no_sha"/.test(src), true);
t("a deployment not yet visible -> building, never ready", /state: "building", reason: "not_seen_yet"/.test(src), true);
console.log("\n  ⚠ THE FAIL-QUIET PROPERTY, STATED AS A COUNT");
const readys = [...src.matchAll(/"ready"/g)].length;
t("`ready` appears ONLY in the map from Vercel's own READY — no branch invents it", readys, 2);
t("…and the owner gate runs before any outbound call",
  src.indexOf("verifyOwnerSession") < src.indexOf("api.vercel.com"), true);
console.log(`\ndeploy-route result: ${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
