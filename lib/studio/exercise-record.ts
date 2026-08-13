// THE BEHAVIOURAL HALF OF COLLECTION READINESS — what a PERSON drove, and when.
//
// ---- ⚠ WHY THIS IS DATA AND NOT A SUITE ------------------------------------------------------
//
// Four collections have produced four first-browser-run defects and not one was visible to a gate.
// The standing rule is that a collection is not done when its suites are green, it is done when
// somebody has driven create-to-publish and a failure path in a browser. That rule has been written
// down for arcs and nothing records whether it was followed — so it is followed when somebody
// remembers, which is the same as not being followed.
//
// `/studio` is owner-gated and `STUDIO_WRITE_MODE=fs` no-ops every write route, so the honest count
// of editor paths drivable from a suite is ZERO. Nothing here can perform the exercise. What it CAN
// do is refuse to let a claim about one go stale, which is the whole design.
//
// ---- ⚠ THE PREDICATES ARE HERE AND NOT IN THE SUITE, FOR THE RECORDED REASON ------------------
//
// A source regex cannot see reachability, and a validator asserted by grep proves its words exist
// and nothing about which arm runs. `bar-clearance` and `draft-status-text` are the precedent: move
// the branching into a pure function, call it with real inputs, assert the returned value.
//
// That matters more than usual here, because THE RECORD WILL BE EMPTY FOR A WHILE. A suite reading
// only the yaml would pass over an empty subject and report the shape of success — this file's
// oldest failure mode. The suite calls these with CONSTRUCTED entries instead, so every refusal is
// proven against an input rather than against whatever the record happens to contain today.
//
// ---- ⚠ AND `NOT EXERCISED` IS NOT `FAILED` ----------------------------------------------------
//
// A gate that reddens main until an owner drives four collections is a gate whose passing state is
// unreachable by anyone reading it — the shape `galleryPublishBlockers` had when it refused every
// item because the editor could not produce a passing one. So an absent exercise is REPORTED BY
// NAME, exactly as `collection-readiness` C3 reports an absent key list, and a PRESENT one is held
// to every rule below.

/** One driven session. Every field is a claim somebody made about something they did. */
export type Exercise = {
  collection: string;
  /** YYYY-MM-DD, the day it was driven. */
  date: string;
  /** The production deployment the driver was actually looking at. Not `main`, not a branch —
   *  the sha production was serving, which is the only thing that says WHICH BUILD was exercised. */
  deployedSha: string;
  /** Viewport widths driven, in px. */
  widths: number[];
  /** The steps performed, in order. */
  steps: string[];
  /** ⚠ VERBATIM. What the screen said, copied rather than described — see `verbatimBlockers`. */
  messages: string[];
  /** A fixture proves the validator can refuse. It is NOT coverage and is excluded from the
   *  exercised set; see `exercisedCollections`. */
  fixture?: boolean;
};

/** The full vocabulary of steps. Create-to-publish plus a failure path, which is the one nobody
 *  performs voluntarily. NOT the set required of any particular collection — see below. */
export const REQUIRED_STEPS = [
  "create",
  "upload",
  "edit",
  "reorder",
  "delete",
  "preview",
  "publish",
  "failure-path",
] as const;

/**
 * ⚠ NOT-APPLICABLE IS A THIRD STATE BESIDE PERFORMED AND NOT-EXERCISED, AND THE FIRST VERSION OF
 * THIS FILE DID NOT HAVE IT — SO IT WOULD HAVE REFUSED A CORRECT BLOG RUN.
 *
 * `COLLECTION_HAS_ORDER` declares `blog: false` deliberately: posts sort by `date`, which every post
 * has and no author arranges, so `reorder-entries` returns 400 `unsupported_collection` for blog.
 * Demanding `reorder` of every collection made blog's passing state UNREACHABLE — the
 * `galleryPublishBlockers` shape one week later, where a gate refused every item because the editor
 * could not produce a passing one. It was latent only because the record is empty, and it would
 * have fired on the first real entry rather than on a fixture.
 *
 * ⚠ AND `orderable` IS PASSED IN RATHER THAN LISTED HERE, WHICH IS THE WHOLE POINT. A hand-written
 * exemption naming blog would be the parallel-list defect arriving inside the gate built to find
 * them — correct today, silently wrong the moment a collection's ordering changes. The caller reads
 * `COLLECTION_HAS_ORDER`, and the suite asserts its parse found every collection so a failed read
 * cannot quietly become "everything is orderable".
 *
 * `null` means the caller could not determine it, and that is refused rather than assumed — a read
 * that cannot run is not permission to claim anything.
 */
export function applicableSteps(orderable: boolean): readonly string[] {
  return REQUIRED_STEPS.filter((s) => s !== "reorder" || orderable);
}

/**
 * ⚠ THE FOLD IS THE ONE GEOMETRIC FACT AN EXERCISE MUST STRADDLE, AND IT IS NOT A PREFERENCE.
 * Below `INSPECTOR_FOLD_PX` the shell passes `inspector={null}` and the canvas must supply the
 * form itself. Gallery gave it none, so below the fold an author saw a preview and NO FORM AT ALL —
 * and the report that surfaced it was "no save draft", which is the missing affordance rather than
 * the missing mechanism. A single-width exercise cannot see that, whichever width it picks.
 *
 * The value is passed in rather than imported, because this file must stay loadable by a suite and
 * `three-pane.ts` is where the constant lives. The suite asserts they agree.
 */
export function straddlesFold(widths: readonly number[], fold: number): boolean {
  return widths.some((w) => w < fold) && widths.some((w) => w >= fold);
}

/**
 * ⚠ AN EXERCISE IS A CLAIM ABOUT A BUILD, SO IT EXPIRES WHEN THE BUILD'S WRITE PATH MOVES.
 * "I drove blog on the 14th" says nothing about a serializer changed on the 15th — and the
 * dangerous part is that it goes on READING like coverage. This is the record's own recurring
 * defect (a claim that ages into being false while still reading as verification) with the one
 * remedy that has ever worked applied mechanically rather than by memory.
 *
 * Dates are compared as ISO strings, which sorts correctly and needs no clock — this file is a leaf
 * and `Date.now()` in a gate is a value that changes while it is being asserted.
 */
export function exerciseStale(exercise: Exercise, writePathLastChanged: string): boolean {
  return writePathLastChanged > exercise.date;
}

/**
 * ⚠ VERBATIM MEANS COPIED, AND THE CHECK IS FOR THE MARKS OF DESCRIPTION RATHER THAN FOR QUALITY.
 * "it showed an error" is a paraphrase and "Something went wrong" is evidence — and the difference
 * decided a real diagnosis here, where a validator correctly refusing a draft marker was reported
 * as "something went wrong" and cost three prompts. Nothing can verify a string is genuine; what it
 * can refuse is the shape of a summary.
 */
export function verbatimBlockers(messages: readonly string[]): string[] {
  const out: string[] = [];
  for (const m of messages) {
    const t = m.trim();
    if (t.length < 3) {
      out.push(`"${m}" is too short to be a message anyone read`);
      continue;
    }
    if (/^(it |the ui |the screen |a |an )?(said|showed|displayed|reported|gave)\b/i.test(t)) {
      out.push(`"${m}" describes a message rather than quoting one`);
    }
  }
  return out;
}

/**
 * Everything wrong with one exercise, as sentences. Empty means it holds.
 *
 * ⚠ THE SHA IS CHECKED FOR SHAPE HERE AND FOR EXISTENCE IN THE SUITE, deliberately. A leaf cannot
 * run git, and asserting only the shape would accept an invented sha — so the suite resolves it and
 * asserts it is an ancestor of `main`. Both halves are needed and neither is sufficient: the shape
 * catches a typo, the resolution catches a fiction.
 */
export function exerciseBlockers(
  exercise: Exercise,
  opts: { fold: number; writePathLastChanged: string | null; orderable: boolean | null }
): string[] {
  const out: string[] = [];
  const where = `${exercise.collection} (${exercise.date})`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(exercise.date)) {
    out.push(`${where}: date must be YYYY-MM-DD`);
  }
  if (!/^[0-9a-f]{7,40}$/.test(exercise.deployedSha)) {
    out.push(`${where}: deployedSha must be a lowercase hex sha of 7 to 40 characters`);
  }
  if (!straddlesFold(exercise.widths, opts.fold)) {
    out.push(
      `${where}: widths ${exercise.widths.join(", ")} do not straddle the ${opts.fold}px fold — ` +
        `below it the shell passes no inspector and the canvas must supply the form itself`
    );
  }
  /* ⚠ A NULL `orderable` IS NOT "ASSUME EVERYTHING APPLIES". The caller could not read the ordering
     table, and defaulting either way is a guess — one demands a step the product refuses, the other
     excuses a step it supports. Both look like a pass. */
  if (opts.orderable === null) {
    out.push(`${where}: whether this collection is orderable could not be read, so the required steps are UNKNOWN`);
  } else {
    const applicable = applicableSteps(opts.orderable);
    const missing = applicable.filter((s) => !exercise.steps.includes(s));
    if (missing.length > 0) {
      out.push(`${where}: steps not performed — ${missing.join(", ")}`);
    }
    /* ⚠ AND THE COMPLEMENT, WHICH IS WHERE A CLAIM AND THE PRODUCT COME APART. Recording `reorder`
       for a collection whose reorder route returns 400 is a claim about something nobody did — and
       without this row the exemption only ever makes the gate MORE permissive, so a false claim
       would pass more easily than a true one. A conditional assertion needs its complement. */
    const impossible = exercise.steps.filter(
      (s) => (REQUIRED_STEPS as readonly string[]).includes(s) && !applicable.includes(s)
    );
    if (impossible.length > 0) {
      out.push(
        `${where}: steps recorded that this collection cannot perform — ${impossible.join(", ")}. ` +
          `Reorder is refused with 400 unsupported_collection where COLLECTION_HAS_ORDER is false`
      );
    }
    /* An unrecognised step name is neither performed nor not-applicable — it is a typo, and a typo
       in a step name reads as coverage of a step nobody ran. */
    const unknown = exercise.steps.filter((s) => !(REQUIRED_STEPS as readonly string[]).includes(s));
    if (unknown.length > 0) {
      out.push(`${where}: unrecognised step(s) — ${unknown.join(", ")}`);
    }
  }
  if (exercise.messages.length === 0) {
    out.push(
      `${where}: no messages recorded. A run that produced no readable output is a run nobody can ` +
        `check, and the failure path exists precisely to produce one`
    );
  }
  out.push(...verbatimBlockers(exercise.messages).map((m) => `${where}: ${m}`));

  /* ⚠ A FIXTURE IS EXEMPT FROM STALENESS, AND ONLY FROM STALENESS. It claims no coverage, so there
     is nothing for a moved write path to invalidate — and holding it to the rule would redden main
     the next time anyone edits the collection it borrows a name from, which is a gate whose common
     failure is benign and therefore a gate people learn to skip.

     ⚠ THE EXEMPTION IS HERE RATHER THAN IN THE SUITE SO IT CAN BE ASSERTED IN BOTH DIRECTIONS. An
     exemption applied by the caller is invisible to any test of this function, and this repository
     has an entry about a conditional assertion that could only fail one way: the complement is
     where a value and its documentation come apart. The suite proves a NON-fixture with the same
     dates IS refused, so the exemption cannot hide the check. */
  if (exercise.fixture) {
    /* nothing — see above */
  } else if (opts.writePathLastChanged === null) {
    /* ⚠ A NULL IS NOT A PASS. It means the suite could not read git, and a read that cannot run is
       not permission to claim the exercise is current — the guard-on-the-guard rule. */
    out.push(`${where}: the write path's last change could not be read, so staleness is UNKNOWN`);
  } else if (exerciseStale(exercise, opts.writePathLastChanged)) {
    out.push(
      `${where}: STALE — the write path changed on ${opts.writePathLastChanged}, after this was ` +
        `driven. Drive it again or the record claims coverage of a build nobody ran`
    );
  }
  return out;
}

/**
 * Which collections have a real exercise. Fixtures are excluded BY NAME rather than by being
 * absent, because a fixture keyed to a real collection would otherwise read as coverage — and the
 * whole point of this file is that a claim of coverage must be earned.
 */
export function exercisedCollections(exercises: readonly Exercise[]): string[] {
  return [...new Set(exercises.filter((e) => !e.fixture).map((e) => e.collection))].sort();
}
