// Blog PR 3b — validate a draft's blog post BEFORE publishing. The sibling of
// validate-draft-sections.ts, and deliberately a DIFFERENT KIND OF CHECK from the
// sanitizer next door.
//
//   blog-format.ts asks "is this well-formed INPUT" — it guards the write boundary
//   against an untrusted request body.
//   this asks "will this RENDER" — it guards the published site against content that
//   reached disk some other way.
//
// WHAT ACTUALLY BREAKS A BLOG BUILD — measured, not assumed. The pre-PR analysis guessed
// that BlogProse would throw a TypeError on a malformed block. It does not, because it
// never sees one: EVERY path to it goes through a Keystatic reader (createReader on the
// public path, createGitHubReader on the draft path), and the reader VALIDATES against
// the schema and COERCES what it accepts. Probed against seven malformed shapes:
//
//   REJECTED by the reader (it throws) — richText whose paragraphs is not an array;
//     a heading whose text is a number; an unknown discriminant; a videoEmbed whose src
//     is not a string.
//   COERCED by the reader (they never reach the renderer as written) — a null block
//     entry; a richText with no paragraphs key; a heading with a null value.
//
// So the real hazard is the FIRST group, and it is worse than a render bug: the reader
// throws inside `reader.collections.blog.all()`, which the blog index and
// generateStaticParams both call, so the failure is a BUILD failure for the WHOLE SITE —
// not a broken /blog. Merge one malformed post to main and every subsequent build fails
// until someone reverts it.
//
// THAT is this gate's job: refuse the publish instead. Same purpose as the projects gate,
// reached by a different mechanism — projects fails loud in its ADAPTER, blog fails loud
// in its READER. The claim to avoid is that this replicates the projects gate's coverage
// of half-authored content: it does not, because an empty-src videoEmbed or a missing
// image is legal for a post and renders as nothing.
//
// This is deliberately STRICTER than the reader (it refuses the coerced group too). Those
// shapes cannot come from the studio — the sanitizer rejects them on the way in — so
// refusing to publish a hand-committed file that carries them costs nothing real.
//
// Dependency-free beyond js-yaml + a type-only import, so it is unit-exercisable directly.
import { load } from "js-yaml";
import type { SaveError } from "./site-settings-format";

export type BlogValidation = { ok: true } | { ok: false; error: SaveError };

/**
 * Which changed files in a publish compare are blog posts. Lives HERE, beside the
 * validator that consumes it, so a ralph suite can assert it directly — publish-site-
 * settings.ts pulls in the GitHub layer and cannot be imported by a pure test. The
 * bare-slug shape matches the rest of the studio's path guards, and the `$` anchor keeps
 * a nested path (content/blog/<slug>/anything.yaml) out.
 *
 * The projects equivalent stays inline in the publish loop — untouched by this PR.
 */
export const BLOG_POST_PATH_RE = /^content\/blog\/([a-z0-9-]+)\.yaml$/;

/** The kinds BlogProse can render. Spelled here rather than imported from the sanitizer's
 *  table on purpose: this asks what the RENDERER handles, and the renderer's own table is
 *  the authority. If the two ever disagree, that disagreement is a real bug and this
 *  should surface it rather than inherit it.
 *
 *  DELIBERATELY NOT DERIVED from BlogProse's RENDERERS, even though that is now a mapped
 *  type and could be. Deriving it would launder exactly the disagreement this exists to
 *  catch. EXPORTED so ralph can assert BLOG_PICKER_ORDER is a subset of it — a kind an
 *  author can pick but the renderer will not draw is the silent failure that let
 *  videoEmbed.poster sit authorable and unseen for three PRs. */
export const RENDERABLE = new Set(["heading", "richText", "pullQuote", "imageBlock", "videoEmbed"]);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * ⚠ THE LITERAL IS ASSEMBLED RATHER THAN WRITTEN OUT — see the marker gate below. Exported so the
 * inspector's advisory mark tests the SAME string this file forbids.
 */
export const DRAFT_MARKER = "@" + "@ GAP";

/**
 * ⚠ THE PLACEHOLDER'S OWN WORDS, BECAUSE THE SENTINEL IS ONE TYPO FROM GONE AND THE SHOUT IS NOT.
 *
 * A placeholder has two halves. `DRAFT_MARKER` is the machine's half; the English beside it is the
 * author's. Only the first was load-bearing, so damaging it disarmed the gate entirely while the
 * half that declares its own intent in plain English survived untouched — and shipped.
 *
 * ⚠ THIS IS NOT HYPOTHETICAL AND IT IS WHY THE RULE CHANGED. A backspace at the start of a
 * paragraph merged it into the one above — ordinary contentEditable behaviour — and typed three
 * characters over the opening sentinel. Both sentinels died in that one keystroke. The post
 * published carrying a sentence that says, in capitals, that it must not ship, and it was served
 * from the live site until someone read it.
 *
 * ⚠ AND THE PREMISE THAT MADE IT INVISIBLE WAS ALREADY WRITTEN DOWN. `blog-registry` section M
 * says "nothing here reads English, so a marker that looks like prose is indistinguishable from
 * prose", and concludes that the markers are therefore LOUD. Loudness protects a human reader. It
 * does nothing for a gate, and it made the sentinel a single point of failure that ordinary
 * editing destroys. THE GATE NOW READS THE ENGLISH TOO, which is the only half a typo leaves
 * intact often enough to matter.
 *
 * ⚠ ASSEMBLED, LIKE THE SENTINEL ABOVE, so this file does not contain the strings it forbids and a
 * future sweep for stray placeholders cannot flag its own guard.
 *
 * The false-positive cost is stated rather than dismissed: a post that genuinely wants one of these
 * sentences is refused at publish and must reword it. Two phrases this specific, in prose, is a
 * price worth paying against a placeholder reaching the live site a second time.
 */
export const DRAFT_PHRASES = ["EXAMPLE GOES" + " HERE", "THIS SENTENCE MUST NOT" + " SHIP"];

/** True when the raw document still carries a placeholder by EITHER half. */
export function hasPlaceholder(raw: string): boolean {
  if (raw.includes(DRAFT_MARKER)) return true;
  const upper = raw.toUpperCase();
  return DRAFT_PHRASES.some((p) => upper.includes(p));
}

/** One publish blocker: which field an author must fix, and the sentence that says why. */
export type PublishBlocker = { field: string; message: string };

/**
 * THE AUTHOR-REACHABLE PUBLISH BLOCKERS, DERIVED HERE AND NOWHERE ELSE.
 *
 * ⚠ THE COPY LIVES WITH THE RULE THAT FIRES IT. `validateBlogPost` consumes this, and so does the
 * studio inspector's advisory mark — one function, two consumers. A client-side code-to-copy map
 * would be a second spelling of these sentences and would drift from them, which is the shape this
 * repo deletes on sight.
 *
 * ⚠ AUTHOR-REACHABLE IS THE SUBJECT, AND IT IS NARROWER THAN "publish-blocking". Derived by asking
 * of each rule below whether the studio can produce the state: the SHAPE rules cannot — the
 * sanitizer refuses a non-string discriminant or a null block on the way in, so only a
 * hand-committed file reaches them and no inspector mark could help. The four here are exactly the
 * ones an author can create by typing, or by not typing.
 *
 * ⚠ AND IT IS ADVISORY AT AUTHORING TIME, NEVER BLOCKING AT SAVE. An imageBlock is BORN
 * `src: null, alt: ""`, so refusing an empty alt at save would make the kind unaddable — the split
 * this validator exists to express. The mark moves the DISCOVERY earlier; the wall stays at publish.
 *
 * ⚠ A FIELD IS JUDGED ONLY IF ITS KEY IS PRESENT, AND THAT RULE APPLIES TO ALL FOUR. The first
 * version applied it to `raw` alone and judged `title` and `topic` unconditionally — so the alt
 * call site, which supplies only `blocks`, got spurious title and topic blockers and worked purely
 * because it filtered by field. A consumer asking about ONE field must not be told about three.
 * Presence, not definedness: `validateBlogPost` passes all four keys from the parsed document, so a
 * post with no `title:` line is still judged and still refused. Its own suite caught this.
 */
export function publishBlockers(
  input: { raw?: string; title?: unknown; topic?: unknown; blocks?: unknown },
  allowedTopics: readonly string[]
): PublishBlocker[] {
  const out: PublishBlocker[] = [];

  if ("raw" in input && typeof input.raw === "string" && hasPlaceholder(input.raw)) {
    out.push({
      field: "body",
      message: "a draft marker is still in the body — every placeholder must be replaced before publishing",
    });
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if ("title" in input && title === "") {
    out.push({
      field: "title",
      message: "title must not be empty on a published post — it falls back to the slug, which is not a title",
    });
  }

  const topic = typeof input.topic === "string" ? input.topic.trim() : "";
  if (!("topic" in input)) {
    /* not asked about */
  } else if (topic === "") {
    out.push({ field: "topic", message: "topic must be set on a published post, one of " + allowedTopics.join(", ") });
  } else if (!allowedTopics.includes(topic)) {
    out.push({ field: "topic", message: `topic "${topic}" is not one of ${allowedTopics.join(", ")}` });
  }

  /* Malformed blocks are the SHAPE rules' subject, not this one's — skipped rather than crashed on,
     so a hand-committed file still gets the shape message it deserves from the caller. */
  if (Array.isArray(input.blocks)) {
    for (const [i, block] of input.blocks.entries()) {
      if (!isPlainObject(block) || block.discriminant !== "imageBlock") continue;
      const value = block.value;
      if (!isPlainObject(value)) continue;
      if (typeof value.src !== "string" || value.src === "") continue;
      if (value.decorative === true) continue;
      const alt = typeof value.alt === "string" ? value.alt.trim() : "";
      if (alt === "") {
        out.push({
          field: `blocks[${i}].alt`,
          message: `blocks[${i}].value.alt must not be empty on a published post — describe the image, or tick "Decorative"`,
        });
      }
    }
  }
  return out;
}

/**
 * Validate ONE post's raw yaml the way the public build will render it. `slug` only
 * labels the error.
 *
 * DRAFTS ARE NOT JUDGED HERE, and that is a decision with evidence behind it. A draft's
 * blocks are never rendered (generateStaticParams reads the status-filtered list,
 * dynamicParams is false, and the route component gates on status), and since PR 3b the
 * index read filters BEFORE mapping, so nothing touches a draft's blocks at build time at
 * all. Meanwhile a status flip is itself a change to the file, so the post is validated
 * at the publish that makes it live — there is no window. Judging drafts would only mean
 * one half-written post blocking the publish of everything else in the draft branch,
 * which on a daily-cadence collection is real recurring friction for no safety.
 *
 * `allowedTopics` IS PASSED IN, NOT IMPORTED, and that is deliberate. This file is
 * dependency-free beyond js-yaml and a type-only import, which is what lets a ralph suite
 * import and EXECUTE it directly (its sibling validate-draft-sections imports a value and so
 * can only be source-inspected). A relative import of BLOG_TOPICS would forfeit that. The set
 * is the caller's to supply — publish-site-settings passes BLOG_TOPICS, the one source of
 * truth — so the gate stays a pure function of its inputs.
 */
export function validateBlogPost(
  slug: string,
  raw: string,
  allowedTopics: readonly string[]
): BlogValidation {
  const doc = (load(raw) ?? {}) as { status?: unknown; title?: unknown; topic?: unknown; blocks?: unknown };

  // Not published -> not this seam's to judge (see above).
  if (doc.status !== "published") return { ok: true };

  const fail = (message: string): BlogValidation => ({
    ok: false,
    error: { code: "invalid_blocks", field: slug, message: `${slug}: ${message}` },
  });

  // ---- THE DRAFT-MARKER GATE ----------------------------------------------------------
  //
  // A drafted post can carry placeholders for sentences only the author can write. They are
  // marked loudly rather than left as plausible prose, because PUBLISH IS WHOLE BRANCH — a
  // draft with markers in it ships those markers the moment the branch is published for any
  // other reason, and no gate here reads English.
  //
  // Permissive at save, strict at publish, exactly like the title gate: a marker is CORRECT in
  // a draft and is the one thing that must never reach a published post.
  //
  // ⚠ THE LITERAL IS ASSEMBLED RATHER THAN WRITTEN OUT. This file would otherwise contain the
  // very string it forbids, and any future sweep looking for stray markers across the repo
  // would flag its own guard. Same discipline as never transcribing a comment delimiter while
  // describing one.
  //
  // Checked against the RAW document rather than walked per block, so it catches a marker in a
  // title, a dek, a caption or any block kind — including kinds added after this was written.
  /* ⚠ THE HEAD RULES COME FROM `publishBlockers` — one source, two consumers. The ORDER of the
     original inline checks is preserved exactly (marker, title, topic, then shape, then alt), so a
     hand-committed file with both a malformed block and a blank alt still gets the shape message
     first, as it always did. */
  const blockers = publishBlockers({ raw, title: doc.title, topic: doc.topic, blocks: doc.blocks }, allowedTopics);
  const head = blockers.find((bl) => bl.field === "body" || bl.field === "title" || bl.field === "topic");
  if (head) return fail(head.message);

  // ---- THE TITLE GATE, THE SAME SHAPE AS alt BELOW -------------------------------------
  //
  // #216 made `title` editable, and the read path falls back to the SLUG when it is blank
  // (select.ts:55) — so a blanked title never crashes, it publishes a post HEADED BY ITS OWN
  // SLUG (`what-a-data-table-teaches-you-about-trust` as an <h1>). That is the same class of
  // defect as an unlabelled image: renderable, live, and wrong. Permissive at save (an author
  // may clear it mid-edit), strict at publish — this is the one gate they cannot walk past.
  // In the file `title` is a plain scalar (fields.slug stores the name half unwrapped), so a
  // raw load reads a string; `.trim()` guards whitespace-only.
  // ---- THE TOPIC GATE, THE SAME SHAPE AS title ABOVE AND alt BELOW ---------------------
  //
  // PR D closed the topic set (BLOG_TOPICS) and made it REQUIRED to publish. The split is the
  // one alt and the title use: the sanitizer allows an empty topic so a draft can save unset,
  // and this file (published posts only) is the one gate an author cannot walk past, so it is
  // the only place "required" can be real. A non-member cannot normally reach here — the
  // sanitizer refuses it at save and the editor is a closed dropdown — but a hand-committed
  // file can, so both the empty and the off-set cases are refused, each with its own message.
  //
  // The empty-topic RENDER branches stay reachable and are NOT dead code: a draft previewing in
  // the studio canvas can still have no topic, so the article head's `topic ? … : null` and the
  // OG card's dropped eyebrow row still fire. This gate only judges PUBLISHED posts.
  // A post with no blocks array renders an empty prose column — legal, not a failure.
  if (doc.blocks === undefined || doc.blocks === null) return { ok: true };
  if (!Array.isArray(doc.blocks)) return fail("blocks must be an array");

  for (const [i, block] of doc.blocks.entries()) {
    const at = `blocks[${i}]`;
    // BlogProse reads block.discriminant unconditionally, so a null entry is a TypeError.
    if (!isPlainObject(block)) return fail(`${at} must be an object`);
    const { discriminant, value } = block;
    if (typeof discriminant !== "string") return fail(`${at}.discriminant must be a string`);
    if (!RENDERABLE.has(discriminant)) return fail(`${at}: unknown block kind "${discriminant}"`);
    // Every branch of the renderer's switch dereferences value.
    if (!isPlainObject(value)) return fail(`${at}.value must be an object`);

    switch (discriminant) {
      case "heading":
      case "pullQuote":
        if (typeof value.text !== "string") return fail(`${at}.value.text must be a string`);
        break;
      case "richText":
        // BlogProse calls .map on this directly.
        if (!Array.isArray(value.paragraphs)) {
          return fail(`${at}.value.paragraphs must be an array`);
        }
        for (const [j, p] of value.paragraphs.entries()) {
          if (typeof p !== "string") return fail(`${at}.value.paragraphs[${j}] must be a string`);
        }
        break;
      case "videoEmbed":
        // BlogProse calls src.trim() before deciding whether to render at all.
        if (typeof value.src !== "string") return fail(`${at}.value.src must be a string`);
        if (value.caption !== undefined && typeof value.caption !== "string") {
          return fail(`${at}.value.caption must be a string`);
        }
        break;
      case "imageBlock": {
        // src is `string | null` — null is an unset image, which BlogProse skips.
        if (value.src !== null && typeof value.src !== "string") {
          return fail(`${at}.value.src must be a string or null`);
        }
        if (value.caption !== undefined && typeof value.caption !== "string") {
          return fail(`${at}.value.caption must be a string`);
        }
        // ---- THE ALT GATE, AND THIS IS WHERE "REQUIRED" BECOMES TRUE ------------------
        //
        // The schema types `alt` as a plain text field and the sanitizer accepts "", both
        // deliberately: a block is born with src: null and alt: "", so refusing an empty
        // alt at SAVE would make the kind impossible to add at all. That is videoSrc's
        // reasoning applied to a second field — permissive about half-authored drafts,
        // strict about what may go live.
        //
        // This file judges PUBLISHED posts only, so it is the one gate an author cannot
        // walk past, and therefore the only place a required field can actually be
        // required. A required field the author can leave empty is not required.
        //
        // `decorative` is the deliberate exemption. Without it an author facing this gate
        // types "image" into alt to clear it, which is worse than empty: empty is a known
        // absence a screen reader can skip, while "image" is confidently wrong.
        {
          const altBlocker = blockers.find((bl) => bl.field === `blocks[${i}].alt`);
          if (altBlocker) return fail(altBlocker.message);
        }
        break;
      }
    }
  }

  return { ok: true };
}
