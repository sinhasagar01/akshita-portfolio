// POST /api/studio/save-draft — GH-5b on-blur draft auto-save (owner-gated).
//
// INTERNET-EXPOSED WRITE ENDPOINT. The owner gate runs FIRST, before any GitHub
// call. github mode only (fs = no-op). The client never holds the token — it
// posts the patch, the server commits to the DRAFT branch via the proven
// commitSiteSettings, and returns the fresh live-vs-draft differs for the badge.
// Writes the draft branch only, never main.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { load } from "js-yaml";
import { verifyOwnerSession, SESSION_COOKIE_NAME } from "@/lib/studio/owner-session";
import { commitSiteSettings } from "@/lib/studio/commit-site-settings";
import {
  commitCollectionEntry,
  commitProjectSections,
  commitBlogBlocks,
} from "@/lib/studio/commit-collection-entry";
import { sanitizeSectionsPatch } from "@/lib/studio/sections-format";
import { sanitizeGalleryPatch } from "@/lib/studio/gallery-format";
import { sanitizeBlogPatch, sanitizeBlogBlocksPatch } from "@/lib/studio/blog-format";
import {
  DRAFT_BRANCH,
  invalidateDraftStateCache,
  settingsDiffer,
} from "@/lib/studio/draft-site-settings";
import { getHomePageData, mapSiteSettings } from "@/lib/keystatic";
import { sanitizeSiteSettingsPatch } from "@/lib/studio/site-settings-format";
import { sanitizeExperiencePatch } from "@/lib/studio/experience-format";
import { sanitizeProjectsPatch } from "@/lib/studio/projects-format";
import { sanitizeSkillsPatch } from "@/lib/studio/skills-format";
import { commitSkillsDraft } from "@/lib/studio/commit-skills";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifyOwnerSession(
    jar.get(SESSION_COOKIE_NAME)?.value,
    Math.floor(Date.now() / 1000)
  );
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Parse and sanitize BEFORE the env-split, so a malformed body is rejected in
  // every mode (the fs no-op cannot mask it) and only a typed, known-field,
  // string-valued patch can ever reach the transform (review finding 5).
  let body: {
    collection?: unknown;
    singleton?: unknown;
    slug?: unknown;
    patch?: unknown;
    sections?: unknown;
    blocks?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // P4 4(b)-i — the case-study sections save. Carries { collection:"projects",
  // slug, sections } and is its own shape, NOT a `patch` key: sanitizeProjectsPatch
  // still rejects `sections` on the text path, so sections has exactly ONE writer
  // (the same one-writer discipline heroImage has). Same owner gate + env-split
  // above, same DRAFT_BRANCH, so it accumulates with every other edit (DB-1).
  if (body?.sections !== undefined) {
    if (body.collection !== "projects") {
      return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
    }
    const slug = body.slug;
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
    }
    // STRICT sanitize BEFORE the env-split, so a malformed patch is rejected in
    // every mode and the fs no-op cannot mask it.
    const sanitized = sanitizeSectionsPatch(body.sections);
    if (!sanitized.ok) {
      return NextResponse.json(sanitized, { status: 400 });
    }
    if (process.env.STUDIO_WRITE_MODE !== "github") {
      return NextResponse.json({
        ok: true,
        mode: "fs",
        saved: false,
        note: "draft save needs github mode",
      });
    }
    if (!process.env.STUDIO_GITHUB_TOKEN) {
      return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
    }
    const result = await commitProjectSections(slug, sanitized.sections, {
      branch: DRAFT_BRANCH,
      message: `chore(studio): update projects/${slug} sections draft`,
    });
    if (!result.ok) {
      const status =
        result.error.code === "not_found"
          ? 404
          : result.error.code === "unsupported_format"
            ? 422
            : 500;
      return NextResponse.json(result, { status });
    }
    invalidateDraftStateCache();
    return NextResponse.json({ ok: true, mode: "github", saved: true, sha: result.sha });
  }

  // BS-3b — the blog blocks save. Carries { collection:"blog", slug, blocks } and is its
  // own shape, NOT a `patch` key: sanitizeBlogPatch rejects `blocks` on the text path, so
  // blocks has exactly ONE writer — the same one-writer discipline `sections` and
  // `heroImage` have. Keyed off body.blocks so it cannot be confused with the projects
  // sections branch above. Same owner gate + env-split, same DRAFT_BRANCH.
  if (body?.blocks !== undefined) {
    if (body.collection !== "blog") {
      return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
    }
    const slug = body.slug;
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
    }
    // STRICT sanitize BEFORE the env-split, so a malformed patch is rejected in every
    // mode and the fs no-op cannot mask it.
    const sanitizedBlocks = sanitizeBlogBlocksPatch(body.blocks);
    if (!sanitizedBlocks.ok) {
      return NextResponse.json(sanitizedBlocks, { status: 400 });
    }
    if (process.env.STUDIO_WRITE_MODE !== "github") {
      return NextResponse.json({
        ok: true,
        mode: "fs",
        saved: false,
        note: "draft save needs github mode",
      });
    }
    if (!process.env.STUDIO_GITHUB_TOKEN) {
      return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
    }
    const result = await commitBlogBlocks(slug, sanitizedBlocks.blocks, {
      branch: DRAFT_BRANCH,
      message: `chore(studio): update blog/${slug} blocks draft`,
    });
    if (!result.ok) {
      const status =
        result.error.code === "not_found"
          ? 404
          : result.error.code === "unsupported_format"
            ? 422
            : 500;
      return NextResponse.json(result, { status });
    }
    invalidateDraftStateCache();
    return NextResponse.json({ ok: true, mode: "github", saved: true, sha: result.sha });
  }

  // CE-1 — collection entry save. Carries { collection, slug, patch }. The owner
  // gate above and the env-split below mirror the settings path; the commit
  // lands on the SAME draft branch, so a collection edit accumulates with
  // settings edits (DB-1) and both publish together from the Hero panel.
  if (body?.collection !== undefined) {
    const collection = body.collection;
    if (
      collection !== "experience" &&
      collection !== "projects" &&
      collection !== "blog" &&
      collection !== "gallery"
    ) {
      return NextResponse.json({ ok: false, error: "unsupported_collection" }, { status: 400 });
    }
    const slug = body.slug;
    // Path-traversal guard; edit-only existence is enforced in commitCollectionEntry.
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
    }
    // Explicit per-collection arms — a two-way ternary would have routed blog into the
    // experience sanitizer once the allowlist widened.
    //
    // ⚠ AND THE LAST ARM IS STILL A FALLTHROUGH, WHICH THE ALLOWLIST ABOVE IS THE ONLY THING
    // GUARDING. Widening that list without adding an arm here routes the new collection into
    // `sanitizeExperiencePatch` — the exact defect the sentence above describes, one arm further
    // out. Adding `gallery` meant touching BOTH, and a future fifth collection will too.
    const sanitizedEntry =
      collection === "projects"
        ? sanitizeProjectsPatch(body.patch)
        : collection === "blog"
          ? sanitizeBlogPatch(body.patch)
          : collection === "gallery"
            ? sanitizeGalleryPatch(body.patch)
            : sanitizeExperiencePatch(body.patch);
    if (!sanitizedEntry.ok) {
      return NextResponse.json(sanitizedEntry, { status: 400 });
    }
    if (process.env.STUDIO_WRITE_MODE !== "github") {
      return NextResponse.json({
        ok: true,
        mode: "fs",
        saved: false,
        note: "draft save needs github mode",
      });
    }
    if (!process.env.STUDIO_GITHUB_TOKEN) {
      return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
    }
    const entryResult = await commitCollectionEntry(collection, slug, sanitizedEntry.patch, {
      branch: DRAFT_BRANCH,
      message: `chore(studio): update ${collection}/${slug} draft`,
    });
    if (!entryResult.ok) {
      const status =
        entryResult.error.code === "not_found"
          ? 404
          : entryResult.error.code === "unsupported_format"
            ? 422
            : 500;
      return NextResponse.json(entryResult, { status });
    }
    // The shared draft branch changed. A collection-only edit does not yet light
    // the Hero differs badge (settings-only until CE-3's branch-level differs);
    // this drops the cached draft read regardless.
    invalidateDraftStateCache();
    return NextResponse.json({ ok: true, mode: "github", saved: true, sha: entryResult.sha });
  }

  // SK-2 — skills singleton save. Carries { singleton: "skills", patch: { categories } }.
  // Own file (content/skills.yaml), own sanitizer + commit; lands on the SAME
  // draft branch, so it accumulates with settings + collection edits (DB-1) and
  // publishes together. Owner gate above + env-split below mirror the other paths.
  if (body?.singleton !== undefined) {
    if (body.singleton !== "skills") {
      return NextResponse.json({ ok: false, error: "unsupported_singleton" }, { status: 400 });
    }
    const sanitizedSkills = sanitizeSkillsPatch(body.patch);
    if (!sanitizedSkills.ok) {
      return NextResponse.json(sanitizedSkills, { status: 400 });
    }
    if (process.env.STUDIO_WRITE_MODE !== "github") {
      return NextResponse.json({
        ok: true,
        mode: "fs",
        saved: false,
        note: "draft save needs github mode",
      });
    }
    if (!process.env.STUDIO_GITHUB_TOKEN) {
      return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
    }
    const skillsResult = await commitSkillsDraft(sanitizedSkills.categories, {
      branch: DRAFT_BRANCH,
      message: "chore(studio): update skills draft",
    });
    if (!skillsResult.ok) {
      // Typed like every other path here. It used to collapse EVERY failure to
      // 500, so a client could not tell a malformed entry apart from GitHub being
      // down, and a retry-vs-fix decision had nothing to go on.
      const status =
        skillsResult.error.code === "not_found"
          ? 404
          : skillsResult.error.code === "unsupported_format"
            ? 422
            : skillsResult.error.code === "invalid_patch"
              ? 400
              : 500;
      return NextResponse.json(skillsResult, { status });
    }
    invalidateDraftStateCache();
    return NextResponse.json({ ok: true, mode: "github", saved: true, sha: skillsResult.sha });
  }

  const sanitized = sanitizeSiteSettingsPatch(body?.patch ?? {});
  if (!sanitized.ok) {
    return NextResponse.json(sanitized, { status: 400 });
  }
  const patch = sanitized.patch;

  if (process.env.STUDIO_WRITE_MODE !== "github") {
    return NextResponse.json({
      ok: true,
      mode: "fs",
      saved: false,
      note: "draft save needs github mode",
    });
  }
  if (!process.env.STUDIO_GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: "token_not_configured" }, { status: 500 });
  }

  const result = await commitSiteSettings(patch, {
    branch: DRAFT_BRANCH,
    message: "chore(studio): update site settings draft",
  });
  if (!result.ok) {
    const status = result.error.code === "invalid_url" ? 422 : 500;
    return NextResponse.json(result, { status });
  }

  // The draft branch just changed, so drop the cached draft read (GH-8) for the
  // next settings-page render.
  invalidateDraftStateCache();

  // The response differs comes from the BYTES this save just committed (review
  // finding 6), never from the cache, which Next may serve stale within the
  // same request. Reads live only; never writes main.
  const live = (await getHomePageData()).settings;
  const draftEntry = mapSiteSettings((load(result.bytes) ?? {}) as Record<string, unknown>);
  return NextResponse.json({
    ok: true,
    mode: "github",
    saved: true,
    sha: result.sha,
    differs: settingsDiffer(live, draftEntry),
  });
}
