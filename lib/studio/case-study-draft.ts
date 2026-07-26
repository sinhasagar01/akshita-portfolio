// P4 4(a) — the case-study draft read, for the /studio preview surface ONLY.
//
// BS-3c — THIS FILE IS NOW A THIN WRAPPER. Its mechanism (the branch compare, the
// per-slug scope gate, the draftImages derivation, the unstable_cache wiring and the
// fail-safe degrade-to-live) moved to entry-draft.ts and is shared with blog. Nothing
// about the projects behaviour changed: the same inputs produce the same shape, and
// keeping `getCaseStudyDraftState` exported means neither of its two callers moved —
// a moved call site is a change to reason about, a wrapper is not.
//
// THE READ-SPLIT INVARIANT (unchanged): the public case-study page and its og route read
// main via getCaseStudyData and STAY main-only, so a draft edit can never leak to the
// live site. This is the draft-preferring twin, reachable only from the owner-gated
// /studio preview.
import { getEntryDraftState } from "./entry-draft";

export type CaseStudyDraftState = {
  /** Which branch the sections below came from. "live" means either no draft exists,
   *  this slug is unchanged on it, or the read degraded. */
  source: "draft" | "live";
  /** The RAW sections value (unmapped, exactly like CaseStudyData.rawSections), or null
   *  when source is "live" — the caller then uses the live read. */
  rawSections: unknown;
  /** PUBLIC paths (/images/**) of images that changed on the draft branch. */
  draftImages: string[];
  /** The draft's `template`, or null when the sections came from live. */
  template: string | null;
};

/**
 * The draft version of one project's `sections`, or live. github mode only; any GitHub
 * error degrades to live rather than breaking the preview.
 */
export async function getCaseStudyDraftState(slug: string): Promise<CaseStudyDraftState> {
  const state = await getEntryDraftState("projects", slug);
  // Renamed field only: `raw` is this collection's `sections`.
  return {
    source: state.source,
    rawSections: state.raw,
    draftImages: state.draftImages,
    template: state.template,
  };
}
