# Phase-1 progress log

(Claude Code appends one entry per iteration: task, iteration #, what changed,
pass/fail per criterion, blockers.)

Branch: `ralph/phase1` (off `main` @ `2a87fdb`). fs mode (STUDIO_WRITE_MODE=fs).
Commits land on `ralph/phase1` ONLY. No merge, no push, no github mode.

Note: the working tree carried a pre-existing uncommitted WIP from Sagar in
`app/studio/(dashboard)/layout.tsx` (max-width 1100 -> 1300). That file is
do-not-touch and outside all three tasks. It is left uncommitted and is NEVER
staged, so Sagar's WIP is preserved. Every commit stages task files by explicit
path only.

---

## Task 1 — remove Role + Timeline from the projects form

### Iteration 1 — PASSED

Files touched (staged by explicit path):
- `components/studio/ProjectsEditPanel.tsx` — form fields reduced from 4 facts to
  2 (Type, Platform). `ProjectsFields.facts` narrowed to `EditableFacts =
  {type, platform}`; `initial` seeds only those from props; `isDirty` drops
  role/timeline; `buildCommitted` posts `facts: {type, platform}`.
- `lib/studio/projects-format.ts` — `sanitizeFacts` now accepts ONLY type +
  platform. role + timeline are known-but-locked → rejected with
  "facts.<k> is not editable here"; unknown keys still "unknown facts field".
  Returns a `Partial<ProjectFacts>` of only the provided editable keys.
  `ProjectsInput.facts` typed `Partial<ProjectFacts>`. Added `EDITABLE_FACTS_KEYS`.
- `lib/studio/projects-serialize.ts` — the facts write changed from REPLACE
  (`obj.facts = patch.facts`) to MERGE (`{...existing, ...patch.facts}`), so the
  locked role + timeline (and their key order) are preserved byte-for-byte and a
  no-op still round-trips. This is the task's CRITICAL "must not drop them" line.

Test: `ralph/tests/task1.mjs` (plain JS so it stays out of the app tsc program;
imports the real pure modules; run with `node --experimental-strip-types`).

Pass criteria — ALL PASS:
- Test: `T1 result: ALL PASS` (sanitizer rejects role/timeline + mixed + unknown;
  accepts type/platform only; editing type/platform leaves role + timeline
  byte-identical; no-op reproduces the file; real boat-crest.yaml preserves
  role + timeline).
- `npm run typecheck`: clean.
- `npm run build`: clean.
- Browser (fs mode): /studio/projects form shows only Summary, Type, Platform
  (Role + Timeline gone); no console errors.

Scope note: role/timeline remain valid data in the files and on the public read
path (untouched); they are simply not editable and are preserved on save.

Commit: `c62a702` on `ralph/phase1`. `layout.tsx` WIP left unstaged.

**Task 1 status: PASSED (iteration 1).**

---

## Task 2 — remove Description from the experience form

### Iteration 1 — PASSED

Files touched (staged by explicit path):
- `components/studio/ExperienceEditPanel.tsx` — removed the Description textarea;
  `ExperienceFields` dropped `description`; `initial`, `isDirty`, and the posted
  patch now cover only title/startDate/endDate. `Props.description` is KEPT (the
  page still passes it — page untouched, out of named scope) but no longer
  destructured, seeded, or sent.
- `lib/studio/experience-format.ts` — `description` removed from
  `EXPERIENCE_EDITABLE_FIELDS`; added a distinct known-but-locked rejection
  ("description is not editable here"). `EXPERIENCE_FIELD_ORDER` KEEPS description
  (it is the write layout, so the field stays in place on re-dump).

No serializer change needed: `transformExperiencePatch` starts from `{...loaded}`
and applies only the patch keys, so description + orderIndex (never in the patch)
are preserved automatically.

Test: `ralph/tests/task2.mjs` (mirrors the real serializeExperience pipeline
load -> transformExperiencePatch -> dump quotingType '"').

Pass criteria — ALL PASS:
- Test: `T2 result: ALL PASS` (sanitizer rejects description + mixed + still
  rejects company/orderIndex/unknown; accepts title/startDate/endDate only;
  editing title/dates leaves description + orderIndex byte-identical; no-op
  reproduces the file; real kaha-technologies.yaml preserves description +
  orderIndex).
- `npm run typecheck`: clean.
- `npm run build`: clean.
- Browser (fs mode): /studio/experience form shows only Role title, Start date,
  End date (no Description textarea); no console errors.

Commit: `6ddd16e` on `ralph/phase1`. `layout.tsx` WIP left unstaged.

**Task 2 status: PASSED (iteration 1).**

---

## Task 3 — Currently-badge logic (two-part)

### Iteration 1 — PASSED

Files touched (staged by explicit path):
- `components/sections/experience-current.ts` — NEW pure module.
  `isCurrentRole(endDate)` = endDate empty/whitespace OR "Present"
  (case-insensitive). `selectCurrentExperience(list)` returns
  `{ feature, previous }`: feature = the first current entry OR `null` (NO forced
  experience[0] fallback); previous = the rest, or ALL entries when feature null.
- `components/sections/ExperienceSection.tsx` — uses `selectCurrentExperience`
  instead of the inline `find(... === "present") ?? experience[0]`; the feature
  block (which carries the "Currently" badge) now renders only `{feature && (…)}`,
  so when nothing is current there is no badge and every entry is under Previously.

Why the new module: the section is JSX and cannot be imported by a plain node
test, so the behavioral rule was extracted into a dependency-free helper that BOTH
the component and the test import (single source of truth — no duplicated logic).
This is additive and within the task's subject; no proven/forbidden module touched.

Test: `ralph/tests/task3.mjs`.

Pass criteria — ALL PASS:
- Test: `T3 result: ALL PASS`:
  (i) endDate="Present" -> that entry is the feature (Currently);
  (ii) endDate="" (and whitespace) -> current;
  (iii) ALL entries real end dates -> feature is null, NO badge, all under
       Previously (anti-regression: asserts feature !== experience[0]);
  plus case-insensitive matching and first-current-wins.
- `npm run typecheck`: clean.
- `npm run build`: clean (definitive run with dev server stopped; a first run
  hit a transient "/projects/[slug]" collect error caused by the dev server
  contending on .next during build — a clean rebuild passed).
- Browser (fs mode), case (iv): homepage GET / -> 200; #experience shows exactly
  one "Currently" (the real current role, LTIMindtree Elevate = "Present") and
  one "Previously" group; no console errors. Matches prior behavior for the real
  data while the logic is now correct.

Commit: `2bc91a8` on `ralph/phase1`. `layout.tsx` WIP left unstaged.

**Task 3 status: PASSED (iteration 1).**

---

# FINAL SUMMARY — Phase-1 Ralph pilot

All three tasks PASSED on iteration 1. STOPPED per the goal file. No merge, no
push, no github mode. Branch `ralph/phase1` only; Sagar reviews and merges.

| Task | Status | Iterations | Commit |
|------|--------|-----------|--------|
| T1 — lock role+timeline in projects form, preserve on save | PASSED | 1/3 | `c62a702` |
| T2 — lock description in experience form, preserve on save | PASSED | 1/3 | `6ddd16e` |
| T3 — Currently-badge match + drop forced experience[0] fallback | PASSED | 1/3 | `2bc91a8` |

### Exact files touched
- T1: `components/studio/ProjectsEditPanel.tsx`, `lib/studio/projects-format.ts`,
  `lib/studio/projects-serialize.ts` (facts REPLACE -> MERGE to preserve locked
  role/timeline), `ralph/tests/task1.mjs`.
- T2: `components/studio/ExperienceEditPanel.tsx`, `lib/studio/experience-format.ts`,
  `ralph/tests/task2.mjs`. (No serializer change — transformExperiencePatch already
  preserves untouched fields.)
- T3: `components/sections/experience-current.ts` (new pure helper),
  `components/sections/ExperienceSection.tsx`, `ralph/tests/task3.mjs`.
- Pilot bookkeeping: `ralph/phase1-progress.md`, `ralph/phase1-goal.md`.

### Proof output (final combined run)
- `ralph/tests/task1.mjs` -> `T1 result: ALL PASS`
- `ralph/tests/task2.mjs` -> `T2 result: ALL PASS`
- `ralph/tests/task3.mjs` -> `T3 result: ALL PASS`
- `npm run typecheck` -> clean.
- `npm run build` -> clean (definitive run with the dev server stopped).
- Browser (fs mode): projects form = Summary/Type/Platform only; experience form =
  Role title/Start date/End date only; homepage GET / = 200 with one "Currently"
  (real current role) + a "Previously" group; no console errors on any page.

### Flagged for human review (not blockers)
1. `ProjectsEditPanel` `Props.facts` is still `ProjectFacts` (4 keys, from the read
   path) while the form edits only `{type, platform}`; role/timeline arrive as
   props and are simply not shown. Intentional and preserved on save. Same for
   `ExperienceEditPanel` `Props.description` (kept so the page stays untouched,
   received but not destructured/edited). If you prefer, the page props could be
   trimmed in a follow-up (out of this pilot's named scope, so not done here).
2. T3 added a new file `components/sections/experience-current.ts`. Extraction was
   required to write a real behavioral test (the JSX section can't be node-imported)
   and keeps a single source of truth. If you'd rather inline the logic, the test
   would then have to duplicate it — flagged for your call.
3. `.next` build/dev contention: a mid-pilot build hit a transient
   "/projects/[slug]" collect error while the dev server was running. A clean
   rebuild with dev stopped passed. Builds here are run with the dev server down.
4. Pre-existing uncommitted WIP in `app/studio/(dashboard)/layout.tsx`
   (max-width 1100 -> 1300) is NOT mine and was left unstaged/untouched, so it is
   preserved in your working tree.

### Not done (correctly, per hard rules)
No merge, no push, no github-mode run, no writes to main, nothing outside the three
tasks' scope beyond the one testability helper (flagged above). Iteration caps never
hit (each task passed first try).

STOP.
