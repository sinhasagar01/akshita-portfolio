// The shared DOM/CSS proof tool. Snapshots a production build's public surface so two
// builds can be compared byte for byte.
//
// Usage:
//   node scripts/normalize-dom.mjs <buildRoot> <outDir>      e.g. node scripts/normalize-dom.mjs .next /tmp/snap-a
//   node scripts/normalize-dom.mjs --restore-mtimes <fromRepo> <toWorktree>
//
// HOW TO USE IT AS A GATE. Always run the DETERMINISM CONTROL first: build the BASE branch
// twice and diff the two snapshots. If that is not empty the normalizer is unsound and any
// comparison against a feature branch is meaningless. Only then build the branch and diff.
//
// ------------------------------------------------------------------ normalizer vs blindfold
// Every rule below masks something that provably varies BETWEEN BUILDS OF IDENTICAL SOURCE.
// That is the line. A rule that masked something which varies with the SOURCE would not be
// normalising, it would be blindfolding the gate — it would make the tool report "identical"
// for a real change.
//
// The JSON-LD dates are the case that shows why the line matters. `projectLastModified`
// (lib/site.ts) reads content-file MTIME, and a fresh `git worktree` restamps every file,
// so a worktree build differs from a repo build. Masking the dates here would have been
// easy and WRONG: a genuine content edit also moves those dates, and the gate would have
// gone quiet on it forever. So the dates are NOT normalised. `--restore-mtimes` fixes the
// harness instead, and the gate stays able to see a real date change.
//
// Each trap below is annotated with the PR whose two-build control caught it. None is
// speculative; every one of them produced a false diff first.
import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync, utimesSync, statSync, existsSync } from "node:fs";
import path from "node:path";

/** Directories whose mtimes feed rendered output (lib/site.ts reads them for JSON-LD and
 *  the sitemap). A fresh checkout restamps them all. */
const MTIME_SOURCES = ["content", "public", "lib/case-studies"];

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

export function normalize(html) {
  return (
    html
      // TRAP 1 (BS-3a) — the build id. It appears as a JSON field AND as a bare comment,
      // and it is base64url, so BOTH "-" and "_" occur in it. A [A-Za-z0-9]+ character
      // class silently fails to match roughly half of all build ids.
      .replace(/"buildId":"[^"]*"/g, '"buildId":"BUILD"')
      .replace(/<!--[A-Za-z0-9_-]{18,}-->/g, "<!--BUILD-->")
      // TRAP 2 (BS-3a, corrected BS-4a) — hashed static asset paths. Route groups put a
      // ")" INSIDE the path, e.g. /_next/static/chunks/app/(portfolio)/page-0e10.js, so
      // ")" must NOT terminate the match. Excluding it left the per-chunk hashes visible
      // and made the gate report a diff for a PR that touched no component: adding any
      // route reshuffles the chunk graph.
      .replace(/\/_next\/static\/[^"'\s]+/g, "/_next/static/ASSET")
      // TRAP 3 (BS-3a, corrected BS-4b) — the RSC flight payload. Masking each <script>
      // is not enough: React splits the payload across a VARYING NUMBER of tags, so two
      // builds of identical source can differ by a tag boundary alone. The contents are
      // already declared meaningless by the mask, so the count is too — hence the collapse.
      .replace(/<script>self\.__next_f[\s\S]*?<\/script>/g, "<script>FLIGHT</script>")
      .replace(/(?:<script>FLIGHT<\/script>)+/g, "<script>FLIGHT</script>")
      // TRAP 4 — per-response nonces.
      .replace(/nonce="[^"]*"/g, 'nonce="N"')
  );
}

export function snapshot(buildRoot, outDir) {
  rmSync(outDir, { recursive: true, force: true }); // never inherit a stale run
  mkdirSync(outDir, { recursive: true });

  const appDir = path.join(buildRoot, "server/app");
  let html = 0;
  for (const f of walk(appDir)) {
    if (!f.endsWith(".html")) continue;
    const rel = path.relative(appDir, f).replace(/[/\\]/g, "__");
    writeFileSync(path.join(outDir, `html__${rel}`), normalize(readFileSync(f, "utf8")));
    html++;
  }

  // CSS keyed by CONTENT, not by directory order: the filename carries a content hash, so
  // readdirSync order can swap between builds even when nothing changed. Concatenated
  // sorted, so the snapshot is one comparable artefact.
  const cssDir = path.join(buildRoot, "static/css");
  const css = existsSync(cssDir)
    ? readdirSync(cssDir)
        .filter((f) => f.endsWith(".css"))
        .map((f) => readFileSync(path.join(cssDir, f), "utf8"))
        .sort()
    : [];
  writeFileSync(path.join(outDir, "css__all"), css.join("\n/* --- */\n"));

  return { html, css: css.length };
}

/**
 * Copy mtimes from a real checkout onto a worktree, for MTIME_SOURCES only.
 *
 * NOT a normalizer rule, deliberately — see the header. `git worktree add` stamps every
 * file with the checkout time, which moves the JSON-LD dates and makes a worktree build
 * differ from a repo build for reasons that have nothing to do with the source. This
 * fixes the harness so the gate can still see a real date change.
 */
export function restoreMtimes(fromRepo, toWorktree) {
  let touched = 0;
  for (const rel of MTIME_SOURCES) {
    const src = path.join(fromRepo, rel);
    if (!existsSync(src)) continue;
    for (const f of walk(src)) {
      const target = path.join(toWorktree, path.relative(fromRepo, f));
      if (!existsSync(target)) continue;
      // SECONDS AS FLOATS, not Date objects. Passing Dates round-trips through a
      // conversion that rounds, and the residue is real: a 1ms drift moved a JSON-LD
      // `datePublished` from .457Z to .458Z and made two otherwise-identical builds
      // differ. mtimeMs / 1000 keeps sub-millisecond precision intact.
      const st = statSync(f);
      utimesSync(target, st.atimeMs / 1000, st.mtimeMs / 1000);
      touched++;
    }
  }
  return touched;
}

const [, , a, b, c] = process.argv;
if (a === "--restore-mtimes") {
  console.log(`restored mtimes on ${restoreMtimes(b, c)} files`);
} else if (a && b) {
  const { html, css } = snapshot(a, b);
  console.log(`snapshot: ${html} html, ${css} css -> ${path.basename(b)}`);
} else {
  console.error("usage: normalize-dom.mjs <buildRoot> <outDir> | --restore-mtimes <repo> <worktree>");
  process.exit(1);
}
