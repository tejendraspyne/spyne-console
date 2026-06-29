// @ts-nocheck
/**
 * Drift + policy guard for repo.manifest.json. Fails the build when the
 * manifest and reality diverge, or when a boundary rule is structurally unsafe.
 * Run via `pnpm run boundaries:check`.
 *
 * Checks:
 *  1. Every apps/* and packages/* directory has a manifest entry (no untracked
 *     workspace escapes the boundary system).
 *  2. Every non-root workspace has package.json + AGENTS.md.
 *  3. Apps are leaves: no app's `owns` overlaps another app or a package, and no
 *     app `mayImport`s another app.
 *  4. Each package's declared publicEntry matches its package.json `exports`
 *     and contains no "./*" wildcard.
 *  5. Each app's eslint config still spreads the boundaries config (tamper check).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadManifest, repoRoot, fileMatchesGlobs, C } from "./_manifest.mjs";

const manifest = loadManifest();
const errors = [];
const err = (m) => errors.push(m);

const workspaces = manifest.workspaces;
const apps = workspaces.filter((w) => w.kind === "app");
const byName = new Map(workspaces.map((w) => [w.name, w]));

// 1. On-disk dirs must be registered.
for (const group of ["apps", "packages"]) {
  const dir = join(repoRoot, group);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = `${group}/${entry.name}`;
    if (!workspaces.some((w) => w.path === path)) {
      err(`Unregistered workspace "${path}" — add an entry to repo.manifest.json.`);
    }
  }
}

// 2. Structural files per workspace.
for (const w of workspaces) {
  if (w.kind === "root") continue;
  const dir = join(repoRoot, w.path);
  if (!existsSync(dir)) {
    err(`Workspace "${w.id}" path "${w.path}" does not exist.`);
    continue;
  }
  if (!existsSync(join(dir, "package.json"))) {
    err(`Workspace "${w.id}" is missing package.json.`);
  }
  if (!existsSync(join(dir, "AGENTS.md"))) {
    err(`Workspace "${w.id}" is missing AGENTS.md (every workspace must document its boundary).`);
  }
}

// 3. Apps are leaves.
for (const a of apps) {
  for (const other of workspaces) {
    if (other.id === a.id) continue;
    // An app's owns globs must not reach into another workspace's tree.
    if (other.path !== "." && a.owns.some((g) => g.startsWith(other.path + "/"))) {
      err(`App "${a.id}" owns paths inside "${other.id}" (${other.path}). Apps must own only their own tree.`);
    }
  }
  for (const imp of a.mayImport || []) {
    const target = byName.get(imp);
    if (target && target.kind === "app") {
      err(`App "${a.id}" may not import another app ("${imp}"). Apps are leaves.`);
    }
    if (imp.startsWith("apps/") || imp.startsWith("app:")) {
      err(`App "${a.id}" mayImport contains an app reference ("${imp}"). Apps are leaves.`);
    }
  }
}

// 4. publicEntry <-> exports parity.
for (const w of workspaces) {
  if (!w.publicEntry) continue;
  const pkgPath = join(repoRoot, w.path, "package.json");
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const exportKeys = Object.keys(pkg.exports || {});
  if (exportKeys.includes("./*")) {
    err(`Package "${w.id}" exports a "./*" wildcard — tighten to explicit entry points so internals can't be deep-imported.`);
  }
  for (const entry of w.publicEntry) {
    if (!exportKeys.includes(entry)) {
      err(`Package "${w.id}" publicEntry "${entry}" is not in its package.json exports (${exportKeys.join(", ") || "none"}).`);
    }
  }
}

// 5. Boundary lint tamper check.
for (const a of apps) {
  const candidates = ["eslint.config.js", "eslint.config.mjs"].map((f) => join(repoRoot, a.path, f));
  const cfg = candidates.find(existsSync);
  if (!cfg) {
    err(`App "${a.id}" has no eslint config.`);
    continue;
  }
  const text = readFileSync(cfg, "utf8");
  if (!text.includes("boundaries")) {
    err(`App "${a.id}" eslint config no longer spreads the boundaries config — Wall 1 is disarmed for this app.`);
  }
  // only-warn downgrades boundary errors to warnings, so the lint gate depends
  // on --max-warnings 0. Make sure an app can't quietly raise its warning budget.
  const pkg = JSON.parse(readFileSync(join(repoRoot, a.path, "package.json"), "utf8"));
  const lintScript = pkg.scripts?.lint || "";
  if (!/--max-warnings\s+0\b/.test(lintScript)) {
    err(`App "${a.id}" lint script must keep "--max-warnings 0" (it is what makes boundary warnings fail). Found: "${lintScript}".`);
  }
}

if (errors.length) {
  console.error(C.red(C.bold(`\n✗ validate-manifest: ${errors.length} problem(s)\n`)));
  for (const e of errors) console.error(C.red("  • ") + e);
  console.error("");
  process.exit(1);
}
console.log(C.green("✓ validate-manifest: manifest, workspaces, and boundary configs are consistent."));
