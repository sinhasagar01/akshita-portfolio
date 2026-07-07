# Phase-1 Ralph pilot — goal

Three mechanical fixes inside the existing /studio panels (post-LAYOUT-1 shell).
Work ONE task at a time, in order. After each, run the pass criteria. Log progress
to ralph/phase1-progress.md after every iteration. Build to the current branch only.

## Hard rules (never violate)

- NEVER commit to main. NEVER merge. NEVER push. Work is committed to the working
  branch only; Sagar reviews and merges in the morning.
- NEVER run in github mode. fs mode only (STUDIO_WRITE_MODE=fs). No GitHub writes.
- Do NOT touch: useDraftForm, the commit path, publish logic, the read-split,
  ListDetailLayout, auth, or any file outside the three tasks' scope.
- Additive/subtractive only within the named files. If a task seems to require
  touching a proven module, STOP and log a blocker instead.
- Max 3 iterations per task. If a task isn't passing after 3, STOP, log why, move to
  the next task, and flag it for human review. Do not thrash.

## Task 1 — remove Role + Timeline from the projects form

Projects facts = {role, type, platform, timeline}. Remove ONLY role + timeline from
the EDITABLE form (ProjectsEditPanel) and from sanitizeProjectsPatch's accepted keys.

- The fields must NOT be editable in the panel and must be REJECTED by the sanitizer.
- CRITICAL: role + timeline must remain PRESERVED in the file on save (they're still
  valid data, just not editable) — the head-splice/read-modify-write must not drop
  them. type + platform stay editable.
  Pass: typecheck + build clean; sanitizer rejects role/timeline (add a test); a save
  editing type/platform leaves role/timeline byte-identical in the file; no other
  facts field affected.

## Task 2 — remove Description from the experience form

Remove the description input from ExperienceEditPanel and drop `description` from the
experience sanitizer's accepted keys.

- description must NOT be editable and must be REJECTED by the sanitizer.
- CRITICAL: description must remain PRESERVED in the file on save (still valid data).
  Pass: typecheck + build clean; sanitizer rejects description; a save editing
  title/dates leaves description byte-identical; orderIndex still preserved.

## Task 3 — Currently-badge logic (two-part)

In ExperienceSection, the "Currently" badge today: (a) matches ONLY literal
endDate === "Present" (case-insensitive), and (b) force-falls-back to experience[0]
if none match — so SOMEONE always shows Currently. Fix BOTH:

- Show "Currently" when endDate is EMPTY/whitespace OR equals "Present" (case-insens).
- REMOVE the forced experience[0] fallback: if NO entry is current, NO badge shows
  (all render under "Previously").
  Pass: typecheck + build clean. Behavioral test (write it): (i) an entry with
  endDate="Present" → Currently; (ii) an entry with endDate="" → Currently; (iii) ALL
  entries have real end dates → NO Currently badge anywhere (this is the anti-regression
  — the old code would wrongly badge experience[0]); (iv) the homepage still renders.

## When all three pass (or hit their iteration cap)

Write a final summary to ralph/phase1-progress.md: per-task status (passed / blocked),
the exact files touched, the proof output, and anything flagged for human review.
STOP. Do not merge, do not push. Sagar reviews and merges.
