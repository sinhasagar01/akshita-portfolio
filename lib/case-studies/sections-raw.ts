// P4 4(b)-ii — the RAW `sections` shapes, DERIVED from keystatic.config.
//
// THE DISTINCTION THIS MODULE EXISTS TO HOLD. `lib/case-studies/types.ts` is the
// RENDERER's contract — what the adapter EMITS. This is what the adapter CONSUMES,
// and they are not the same shape. The adapter's own header lists the divergences:
//
//   raw (here)                        types.ts (the adapter's output)
//   translateX / translateY numbers   translate: [x, y] tuple
//   "**bold**" plain string           Rich = string | RichRun[]
//   glow: { text: "", ... } present   glow?: GlowWord   (empty -> undefined)
//   devices: DeviceSpec[]             [DeviceSpec, DeviceSpec] tuple
//   src: string | null                src: StaticImageData | string
//
// The editor and the sanitizer both work on RAW. Typing a form against types.ts
// would be wrong for at least five kinds — it would invent a `translate` tuple the
// file has never held and drop the empties the surgical bar requires be preserved.
//
// It lives beside the adapter rather than in lib/studio because it describes the
// CONTENT SCHEMA, which is upstream of both the renderer and the editor, and
// because lib/studio -> lib/case-studies is the established dependency direction.
// The keystatic.config import is type-only, so nothing reaches the SSG bundle.
//
// DERIVED, NOT MIRRORED. Everything below comes from the Keystatic schema through
// its own `Entry` helper, so the schema is the single source. A field renamed in
// keystatic.config is a compile error here, in the registry, and in the sanitizer,
// rather than a silent drift. Type-only imports, so this costs nothing at runtime
// and is safe to pull into a client component.
import type { Entry } from "@keystatic/core/reader";
import type keystaticConfig from "@/keystatic.config";

type ProjectEntry = Entry<(typeof keystaticConfig)["collections"]["projects"]>;

/** One section as the file holds it (the shell plus its blocks). */
export type RawSection = ProjectEntry["sections"][number];

/** One block as the file holds it — a `{ discriminant, value }` union. */
export type RawBlock = RawSection["blocks"][number];

/**
 * The 16 block kinds the sections schema can express.
 *
 * CORRECTED FROM 14. The count was right when written and decayed silently as `richText`,
 * `closingLine` and `videoEmbed` were added to the schema — nothing recomputes a number
 * written in prose. DERIVED NUMBERS DECAY QUIETLY: state what a count IS and re-derive it
 * rather than trusting the last person who wrote it down. The union itself is derived and
 * was never wrong; only the comment was.
 *
 * NOT `types.ts`'s `BlockKind`, which is SIXTEEN: it also carries `featureStory`
 * and `beforeAfterStory`, boat-crest's bespoke scroll-story kinds, which the
 * sections schema cannot express and content can therefore never hold. Keying the
 * registry off `BlockKind` would demand forms for two unreachable kinds.
 */
export type SectionBlockKind = RawBlock["discriminant"];

/** The `value` of one kind's block, per kind. */
export type RawValue<K extends SectionBlockKind> = Extract<RawBlock, { discriminant: K }>["value"];

/**
 * Compile-time proof that a hand-written list of kinds is COMPLETE, not merely
 * correct. `satisfies readonly SectionBlockKind[]` alone catches a typo but happily
 * accepts a list that is MISSING a kind — which is the drift that matters, since a
 * kind absent from a list is a kind silently unhandled.
 *
 * Used as `type _ = AssertComplete<typeof BLOCK_KINDS>` beside each list.
 *
 * THIS MODULE IS TYPE-ONLY BY DESIGN. Exporting a runtime const from here would
 * force `lib/case-studies/adapter.ts` into its first ever runtime local import,
 * and the ralph suites run the adapter under `node --experimental-strip-types`,
 * which erases type imports but must RESOLVE value ones — so a value export here
 * breaks the test harness (node needs an explicit `.ts` extension; tsc forbids one
 * without allowImportingTsExtensions). Each consumer therefore keeps its own list
 * or table and has the schema police it from here.
 */
export type AssertComplete<L extends readonly SectionBlockKind[]> =
  Exclude<SectionBlockKind, L[number]> extends never
    ? true
    : ["missing block kinds:", Exclude<SectionBlockKind, L[number]>];
