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

Commit: (recorded below after `git commit`).
