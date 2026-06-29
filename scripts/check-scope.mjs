// @ts-nocheck
/**
 * Scope guard — makes "one change = one scope" real and makes cross-app blast
 * radius VISIBLE. Unlike a self-attested scope file, this DERIVES the touched
 * scope from the actual diff, so an agent cannot mislabel a change.
 *
 * Usage:
 *   node scripts/check-scope.mjs                 # check working-tree changes
 *   node scripts/check-scope.mjs --base=origin/main   # check vs a base ref (CI)
 *   node scripts/check-scope.mjs --scope=app:web # assert the change is web-only
 *   node scripts/check-scope.mjs --allow-multi   # permit a multi-scope change
 *
 * Fails when:
 *   - the change spans more than one app (cross-app edit), or
 *   - an app change also edits a shared package or root infra (silent ride-along), or
 *   - a declared --scope doesn't match what was actually touched.
 * A shared-package or root-only change is allowed but its blast radius is printed.
 */
import { loadManifest, changedFiles, ownersOf, isGitRepo, C } from "./_manifest.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const manifest = loadManifest();
const byId = new Map(manifest.workspaces.map((w) => [w.id, w]));
const appsThatImport = (pkgName) =>
  manifest.workspaces.filter((w) => w.kind === "app" && (w.mayImport || []).includes(pkgName));

if (!isGitRepo()) {
  console.log(
    C.yellow(
      "⚠ check-scope: not a git repository — cannot derive changed files.\n" +
        "  Initialize git (`git init`) to enable scope checking, or run this in CI with --base.",
    ),
  );
  process.exit(0);
}

const files = changedFiles({ base: args.base }) || [];
if (files.length === 0) {
  console.log(C.green("✓ check-scope: no changes to check."));
  process.exit(0);
}

// Map each changed file to the workspace(s) that own it.
const touched = new Map(); // id -> { ws, files: [] }
const unowned = [];
for (const file of files) {
  const owners = ownersOf(file, manifest);
  if (owners.length === 0) {
    unowned.push(file);
    continue;
  }
  // Most specific owner: prefer a non-root match over root.
  const owner = owners.find((w) => w.kind !== "root") || owners[0];
  if (!touched.has(owner.id)) touched.set(owner.id, { ws: owner, files: [] });
  touched.get(owner.id).files.push(file);
}

const touchedApps = [...touched.values()].filter((t) => t.ws.kind === "app");
const touchedShared = [...touched.values()].filter((t) => t.ws.kind === "package" || t.ws.kind === "config");
const touchedRoot = [...touched.values()].filter((t) => t.ws.kind === "root");

// Report.
console.log(C.bold("\nScope report (derived from git diff):"));
for (const t of touched.values()) {
  const tag = t.ws.kind === "app" ? C.green(t.ws.id) : C.yellow(t.ws.id);
  console.log(`  ${tag} ${C.dim("(" + t.files.length + " file(s))")}`);
  for (const f of t.files.slice(0, 8)) console.log(C.dim(`      ${f}`));
  if (t.files.length > 8) console.log(C.dim(`      … +${t.files.length - 8} more`));
}
if (unowned.length) {
  console.log(C.yellow("  unscoped (treated as shared/root):"));
  for (const f of unowned.slice(0, 8)) console.log(C.dim(`      ${f}`));
}

// Blast radius for shared / root edits.
for (const t of touchedShared) {
  const consumers = appsThatImport(t.ws.name);
  const who = consumers.length ? consumers.map((a) => a.name).join(", ") : "potentially all apps";
  console.log(C.yellow(`  ↳ ${t.ws.id} is shared — this change affects: ${who}`));
}
if (touchedRoot.length) {
  console.log(C.yellow("  ↳ root infra changed — this affects EVERY app (build/lint/deps/boundaries)."));
}

// Policy.
const problems = [];
if (touchedApps.length > 1) {
  problems.push(
    `Change spans ${touchedApps.length} apps (${touchedApps.map((t) => t.ws.name).join(", ")}). ` +
      `Split it: one app per change. (override with --allow-multi)`,
  );
}
if (touchedApps.length >= 1 && (touchedShared.length || touchedRoot.length || unowned.length)) {
  problems.push(
    `An app change is riding along with shared/root edits. Shared-package and root changes must be their own scope, ` +
      `not bundled with an app change (they affect every app). (override with --allow-multi)`,
  );
}
if (args.scope) {
  const declared = byId.get(args.scope);
  if (!declared) {
    problems.push(`--scope "${args.scope}" is not a known workspace id.`);
  } else {
    const stray = [...touched.values()].filter((t) => t.ws.id !== args.scope && t.ws.kind !== "root");
    if (stray.length || (args.scope !== "root" && touchedRoot.length)) {
      problems.push(
        `Declared --scope=${args.scope} but also touched: ${[...stray.map((s) => s.ws.id), ...touchedRoot.map((r) => r.ws.id)].join(", ")}.`,
      );
    }
  }
}

if (problems.length && !args["allow-multi"]) {
  console.error(C.red(C.bold(`\n✗ check-scope: ${problems.length} scope violation(s)\n`)));
  for (const p of problems) console.error(C.red("  • ") + p);
  console.error(C.dim("\n  See repo.manifest.json → conventions.oneChangeOneScope.\n"));
  process.exit(1);
}

console.log(C.green("\n✓ check-scope: change is within a single scope.\n"));
