"use server";

// TODO: gate behind server-side auth before prod.
// An unauthenticated write is a content-tampering vector. B (inline editing)
// must not leave local dev until this action checks an authenticated session.

import { promises as fs } from "node:fs";
import path from "node:path";
import { load, dump } from "js-yaml";
import { revalidatePath } from "next/cache";
import {
  transformSiteSettings,
  type SiteSettingsInput,
  type SaveResult,
  type SiteSettingsRecord,
} from "./site-settings-format";

const FILE = path.join(process.cwd(), "content", "site-settings.yaml");

/**
 * Read-modify-write the siteSettings singleton. Reads the current YAML, applies
 * the patch through the pure transform (strip empties, validate urls, reorder),
 * and only then dumps and writes it back. Never constructs the file from
 * scratch, so photo, aboutFocusChips, and any untouched field are preserved.
 */
export async function saveSiteSettings(
  patch: Partial<SiteSettingsInput>
): Promise<SaveResult> {
  let loaded: SiteSettingsRecord;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    loaded = (load(raw) ?? {}) as SiteSettingsRecord;
  } catch (e) {
    return { ok: false, error: { code: "read_failed", message: messageOf(e) } };
  }

  const result = transformSiteSettings(loaded, patch);
  if (!result.ok) return result;

  try {
    await fs.writeFile(FILE, dump(result.value), "utf8");
  } catch (e) {
    return { ok: false, error: { code: "write_failed", message: messageOf(e) } };
  }

  // The reader reads fresh from disk but lib/studio/data.ts wraps it in a
  // request-scoped cache() and routes may be cached, so surface the change.
  revalidatePath("/", "layout");
  revalidatePath("/studio/settings");

  return { ok: true };
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
