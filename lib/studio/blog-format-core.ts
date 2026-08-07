// BS-3b — the blog sanitizer's LOGIC and its block table. A dependency-free leaf.
//
// WHY THIS IS A FACTORY. The field combinators (str, obj, arrayOf, imgSpec, videoSrc,
// videoFrame) are SHARED with sections-format — imgSpec and videoSrc carry real
// validation logic (the frame enum, the http(s) rule and its anti-obfuscation strip),
// and two copies of that would diverge the first time one is fixed. But a module ralph
// must unit-test cannot carry an extensionless relative TS import: the suites run under
// `node --experimental-strip-types`, which will not resolve `./sections-format` (and a
// `.ts` specifier, which node WOULD resolve, is rejected by tsc under
// moduleResolution "bundler"). So the combinators are INJECTED rather than imported.
//
// This is the repo's established answer to exactly this problem — rich-markers.ts
// injects `isSafeHref` for the same reason, so its suite can run in plain node while the
// URL policy keeps ONE definition elsewhere.
//
// The split keeps the factory from being viral: blog-format.ts does the wiring once and
// re-exports, so routes import that and never see a combinator. Ralph imports THIS file
// plus the real combinators (with `.ts` specifiers, which .mjs suites may use freely
// since they are outside the tsc program) and injects them — so the code under test is
// the same single implementation the routes run.
//
// A CROSS-CHECK TEST WOULD NOT HAVE BEEN EQUIVALENT: comparing two implementations over
// a corpus proves they agree on the cases someone enumerated, and a URL validator drifts
// precisely on the case nobody did. One implementation closes it by construction.
//
// THE SHARING LINE: the COMBINATORS are shared (one implementation, injected); the
// TABLE is blog's own — VALIDATORS below is `{ [K in BlogBlockKind]: … }` over the BLOG
// union, so a fifth blog kind is a compile error here and a new projects kind is a
// compile error over there, with neither able to silently satisfy the other.
//
// WHY BLOG COULD NOT JUST REUSE sanitizeSectionsPatch. Its table is keyed to the
// projects union, which has no `heading`. #170 concluded the block layer was "reusable
// wholesale" and was CORRECT WHEN WRITTEN — blog had three kinds, all shared. #171 added
// `heading` to the schema and the renderer and silently invalidated that conclusion,
// because nothing writes blog yet so no sanitizer ever saw it. The one existing post has
// two heading blocks and is unsaveable through the projects sanitizer today.
import type { SaveError } from "./site-settings-format";
import type { BlogBlockKind } from "../blog/blocks-raw";
import type { Check, Fail, SanitizedBlock } from "./sections-format";

/** The shared field combinators, injected. Only the drift-prone ones: the two
 *  single-line structural helpers below (invalid, isPlainObject) are defined locally,
 *  since they carry no domain logic and nothing about them can silently diverge. */
export type FieldChecks = {
  str: Check<string>;
  /* ⚠ THE OPTIONS ARG WAS MISSING FROM THIS TYPE, NOT FROM THE IMPLEMENTATION. `sections-format`'s
   * `obj` has taken `omitEmpty` since #171; blog's injected type simply never declared it, so the
   * capability existed and was unreachable from here. Widened in #375 rather than worked around —
   * a second `obj` for blog would have been the copy this factory exists to avoid. */
  obj: (
    shape: Record<string, Check<unknown>>,
    opts?: { omitEmpty?: readonly string[] },
  ) => Check<Record<string, unknown>>;
  arrayOf: <T>(item: Check<T>) => Check<T[]>;
  imgSpec: Check<Record<string, unknown>>;
  videoSrc: Check<string>;
  videoFrame: Check<string>;
  /** `imageBlock.wide` and `.decorative`. Shared, not blog's own — projects already
   *  validates `statCards.highlighted` through the same check. */
  bool: Check<boolean>;
  /** `imageBlock.src`. A path or null, and "" is REJECTED — an empty string can only come
   *  from a form that coerced a null, which is what that gate exists to catch. */
  imageSrc: Check<string | null>;
};

const invalid = (message: string, field?: string): Fail =>
  ({ ok: false, error: { code: "invalid_patch", field, message } });

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The post's publication state. STRICT and closed: this is the public-visibility gate
 *  (getBlogPosts filters `=== "published"`), so a typo must be refused at the write
 *  boundary rather than silently hiding a post forever. */
export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

/** The closed topic set. PR D closed it to EXACTLY the three topics the existing posts carried,
 *  because a list of unused options would be invented rather than enforced. `"Motion in Design"`
 *  is a DELIBERATE DEPARTURE from that rule — it is added ahead of any post that uses it, so the
 *  set is now a growing one authored forward rather than derived from disk. The departure is
 *  named here and in the PR body rather than left to look like the constant drifted. The migration
 *  stays a no-op: every PUBLISHED post remains a member, so `validate-blog-post` F7 still passes.
 *  ENFORCED IN TWO PLACES, each a different question: the sanitizer here refuses a NON-EMPTY value
 *  outside the set at the write boundary (empty is allowed, a draft may be unset), and the publish
 *  gate (validate-blog-post) requires a member on a PUBLISHED post, mirroring `alt` and the title.
 *  Both read this one const, so the editor's dropdown and the two gates cannot disagree. */
export const BLOG_TOPICS = ["AI in product", "Enterprise UX", "Design systems", "Motion in Design"] as const;
export type BlogTopic = (typeof BLOG_TOPICS)[number];

/** Authored ISO date, exactly YYYY-MM-DD. Enforced on the way in because the read path
 *  sorts LEXICALLY on this string — a malformed value would sort arbitrarily, and a
 *  value js-yaml reads back as a Date would break the comparison outright. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type BlogInput = {
  /** The DISPLAYED title, and — measured, not assumed — NOT the slug. The slug is the
   *  filename (`content/blog/<slug>.yaml`); this is an ordinary frontmatter key. `slugify`
   *  runs ONCE, at create (commit-collection-entry.ts), and nothing re-derives it after, so
   *  editing this rewrites a key and is structurally unable to move the file. The read path
   *  has resolved title-then-slug since #170 (select.ts:55). Editable since #216 — the block
   *  before it was a policy nobody re-derived, not a coupling. */
  title?: string;
  dek: string;
  date: string;
  topic?: string;
  status?: BlogStatus;
  /** heroImage is a HEAD path string written ONLY by the owner-gated upload route,
   *  which derives the path server-side. The text path below rejects it. */
  heroImage?: string | null;
};

// What a blog CREATE accepts. `title` is the slug seed and the human name.
export type BlogCreateInput = {
  title: string;
  dek: string;
  date: string;
  topic?: string;
};

export type BlogSanitizers = {
  sanitizeBlogBlocksPatch: (raw: unknown) => { ok: true; blocks: SanitizedBlock[] } | Fail;
  sanitizeBlogPatch: (
    raw: unknown
  ) => { ok: true; patch: Partial<BlogInput> } | { ok: false; error: SaveError };
  sanitizeBlogCreate: (
    raw: unknown
  ) => { ok: true; value: BlogCreateInput } | { ok: false; error: SaveError };
};

/** Build the blog sanitizers over a set of shared field combinators. */
export function makeBlogSanitizers(f: FieldChecks): BlogSanitizers {
  /**
   * Blog's OWN kind -> validator map, exhaustive by construction over BlogBlockKind.
   * richText, pullQuote and videoEmbed are the same shapes the projects table validates
   * (#171 copied their schemas verbatim), spelled here over the SAME shared combinators
   * rather than a second copy of them. `heading` is blog's alone.
   */
  const VALIDATORS: { [K in BlogBlockKind]: Check<Record<string, unknown>> } = {
    heading: f.obj({ text: f.str }),
    richText: f.obj({ paragraphs: f.arrayOf(f.str) }),
    pullQuote: f.obj({ text: f.str }),
    // `alt` is f.str, which ACCEPTS "". That is deliberate and matches videoSrc's own
    // reasoning: a block is born from the picker with src: null and alt: "", so refusing an
    // empty alt at SAVE would make the kind impossible to add at all. A blank alt is caught
    // at PUBLISH by validate-blog-post, which judges published posts only — permissive about
    // half-authored drafts, strict about what may go live.
    /* ⚠ `diagram` IS OMIT-WHEN-EMPTY, which is the only way to add a key without rewriting every
     * post. Same rule `figureGrid.illustration` uses on the projects side, and the FOURTH consumer
     * of it after `screen`, `variant` and `illustration`. Without it, every existing imageBlock
     * would be rejected for not having the key. */
    imageBlock: f.obj({
      src: f.imageSrc,
      alt: f.str,
      caption: f.str,
      diagram: f.str,
      wide: f.bool,
      decorative: f.bool,
    }, { omitEmpty: ["diagram"] }),
    videoEmbed: f.obj({
      src: f.videoSrc,
      // The shared imgSpec: blog's videoEmbed.poster is imgSpecFields() in the schema
      // exactly as projects' is (3a changed only which DIRECTORY it points at, which is
      // a path concern, not a validation one).
      poster: f.imgSpec,
      caption: f.str,
      frame: f.videoFrame,
      aspect: f.str,
      eyebrow: f.str,
      title: f.str,
    }),
  };

  function sanitizeBlogBlock(raw: unknown, at: string): { ok: true; value: SanitizedBlock } | Fail {
    if (!isPlainObject(raw)) return invalid(`${at} must be an object`, at);

    const discriminant = raw.discriminant;
    if (typeof discriminant !== "string") {
      return invalid(`${at}.discriminant must be a string`, at);
    }
    // hasOwnProperty, never `in`: the discriminant is untrusted, and `"constructor" in
    // VALIDATORS` is true on any plain object.
    if (!Object.prototype.hasOwnProperty.call(VALIDATORS, discriminant)) {
      return invalid(`${at}: unknown block kind "${discriminant}"`, at);
    }
    if (!isPlainObject(raw.value)) {
      return invalid(`${at}.value must be an object`, at);
    }
    for (const k of Object.keys(raw)) {
      if (k !== "discriminant" && k !== "value") {
        return invalid(`${at}: unknown block field ${k}`, at);
      }
    }

    const res = VALIDATORS[discriminant as BlogBlockKind](raw.value, `${at}.value`);
    if (!res.ok) return res;
    return { ok: true, value: { discriminant, value: res.value } };
  }

  /**
   * Validate an untrusted `blocks` patch — a FLAT array, no section shell. The editor
   * sends the WHOLE array (it reads all of it, edits one field, writes it back), so this
   * validates the whole array and returns it normalized.
   */
  function sanitizeBlogBlocksPatch(
    raw: unknown
  ): { ok: true; blocks: SanitizedBlock[] } | Fail {
    if (!Array.isArray(raw)) return invalid("blocks must be an array", "blocks");
    const blocks: SanitizedBlock[] = [];
    for (const [i, item] of raw.entries()) {
      const res = sanitizeBlogBlock(item, `blocks[${i}]`);
      if (!res.ok) return res;
      blocks.push(res.value);
    }
    return { ok: true, blocks };
  }

  /**
   * Validate an untrusted blog head patch. Same contract as sanitizeProjectsPatch: known
   * editable keys accepted, server- or route-owned keys rejected with a DISTINCT reason
   * (so a caller can tell "intentionally not editable" from "typo"), unknown rejected.
   */
  function sanitizeBlogPatch(
    raw: unknown
  ): { ok: true; patch: Partial<BlogInput> } | { ok: false; error: SaveError } {
    const bad = (message: string, field?: string) =>
      ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

    if (!isPlainObject(raw)) return bad("patch must be an object");

    const patch: Partial<BlogInput> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key === "title") {
        // TITLE IS EDITABLE, AND THE OLD REJECTION HERE WAS A FALSE CLAIM, NOT A GUARD.
        // It said "title is the entry slug and cannot be edited here". Measured, it is not
        // the slug: the slug is the filename, `title` is a plain frontmatter key, and the
        // commit path writes `content/blog/${slug}.yaml` with slug as a PARAMETER — a title
        // patch cannot reach the filename. So editing it rewrites a key and the URL, the
        // love counter, the image directory and generateStaticParams (all slug-keyed) do
        // not move. A published post still needs a non-empty one — enforced at PUBLISH
        // (validate-blog-post), the only place a required field can be required, mirroring
        // `alt`. Empty here is allowed: the read path falls back to the slug (select.ts:55).
        if (typeof value !== "string") return bad("title must be a string", key);
        patch.title = value;
        continue;
      }
      if (key === "heroImage") {
        return bad("heroImage is uploaded through the image route, not this patch", key);
      }
      if (key === "blocks") {
        return bad("blocks are saved through the blocks path, not this patch", key);
      }
      if (key === "dek") {
        if (typeof value !== "string") return bad("dek must be a string", key);
        patch.dek = value;
        continue;
      }
      if (key === "date") {
        if (typeof value !== "string") return bad("date must be a string", key);
        if (!ISO_DATE.test(value)) return bad("date must be formatted YYYY-MM-DD", key);
        patch.date = value;
        continue;
      }
      if (key === "topic") {
        // CLOSED set now (PR D), but EMPTY IS STILL ALLOWED here — this is the write boundary a
        // draft saves through, and a draft may be unset. What is refused is a non-empty value
        // OUTSIDE the set, so junk cannot reach disk. "Required" is a publish-time question,
        // enforced in validate-blog-post, not here — the same split as `alt` and the title.
        if (typeof value !== "string") return bad("topic must be a string", key);
        if (value !== "" && !(BLOG_TOPICS as readonly string[]).includes(value)) {
          return bad(`topic must be empty or one of ${BLOG_TOPICS.join(", ")}`, key);
        }
        patch.topic = value;
        continue;
      }
      if (key === "status") {
        // STRICT and closed — the visibility gate. Unlike topic, this set IS declared
        // and IS read (getBlogPosts filters on it); a typo would silently hide a post.
        if (typeof value !== "string") return bad("status must be a string", key);
        if (!(BLOG_STATUSES as readonly string[]).includes(value)) {
          return bad(`status must be one of ${BLOG_STATUSES.join(", ")}`, key);
        }
        patch.status = value as BlogStatus;
        continue;
      }
      return bad(`unknown field ${key}`, key);
    }
    return { ok: true, patch };
  }

  /**
   * Validate an untrusted blog CREATE input. `title` is REQUIRED (it seeds the slug);
   * `dek`, `date` and `topic` are optional and default to empty.
   *
   * `status` is REJECTED rather than accepted-with-a-default, and the created post is
   * always `draft` (the serializer writes it). Fail-closed: whole-branch publish means a
   * new post reaches main the next time anything is published, so being born published
   * would put an empty post on the live site. Going live is a deliberate later edit.
   */
  function sanitizeBlogCreate(
    raw: unknown
  ): { ok: true; value: BlogCreateInput } | { ok: false; error: SaveError } {
    const bad = (message: string, field?: string) =>
      ({ ok: false, error: { code: "invalid_patch", field, message } }) as const;

    if (!isPlainObject(raw)) return bad("create input must be an object");

    let topic: string | undefined;
    for (const [key, value] of Object.entries(raw)) {
      if (key === "blocks") return bad("a post is created empty; blocks are added in the editor", key);
      if (key === "heroImage") return bad("heroImage is uploaded after create, not on create", key);
      if (key === "status") return bad("a new post is always created as a draft", key);
      if (key === "date") {
        if (typeof value !== "string") return bad("date must be a string", key);
        if (value !== "" && !ISO_DATE.test(value)) return bad("date must be formatted YYYY-MM-DD", key);
        continue;
      }
      if (key === "topic") {
        if (typeof value !== "string") return bad("topic must be a string", key);
        if (value !== "" && !(BLOG_TOPICS as readonly string[]).includes(value)) {
          return bad(`topic must be empty or one of ${BLOG_TOPICS.join(", ")}`, key);
        }
        if (value !== "") topic = value;
        continue;
      }
      if (key === "title" || key === "dek") {
        if (typeof value !== "string") return bad(`${key} must be a string`, key);
        continue;
      }
      return bad(`unknown field ${key}`, key);
    }
    if (typeof raw.title !== "string" || raw.title.trim() === "") {
      return bad("title is required to create a post", "title");
    }
    return {
      ok: true,
      value: {
        title: raw.title,
        dek: (raw.dek as string | undefined) ?? "",
        date: (raw.date as string | undefined) ?? "",
        ...(topic !== undefined ? { topic } : {}),
      },
    };
  }

  return { sanitizeBlogBlocksPatch, sanitizeBlogPatch, sanitizeBlogCreate };
}
