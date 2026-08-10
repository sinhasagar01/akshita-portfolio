// The toaster's pure half — what a toast becomes, given what happened.
//
// ⚠ ONE ID PER OPERATION, AND THAT IS THE WHOLE REASON THIS FILE EXISTS. Two operations can be in
// flight at once — a draft save completing while a publish is still merging is the ordinary case,
// not the exotic one — and a shared "current toast" passes that by accident whenever the timing
// happens to be sequential. Keyed by id, the save resolves the save and the publish keeps waiting.
//
// ⚠ AND IT IS PURE SO A SUITE CAN EXERCISE IT DIRECTLY. /studio is owner-gated in middleware, so
// the browser path cannot be driven from a gate; the arithmetic of the state machine can. Same
// reason `bar-clearance.ts` and `publish-preview.ts` are leaves.

export type ToastKind = "pending" | "ok" | "refusal";

export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  /** The server's own sentence, unmodified. `publishBlockers` is the one source. */
  message: string;
  action?: { label: string; href?: string; retry?: true };
  /** Set once a publish has merged, so the deploy poll knows what to ask about. */
  sha?: string;
};

export const TOAST_CAP = 3;
export const TOAST_DRAIN_MS = 6000;
/** ⚠ NOTHING STAYS PENDING FOREVER. A merge that neither resolves nor fails leaves the author with a
 *  spinner and no verb; at this point the toast says so and offers Retry. It does NOT cancel the
 *  operation — the request may still land — so the wording must not claim it failed. */
export const TOAST_SLOW_MS = 20000;

/** Newest first; past the cap the OLDEST is dropped rather than the newest queued, so the thing the
 *  author just caused is always the thing they can see. */
export function push(list: Toast[], t: Toast): Toast[] {
  return [t, ...list].slice(0, TOAST_CAP);
}

/** Resolve IN PLACE. A second card for the result would make one action read as two. If the pending
 *  card is already gone — dismissed by hand, or pushed past the cap — the result is raised fresh
 *  rather than dropped, because a result the author never sees is worse than an extra card. */
export function resolve(list: Toast[], id: number, patch: Omit<Toast, "id">): Toast[] {
  return list.some((t) => t.id === id)
    ? list.map((t) => (t.id === id ? { ...patch, id } : t))
    : push(list, { ...patch, id });
}

export function dismiss(list: Toast[], id: number): Toast[] {
  return list.filter((t) => t.id !== id);
}

/** Only `ok` drains — and NOT while it is still waiting on a deployment.
 *
 *  ⚠ THE `sha` CLAUSE IS THE WHOLE OF BUG B. A publish success is `ok`, so it drained at 6s — and
 *  the deploy poll keys off the card carrying the sha, so dismissing the card STOPPED THE POLL. A
 *  Vercel build takes 60 to 120 seconds, so READY and "View deployment" could never be reached: the
 *  seam failed quiet correctly and could never succeed. A card with an unanswered question on it
 *  stays until the question is answered. */
export function drains(t: Toast): boolean {
  return t.kind === "ok" && !t.sha;
}

/** ⚠ AND THE WAIT IS BOUNDED, because "stays until answered" must not mean "stays forever". A build
 *  that never reports leaves the card pinned with no verb — the shape the slow-warning exists to
 *  prevent, one surface out. At the deadline the sha is dropped: the card keeps its true claim
 *  ("rebuilding") and becomes drainable again. */
export const DEPLOY_DEADLINE_MS = 180000;

/** The deploy poll's answer, turned into what the card should say. `unavailable` is a REAL answer:
 *  it means we cannot know, so the card keeps the weaker true claim rather than the stronger false
 *  one. It must never become "live". */
export function deployPatch(
  state: "building" | "ready" | "error" | "unavailable",
  url?: string
): Omit<Toast, "id"> | null {
  switch (state) {
    case "ready":
      return {
        kind: "ok",
        title: "Site published",
        message: "Your changes are live.",
        ...(url ? { action: { label: "View deployment", href: url } } : {}),
      };
    case "error":
      return {
        kind: "refusal",
        title: "Published, but the build failed",
        message: "The merge landed on main and the deployment did not finish. The live site still shows the previous version.",
        ...(url ? { action: { label: "View deployment", href: url } } : {}),
      };
    /* building and unavailable both leave the card where it is — one because it is still true, the
       other because we have nothing better to say. Returning null rather than a no-op patch keeps
       "no change" distinguishable from "changed to the same thing". */
    default:
      return null;
  }
}
