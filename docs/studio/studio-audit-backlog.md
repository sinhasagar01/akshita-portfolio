# /studio audit backlog — closed out

Three parallel code audits produced this backlog on 2026-07-20. It was cleared across
PRs #111 to #136. This is the record of what shipped, what was found on the way, and
the three items deliberately left.

The original framing still holds: studio was more built than "not done" implied. The
unfinished FEEL came from stale copy, no image preview, missing rename and reorder, a
few unexposed fields, and no local write sandbox.

---

## Shipped

**Tier 1 — the unfinished tells.** Broken block-picker note and its dead gating chain,
stale "coming soon" copy on features that had already shipped, dead `opaque`
validator. (#111)

**Tier 2 — image preview.** Thumbnails in every image field, and an owner-gated proxy
so a draft-uploaded image previews before publish rather than 404ing. Uploads commit
to the draft branch, but `/images/**` is served from the deployed `public/`, built
from main — so between upload and publish the owner's own image was unfetchable.
(#113, #114)

**Tier 3 — the missing CMS features.** Reorder for projects, experience and skills
categories. Duplicate names no longer refused: the slug is derived from the human
name, so two roles at one company used to be impossible; it now suffixes `-2`.
(#115, #116)

**Tier 4 — unexposed content.** Experience `description` had no editor at all despite
the site rendering it as the role's bullet lines. About's bold emphasis was keyed to
hardcoded literal phrases, so rewording the bio silently dropped it; it is authored
inline as `**bold**` now, parsed by the case studies' own `parseRich`. (#117)

**Tier 5 — a11y and the missing confirm.** Section remove had no confirmation while
sitting beside the reorder arrows. Hero tablist gained the roving-tabindex pattern
every other tablist had. Discard confirm gained a focus trap; image errors gained a
live region. (#118)

**Tier 6 — save/publish correctness.** "Unpublished" was a commit count, so editing a
field and putting it back left the bar lit and offered a no-op publish. It now reads
the compare's net file list. A failed draft read said "All changes published" rather
than admitting it could not load the draft. (#119)

**Tier 7 — the write sandbox, partly.** `STUDIO_GITHUB_REPO` and `STUDIO_BASE_BRANCH`
make the target configurable, so dev can point at a fork instead of the production
repo. The other half — simulating draft branches on disk — is still open, below.
(#120)

---

## Found while fixing, not in the original audit

The audit missed these because every check the project had compared PUBLIC to PUBLIC.
None of them could see the editor being wrong.

**Sections rendered blank.** `.reveal-card` starts at `opacity: 0` and is only
un-hidden by an `.is-revealed` ancestor, which the static canvas never has. Nine block
kinds rendered invisible — 9 or 10 of 14 sections per case study. The content was
never missing; it was transparent. (#121)

**The canvas did not read as the page.** Wrong backdrop, and it rendered into whatever
width the pane happened to be while breakpoints key off the WINDOW — squeezing a
1064px layout into ~700px. Also `template` was read from live while sections came from
draft, so a saved Mobile/Web change composed the old way until publish. (#122)

**Inline editing stopped at three block types.** The hero — the largest text surface
in a case study — was entirely form-only. (#123, #124)

**The Replace-image wrapper collapsed wide frames.** A width-less positioned wrapper
between the frame and its flex parent made `w-full` resolve against nothing: ~90px
where live rendered 760px. The first fix gave the wrapper a width and broke other
images; the real fix removed the wrapper and put the affordance on the element that
was already positioned. (#128 withdrawn, #129)

**The Sections tab passed neither `template` nor `draftImages`.** There were two entry
points to the editor and only one was wired. The reachable one defaulted to the mobile
composition for every section — the "old design" report. (#130)

**The editor had two copies.** `[slug]/body` was a complete second editor that nothing
linked to. Being unreachable is exactly how it drifted: it kept receiving fixes the
real editor never got. Deleted. (#134)

**The flow itself.** The case-study rail ate the width the canvas needs, so the list
became its own page and each study got its own URL. (#132, #133, #134)

**A stale banner masked a fresh error.** One message slot, two sources, `banner ||
error` — so a failed reorder said nothing and looked like it had silently done
nothing. (#136)

---

## The check that would have caught all of it

`/dev/parity/<slug>` renders every section twice in one document, once as the public
route does and once as the canvas does, and diffs block-level geometry.
`ralph/tests/parity.mjs` holds the walk. Dev-only: middleware 404s `/dev` in
production and the page also `notFound()`s.

It is proven rather than merely green — with the reveal-card bug re-injected it
reports 172 findings, with the collapsed-frame wrapper 1, and 0 when both are
restored. Currently PARITY OK on all 14 sections of the three sections-driven case
studies. Run it after touching anything under `components/case-study`. (#135)

---

## Deliberately not built

**Entry rename.** Identity is the slug is the filename, so renaming means
create-at-new-slug, move the body mdocs, delete-old — atomically. For a project a
half-landed sequence destroys the case-study body. Wants its own PR and its own
atomic-commit proof.

**A true local write sandbox.** #120 made the target configurable, which is the
documented-workflow half. Simulating draft branches on disk, so `fs` mode can exercise
save, create, delete, upload and publish without github mode, is the architectural
half. This is the biggest remaining gap: **every write path is still unexercised end
to end**, because `fs` mode no-ops them all.

**Orphan block-image GC.** Replacing an image points `src` at a new content hash and
leaves the old blob. Deleting needs refcounting, because content-addressing lets two
blocks legitimately share one blob. Costs repo size, not correctness.

---

## Verified solid, do not re-flag

Collection draft-preview in github mode; multi-form accumulation; the DB-1 base logic
and its `expectedHeadOid` guard; publish-merge; discard;
sections-validation-at-publish; the read-split; the search combobox; dialog focus
traps. Intentional locks: the Process 4-stage shape, the Hero 4 tabs, Contact
code-only, swatch token types, heroCover's two devices, and identity slugs being
read-only.
