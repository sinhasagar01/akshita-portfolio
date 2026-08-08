// Regenerates every screenshot in the README.
//
//   npm run dev                 # in one terminal
//   node docs/readme/capture.mjs
//
// ⚠ THE STUDIO SHOTS NEED A LOGIN, WHICH IS WHY THIS IS A SCRIPT YOU RUN RATHER THAN SOMETHING
// CHECKED IN. The session cookie is signed and httpOnly, so it cannot be read out of a browser and
// handed over; the only way in is the password. This reads it from the environment — the same
// `STUDIO_OWNER_PASSWORD` that is already in your gitignored `.env.local` — and never prints it.
// Without it, the public shots are still captured and the studio ones are skipped with a notice.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3457";
const OUT = "docs/readme";

/** `.env.local` is not loaded outside Next, so read the one value we need. */
function ownerPassword() {
  if (process.env.STUDIO_OWNER_PASSWORD) return process.env.STUDIO_OWNER_PASSWORD;
  try {
    const m = readFileSync(".env.local", "utf8").match(/^STUDIO_OWNER_PASSWORD=(.*)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

const browser = await chromium.launch();

/* ---- public ---------------------------------------------------------------------------- */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
for (const [name, path] of [
  ["home", "/"],
  ["case-study", "/projects/boat-crest"],
  ["blog", "/blog"],
]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  /* ⚠ AN EMPTY TITLE MEANS THE PAGE DID NOT RENDER, AND IT HAS COST TWO HOURS IN ONE SESSION.
     Running `npm run build` while the dev server holds the port corrupts `.next`; the server then
     serves nothing and every probe returns a plausible, empty-looking result. THE TELL IS THE TITLE.
     Third mechanism-versus-intention instance in this project — the rule was written down both times
     and only a mechanism stopped the other two. A harness that reads an empty title STOPS. */
  if (!(await page.title())) {
    console.error(`\n  ✗ ${path} rendered nothing — title is empty.` +
      "\n    Almost certainly a corrupted .next: stop the dev server, rebuild, restart.\n");
    process.exit(1);
  }
  await page.waitForTimeout(1200); // the scroll reveals settle
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ${name}.png`);
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await mobile.goto(BASE + "/projects/boat-crest", { waitUntil: "networkidle" });
await mobile.waitForTimeout(1200);
await mobile.screenshot({ path: `${OUT}/case-study-mobile.png` });
console.log("  case-study-mobile.png");

/* ---- studio ---------------------------------------------------------------------------- */
// ⚠ THIS HALF FAILS LOUDLY, BECAUSE ITS FIRST FAILURE MODE WAS SILENCE. A skipped studio pass
// leaves three images referenced by the README and absent from disk, and the only symptom is broken
// images in a preview — well after the run that caused it. So every exit here is either three files
// written or a message naming what to do.
const pw = ownerPassword();
if (!pw) {
  console.error(
    "\n  ✗ STUDIO_OWNER_PASSWORD not found in the environment or .env.local." +
      "\n    The studio shots were SKIPPED, so README.md will show three broken images." +
      "\n    Set it in .env.local and run this again.",
  );
  await browser.close();
  process.exit(1);
}

const s = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await s.goto(BASE + "/studio/login", { waitUntil: "networkidle" });
await s.fill('input[type="password"]', pw);
await s.press('input[type="password"]', "Enter");
try {
  await s.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 15000 });
} catch {
  console.error(
    "\n  ✗ The login did not go through — still on /studio/login after 15s." +
      "\n    Check STUDIO_OWNER_PASSWORD, and that STUDIO_SESSION_SECRET is set.",
  );
  await browser.close();
  process.exit(1);
}

await s.goto(BASE + "/studio", { waitUntil: "networkidle" });
await s.waitForTimeout(600);
await s.screenshot({ path: `${OUT}/studio-dashboard.png` });
console.log("  studio-dashboard.png");

await s.goto(BASE + "/studio/projects/boat-crest", { waitUntil: "networkidle" });
// ⚠ SELECT A SECTION FIRST. The editor opens on the Details strip, and a screenshot of that shows
// the chrome without showing the thing the chrome is for — the canvas rendering a real section
// through the same components as the public page. Picked by its title rather than by index, so
// reordering the case study does not silently change which shot this produces. Waited for rather
// than slept past, because on a cold dev server the rail arrives well after `networkidle`.
//
// ⚠ DISPATCHED, NOT CLICKED, AND THE REASON IS NOT "CLICKING WAS FLAKY". A real `.click()` here
// times out: the row reports visible, enabled and stable, and then a DIFFERENT element intercepts
// the point on each retry — the Details canvas's work-card preview, the sidebar nav, the resize
// separator. Three unrelated elements means the box is going stale between resolve and click while
// the editor is still settling, not that anything is covering the row. Hit-testing is not what this
// script is here to prove; the caret and pointer behaviour have their own gates. Dispatching fires
// React's onClick directly and takes the layout race off the table.
const section = s.getByRole("button", { name: /Great hardware/ }).first();
await section.waitFor({ state: "visible", timeout: 20000 });
await section.dispatchEvent("click");

// ⚠ AND THEN CONFIRM IT TOOK. Without this the failure is silent in the worst way: the script
// exits 0 and writes a perfectly good screenshot OF THE WRONG VIEW — the Details strip, which is
// what the shot exists to avoid. The rail marks the current row with aria-current.
try {
  await s.waitForSelector('[aria-current="true"]', { timeout: 10000 });
} catch {
  console.error(
    "\n  ✗ The section did not become selected, so studio-editor.png would show the Details" +
      "\n    strip instead of the canvas. Not writing it.",
  );
  await browser.close();
  process.exit(1);
}
await s.waitForTimeout(1400); // the canvas re-renders and the reveal settles
await s.screenshot({ path: `${OUT}/studio-editor.png` });
console.log("  studio-editor.png");

await s.goto(BASE + "/studio/blog", { waitUntil: "networkidle" });
await s.waitForTimeout(700);
await s.screenshot({ path: `${OUT}/studio-blog.png` });
console.log("  studio-blog.png");

await browser.close();
console.log("\n  All 7 screenshots written to docs/readme/.");
