import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "@/keystatic.config";
import { isKeystaticLockedPath } from "@/lib/studio/keystatic-lock";

// P4 4(b)-i — the LOAD-BEARING half of the Keystatic lockout (see
// lib/studio/keystatic-lock.ts for why these projects must not be written here).
//
// `POST /api/keystatic/update` is Keystatic's ONLY local write path — verified in
// its handler source, which dispatches exactly three routes (GET tree, GET blob,
// POST update) and 404s the rest. Its body is
// `{ additions: [{path, contents}], deletions: [{path}] }` over repo-relative
// paths, and it writes/rms them with no further checks.
//
// So the slug lives in the BODY, not the URL. That is why this guard sits here and
// not in middleware: reading the body in middleware consumes the stream, and the
// request cannot then be forwarded intact.
const handler = makeRouteHandler({ config });

export const GET = handler.GET;

export async function POST(request: Request): Promise<Response> {
  if (!new URL(request.url).pathname.endsWith("/api/keystatic/update")) {
    return handler.POST(request);
  }

  // The body must be read to be inspected, which consumes it — so it is buffered
  // and a fresh Request is handed on. Anything unparseable falls through
  // untouched, so Keystatic still returns its own 400 rather than this guard
  // inventing one.
  const body = await request.text();
  let locked: string[] = [];
  try {
    const parsed = JSON.parse(body) as {
      additions?: { path?: unknown }[];
      deletions?: { path?: unknown }[];
    };
    locked = [...(parsed?.additions ?? []), ...(parsed?.deletions ?? [])]
      .map((f) => f?.path)
      .filter((p): p is string => typeof p === "string")
      .filter(isKeystaticLockedPath);
  } catch {
    /* fall through to Keystatic's own validation */
  }

  if (locked.length > 0) {
    return Response.json(
      {
        error: "keystatic_locked",
        message:
          "This case study is edited in /studio. Keystatic would rewrite its block image paths and delete the originals, so saving it here is blocked.",
        paths: locked,
      },
      { status: 403 }
    );
  }

  return handler.POST(
    new Request(request.url, { method: "POST", headers: request.headers, body })
  );
}
