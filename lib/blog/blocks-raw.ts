// Blog PR 2 — the RAW blog block shapes, DERIVED from keystatic.config.
//
// The sibling of lib/case-studies/sections-raw.ts, and the same discipline: the
// Keystatic schema is the single source, so a field renamed in the config is a compile
// error here and in the renderer, not a silent drift. Type-only imports, so this costs
// nothing at runtime and is safe to pull into a server or client component.
//
// A blog post's `blocks` is a FLAT `{ discriminant, value }` union — no section shell
// (a post has no named chapters). Only four kinds exist: heading, richText, pullQuote,
// videoEmbed. The blog renderer reads these raw values directly (they are flat and
// simple) and applies parseRich/renderRich to the string fields — it does NOT go through
// the case-study adapter, whose adaptBlock is private and whose output shape carries
// case-study-only concerns (translate tuples, device narrowing).
import type { Entry } from "@keystatic/core/reader";
import type keystaticConfig from "@/keystatic.config";

type BlogEntry = Entry<(typeof keystaticConfig)["collections"]["blog"]>;

/** One blog block as the file holds it — a `{ discriminant, value }` union. */
export type BlogRawBlock = NonNullable<BlogEntry["blocks"]>[number];

/** The block kinds a post can express. */
export type BlogBlockKind = BlogRawBlock["discriminant"];

/** The `value` of one kind's block, per kind. */
export type BlogRawValue<K extends BlogBlockKind> = Extract<
  BlogRawBlock,
  { discriminant: K }
>["value"];
